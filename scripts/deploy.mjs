// Deploy built sites to Cloudflare Pages, one Pages project per church.
//   CLOUDFLARE_API_TOKEN=... CLOUDFLARE_ACCOUNT_ID=... node scripts/deploy.mjs <slug|business> ...
// Projects are named <pagesProjectPrefix><slug> (brand.json) and created on first deploy.
// After the first deploy, add the custom domain in Cloudflare: <slug>.<brand domain> for
// previews, or the church's own domain at launch (Pages → project → Custom domains).
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { brand, ROOT } from '../lib/load.mjs';

const targets = process.argv.slice(2);
if (!targets.length) {
  console.error('Usage: node scripts/deploy.mjs <slug|business> ...');
  process.exit(1);
}
const run = (args) => spawnSync('npx', ['--yes', 'wrangler@3', ...args], { cwd: ROOT, stdio: 'inherit', env: process.env }).status;
const failed = [];
for (const t of targets) {
  const dir = t === 'business' ? path.join(ROOT, 'business', 'dist') : path.join(ROOT, 'dist', t);
  if (!fs.existsSync(dir)) {
    console.error(`${path.relative(ROOT, dir)} is missing; build it first.`);
    failed.push(t);
    continue;
  }
  const project = `${brand.pagesProjectPrefix}${t}`;
  // Fails harmlessly if the project already exists.
  run(['pages', 'project', 'create', project, '--production-branch', 'main']);
  if (run(['pages', 'deploy', dir, '--project-name', project, '--branch', 'main', '--commit-dirty=true']) !== 0) failed.push(t);
}
if (failed.length) {
  console.error(`Deploy failed: ${failed.join(', ')}`);
  process.exit(1);
}
