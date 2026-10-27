// Broken-link check over built sites in dist/. Run after `npm run build:all`.
//   npm run check-links                     internal links for every built site
//   npm run check-links -- --external       also check outside links (giving pages, social...)
//   npm run check-links -- riverlight-church
import fs from 'node:fs';
import path from 'node:path';
import { ROOT } from '../lib/load.mjs';

const args = process.argv.slice(2);
const external = args.includes('--external');
const json = args.includes('--json');
const distDir = path.join(ROOT, 'dist');
const named = args.filter((a) => !a.startsWith('--'));
const slugs = named.length ? named : fs.existsSync(distDir) ? fs.readdirSync(distDir) : [];
if (!slugs.length) {
  console.error('Nothing in dist/. Run npm run build:all first.');
  process.exit(1);
}

function htmlFiles(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((d) => {
    const p = path.join(dir, d.name);
    return d.isDirectory() ? htmlFiles(p) : d.name.endsWith('.html') ? [p] : [];
  });
}

function resolves(root, href) {
  const clean = decodeURIComponent(href.split(/[?#]/)[0]);
  if (!clean || clean === '/') return fs.existsSync(path.join(root, 'index.html'));
  const p = path.join(root, clean);
  return fs.existsSync(p) && fs.statSync(p).isFile() ? true : fs.existsSync(path.join(p, 'index.html')) || fs.existsSync(`${p}.html`);
}

const checked = new Map();
async function checkUrl(url) {
  if (!checked.has(url)) {
    checked.set(url, (async () => {
      for (const method of ['HEAD', 'GET']) {
        try {
          const r = await fetch(url, { method, redirect: 'follow', signal: AbortSignal.timeout(15000), headers: { 'user-agent': 'Mozilla/5.0 (link check)' } });
          if (r.ok) return null;
          if (method === 'GET') return `HTTP ${r.status}`;
        } catch (e) {
          if (method === 'GET') return e.name === 'TimeoutError' ? 'timeout' : e.message;
        }
      }
    })());
  }
  return checked.get(url);
}

const results = {};
let total = 0;
for (const slug of slugs) {
  const root = path.join(distDir, slug);
  if (!fs.existsSync(root)) {
    console.error(`dist/${slug} not built.`);
    continue;
  }
  const problems = [];
  const outside = new Map();
  for (const file of htmlFiles(root)) {
    const page = '/' + path.relative(root, file).replace(/index\.html$/, '').replace(/\\/g, '/');
    const html = fs.readFileSync(file, 'utf8');
    for (const [, attr, url] of html.matchAll(/\s(href|src)="([^"]+)"/g)) {
      if (/^(mailto:|tel:|data:|#|javascript:)/.test(url)) continue;
      if (/^https?:\/\//.test(url)) {
        if (!outside.has(url)) outside.set(url, page);
      } else if (url.startsWith('/') && !url.startsWith('//')) {
        if (!resolves(root, url)) problems.push({ page, url, error: 'missing file' });
      }
    }
  }
  if (external) {
    const skip = /fonts\.(googleapis|gstatic)\.com|google\.com\/maps|maps\.google\.com|calendar\.google\.com\/calendar\/embed|youtube(-nocookie)?\.com\/embed/;
    await Promise.all(
      [...outside].filter(([u]) => !skip.test(u)).map(async ([url, page]) => {
        const err = await checkUrl(url);
        if (err) problems.push({ page, url, error: err });
      }),
    );
  }
  results[slug] = problems;
  total += problems.length;
  if (!json) {
    console.log(`${problems.length ? '✗' : '✓'} ${slug}: ${problems.length} broken link(s)`);
    for (const p of problems) console.log(`    ${p.page} → ${p.url} (${p.error})`);
  }
}
if (json) console.log(JSON.stringify(results, null, 2));
process.exitCode = total ? 1 : 0;
