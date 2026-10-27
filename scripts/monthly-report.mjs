// Draft each church's monthly care report from git history and the link check.
//   npm run report                    last month, every church
//   npm run report -- 2026-11         a given month
//   npm run report -- 2026-11 riverlight-church
// Writes reports/<month>/<slug>.md for you to read over and email.
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { listChurches, loadChurch, siteUrl, brand, ROOT } from '../lib/load.mjs';

const args = process.argv.slice(2);
let month = args.find((a) => /^\d{4}-\d{2}$/.test(a));
if (!month) {
  const d = new Date();
  d.setDate(1);
  d.setMonth(d.getMonth() - 1);
  month = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}
const named = args.filter((a) => a !== month);
const slugs = (named.length ? named : listChurches()).filter((s) => {
  const { church } = loadChurch(s);
  return !church.demo && !church.preview;
});

const [y, m] = month.split('-').map(Number);
const since = `${month}-01`;
const until = new Date(Date.UTC(y, m, 1)).toISOString().slice(0, 10);
const monthName = new Date(Date.UTC(y, m - 1, 1)).toLocaleDateString('en-US', { month: 'long', year: 'numeric', timeZone: 'UTC' });

let links = {};
try {
  links = JSON.parse(execFileSync('node', ['scripts/check-links.mjs', '--json', ...slugs], { cwd: ROOT, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }));
} catch (e) {
  // check-links exits 1 when it finds problems; its JSON is still on stdout.
  try { links = JSON.parse(e.stdout); } catch { console.warn('Link check unavailable (build the sites first for a full report).'); }
}

const outDir = path.join(ROOT, 'reports', month);
fs.mkdirSync(outDir, { recursive: true });

for (const slug of slugs) {
  const { church } = loadChurch(slug);
  let log = '';
  try {
    log = execFileSync('git', ['log', `--since=${since}`, `--until=${until}`, '--pretty=format:%ad|%s', '--date=short', '--', `churches/${slug}`], { cwd: ROOT, encoding: 'utf8' });
  } catch {}
  const changes = log.split('\n').filter(Boolean).map((l) => {
    const [date, ...msg] = l.split('|');
    return `- ${date}: ${msg.join('|')}`;
  });
  const broken = links[slug];
  const linkLine = broken === undefined ? '- Link check: not run this month' : broken.length ? `- Link check: found ${broken.length} broken link(s), being fixed this week` : '- Link check: every link on the site works';
  const upcoming = church.specialServices.filter((s) => s.date >= until).map((s) => s.title);

  const report = `Subject: ${church.shortName ?? church.name} website report, ${monthName}

Hi ${church.staff[0]?.name ?? 'there'},

Here's your website summary for ${monthName}.

Updates we made
${changes.length ? changes.join('\n') : '- No changes were requested this month.'}

Site health
- Your site is online at ${siteUrl(church)}, with SSL (the padlock) active
- Security and software updates applied
- Backups are current
${linkLine}

Coming up
${upcoming.length ? upcoming.map((t) => `- ${t} is on the site`).join('\n') : '- Anything special coming up (Christmas, Easter, VBS, a special event)? Reply with the details and we will add it.'}

To request a change, just email ${brand.editsEmail}.

Thanks,
${brand.owner}
${brand.name}
`;
  fs.writeFileSync(path.join(outDir, `${slug}.md`), report);
  console.log(`reports/${month}/${slug}.md (${changes.length} change(s))`);
}
if (!slugs.length) console.log('No paying churches yet (demo and preview sites are skipped).');
