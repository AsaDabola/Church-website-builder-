// Step 2: score every church's current website. Higher score = better lead.
//   npm run leads:score              score leads not scored yet
//   npm run leads:score -- --rescore everything again
// Checks the 5-point audit (mobile, speed, service times, giving link, contact info)
// plus HTTPS and copyright year. Churches with no website at all score highest.
// Output: leads/data/scored.json and scored.csv, best leads first.
import fs from 'node:fs';
import path from 'node:path';
import { DATA_DIR, readJson, writeJson, toCsv, pool } from './lib.mjs';

const rescore = process.argv.includes('--rescore');
const leads = readJson(path.join(DATA_DIR, 'leads.json'), []);
if (!leads.length) {
  console.error('No leads yet. Run npm run leads:pull first.');
  process.exit(1);
}
const scoredFile = path.join(DATA_DIR, 'scored.json');
const prior = new Map(readJson(scoredFile, []).map((s) => [s.place_id, s]));
const thisYear = new Date().getFullYear();
const UA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1';

// Each problem: points (how much it helps the pitch) and the sentence used in outreach emails.
const PROBLEMS = {
  no_website: [150, "There's no website, so people searching for a church nearby can't find your service times or directions."],
  site_down: [80, "The website isn't loading right now, so visitors see an error instead of your church."],
  no_https: [25, 'Chrome and Safari mark the site "Not secure" because it has no SSL certificate.'],
  not_mobile: [30, "The site isn't built for phones, so most visitors have to pinch and zoom to read it."],
  slow: [15, 'The home page takes over 3 seconds to load, and many visitors leave before it finishes.'],
  no_service_times: [25, "Service times aren't on the home page, and that's the first thing a new visitor looks for."],
  no_giving: [15, "There's no online giving link, so members who don't carry cash or checks can't give."],
  old_copyright: [15, 'The footer still says © {year}, which tells visitors the site may be out of date.'],
  no_contact: [10, "There's no phone number or email on the home page."],
};

function textOf(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;|&#160;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ');
}

async function audit(lead) {
  const found = [];
  const add = (key, extra = {}) => found.push({ key, points: PROBLEMS[key][0], ...extra });
  const result = { emails: [], builder: '', final_url: '', load_ms: '' };

  if (!lead.website) {
    add('no_website');
    return { ...result, found };
  }
  let url = lead.website.trim();
  if (!/^https?:\/\//.test(url)) url = `http://${url}`;

  let res, html, ms;
  try {
    const t = performance.now();
    res = await fetch(url, { redirect: 'follow', signal: AbortSignal.timeout(20000), headers: { 'user-agent': UA } });
    html = await res.text();
    ms = Math.round(performance.now() - t);
  } catch (e) {
    add('site_down', { detail: e.cause?.code ?? e.name });
    return { ...result, found };
  }
  if (!res.ok) {
    add('site_down', { detail: `HTTP ${res.status}` });
    return { ...result, found };
  }
  result.final_url = res.url;
  result.load_ms = ms;

  // Social-only "websites" (a Facebook page) count as having no site.
  if (/facebook\.com|instagram\.com/.test(res.url)) {
    add('no_website', { detail: 'Facebook page only' });
    return { ...result, found };
  }

  if (!res.url.startsWith('https://')) add('no_https');
  if (!/<meta[^>]+name=["']?viewport/i.test(html)) add('not_mobile');
  if (ms > 3000) add('slow', { detail: `${(ms / 1000).toFixed(1)}s` });

  const text = textOf(html);
  const timeRe = /\b\d{1,2}(:\d{2})?\s*(a\.?m\.?|p\.?m\.?)/i;
  const hasTimes = /(sunday|worship|service|mass|gathering)/i.test(text) && timeRe.test(text);
  if (!hasTimes) add('no_service_times');

  const anchors = [...html.matchAll(/<a\b[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi)].map((m) => `${m[1]} ${textOf(m[2])}`);
  if (!anchors.some((a) => /\b(give|giving|donat|tithe|offering|tithe\.ly|pushpay|paypal|vanco|givelify|onrealm)/i.test(a))) add('no_giving');

  const years = [...text.matchAll(/(?:©|copyright)\s*(?:\d{4}\s*[-–]\s*)?(\d{4})/gi)].map((m) => Number(m[1])).filter((y) => y > 1995 && y <= thisYear);
  if (years.length && Math.max(...years) < thisYear - 1) {
    const y = Math.max(...years);
    found.push({ key: 'old_copyright', points: PROBLEMS.old_copyright[0], detail: String(y), year: y });
  }

  const emails = [...new Set([...html.matchAll(/mailto:([^"'?>\s]+)/gi)].map((m) => decodeURIComponent(m[1]).toLowerCase()))];
  result.emails = emails.filter((e) => /^[^@\s]+@[^@\s]+\.[a-z]{2,}$/.test(e));
  const hasPhone = /\(?\d{3}\)?[\s.-]\d{3}[\s.-]\d{4}/.test(text) || /href=["']tel:/i.test(html);
  if (!hasPhone && !result.emails.length) add('no_contact');

  const gen = html.match(/<meta[^>]+name=["']generator["'][^>]+content=["']([^"']+)/i)?.[1] ?? '';
  result.builder =
    /wix\.com|wixstatic/i.test(html) ? 'Wix'
    : /squarespace/i.test(html) ? 'Squarespace'
    : /weebly/i.test(html) ? 'Weebly'
    : /wp-content|wordpress/i.test(html + gen) ? 'WordPress'
    : /godaddy|websites\.godaddy|img1\.wsimg/i.test(html) ? 'GoDaddy'
    : /churchco|clover|nucleus|ekklesia360|subsplash|faithlife/i.test(html) ? 'Church platform'
    : gen.split(' ')[0];

  return { ...result, found };
}

const todo = leads.filter((l) => rescore || !prior.has(l.place_id));
console.log(`Scoring ${todo.length} site(s)...`);
let done = 0;
await pool(todo, 8, async (lead) => {
  const a = await audit(lead);
  const score = a.found.reduce((s, p) => s + p.points, 0);
  const problems = a.found
    .sort((x, y) => y.points - x.points)
    .map((p) => PROBLEMS[p.key][1].replace('{year}', p.year ?? ''));
  prior.set(lead.place_id, {
    ...lead,
    score,
    problem_keys: a.found.map((p) => p.key + (p.detail ? `(${p.detail})` : '')),
    problems,
    emails: a.emails,
    builder: a.builder,
    final_url: a.final_url,
    load_ms: a.load_ms,
    scored_at: new Date().toISOString().slice(0, 10),
  });
  if (++done % 20 === 0) console.log(`  ${done}/${todo.length}`);
});

const ids = new Set(leads.map((l) => l.place_id));
const scored = [...prior.values()].filter((s) => ids.has(s.place_id)).sort((a, b) => b.score - a.score);
writeJson(scoredFile, scored);
fs.writeFileSync(
  path.join(DATA_DIR, 'scored.csv'),
  toCsv(scored, ['score', 'name', 'town', 'website', 'phone', 'emails', 'builder', 'load_ms', 'problem_keys', 'address', 'place_id']),
);
console.log(`\nTop leads:`);
for (const s of scored.slice(0, 15)) console.log(`  ${String(s.score).padStart(3)}  ${s.name} (${s.town})  ${s.problem_keys.join(', ')}`);
console.log(`\nWrote leads/data/scored.csv. Next: npm run leads:preview -- --top 10`);
