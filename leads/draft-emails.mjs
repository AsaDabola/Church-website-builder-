// Step 4: draft a personal email for each church that has a preview.
//   npm run leads:emails
// Writes leads/data/emails/<slug>.txt (first email + 5-day follow-up) and outreach.csv to track sends.
// Claude drafts; you read, personalize the first line, and send from your own domain.
// Keep it to about 20-30 a week. Every email carries your business address and an opt-out line (CAN-SPAM).
import fs from 'node:fs';
import path from 'node:path';
import { DATA_DIR, readJson, toCsv } from './lib.mjs';
import { brand, CHURCHES_DIR, siteUrl } from '../lib/load.mjs';

const scored = readJson(path.join(DATA_DIR, 'scored.json'), []);
const previews = readJson(path.join(DATA_DIR, 'previews.json'), {});
const optOutsFile = path.join(DATA_DIR, 'opt-outs.txt');
const optOuts = new Set(fs.existsSync(optOutsFile) ? fs.readFileSync(optOutsFile, 'utf8').split('\n').map((s) => s.trim().toLowerCase()).filter(Boolean) : []);
const outDir = path.join(DATA_DIR, 'emails');
fs.mkdirSync(outDir, { recursive: true });

const trackerFile = path.join(DATA_DIR, 'outreach.csv');
const existing = new Map();
if (fs.existsSync(trackerFile)) {
  const [header, ...lines] = fs.readFileSync(trackerFile, 'utf8').trim().split('\n');
  const cols = header.split(',');
  for (const line of lines) {
    const vals = line.match(/("([^"]|"")*"|[^,]*)(,|$)/g).map((v) => v.replace(/,$/, '').replace(/^"|"$/g, '').replace(/""/g, '"'));
    const row = Object.fromEntries(cols.map((c, i) => [c, vals[i] ?? '']));
    existing.set(row.slug, row);
  }
}

const footer = `--
${brand.owner}, ${brand.name}
${brand.phone} · ${brand.domain}
${brand.mailingAddress}

If you'd rather not hear from me again, just reply "no thanks" and I won't email you again.`;

let count = 0;
for (const lead of scored) {
  const p = previews[lead.place_id];
  if (!p || !fs.existsSync(path.join(CHURCHES_DIR, p.slug, 'church.json'))) continue;
  const church = JSON.parse(fs.readFileSync(path.join(CHURCHES_DIR, p.slug, 'church.json'), 'utf8'));
  if (!church.preview) continue; // already a client
  const to = lead.emails?.[0] ?? '';
  if (to && optOuts.has(to)) continue;
  const url = siteUrl(church);
  const problems = lead.problems.slice(0, 3);
  const noSite = lead.problem_keys.some((k) => k.startsWith('no_website'));

  const first = `To: ${to || '(find an email: their site, Facebook page, or call the office)'}
Subject: A new website for ${lead.name} (already built, free to look)

Hi Pastor,

My name is ${brand.owner} and I build websites for churches here in ${brand.region}. ${noSite ? `I was looking for churches in ${lead.town.replace(/,.*$/, '')} and noticed ${lead.name} doesn't have a website yet,` : `I came across ${lead.name}'s website and noticed a few things that might be keeping visitors away,`} so I put together a free preview of what a new one could look like:

${url}

${problems.length && !noSite ? `A few things I noticed on the current ${noSite ? 'listing' : 'site'}:\n${problems.map((x, i) => `${i + 1}. ${x}`).join('\n')}\n\n` : ''}There's no cost to look and no obligation. If you like it, I handle everything: hosting, security, updates, and changes whenever you email me, usually done the same week. Plans start at $49 a month.

Would you be open to a 20-minute call to talk it over? You can pick a time here: ${brand.bookingUrl}

Blessings,
${footer}
`;

  const followUp = `To: ${to}
Subject: Re: A new website for ${lead.name} (already built, free to look)

Hi Pastor,

Just following up on the website preview I made for ${lead.name}:
${url}

Happy to change anything on it (colors, photos, wording) so you can see your church the way you'd want visitors to. If now isn't the right time, no problem at all.

Blessings,
${footer}
`;

  fs.writeFileSync(path.join(outDir, `${p.slug}.txt`), `${first}\n\n===== FOLLOW-UP (send 5 days later if no reply) =====\n\n${followUp}`);
  if (!existing.has(p.slug)) {
    existing.set(p.slug, { slug: p.slug, name: lead.name, town: lead.town, email: to, phone: lead.phone, preview_url: url, score: lead.score, sent: '', follow_up_due: '', followed_up: '', replied: '', call_booked: '', status: 'drafted' });
  }
  count++;
}

const cols = ['slug', 'name', 'town', 'email', 'phone', 'preview_url', 'score', 'sent', 'follow_up_due', 'followed_up', 'replied', 'call_booked', 'status'];
fs.writeFileSync(trackerFile, toCsv([...existing.values()], cols));
console.log(`Drafted ${count} email(s) in leads/data/emails/. Track sends in leads/data/outreach.csv (fill "sent"; follow up 5 days later).`);
