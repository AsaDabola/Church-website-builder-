// Step 3: generate free redesign previews for the best leads.
//   npm run leads:preview -- --top 10          best 10 scored leads without a preview yet
//   npm run leads:preview -- <place_id> ...    specific churches
// Each preview is a normal church folder (churches/<slug>) with "preview": true, so it builds
// and deploys like any site, at <slug>.<brand domain>, with a "this is a preview" ribbon and noindex.
// The script fills what it can from public info and writes REVIEW.md listing every guess.
// Then ask Claude Code: "polish the preview in churches/<slug> using their current site".
import fs from 'node:fs';
import path from 'node:path';
import { DATA_DIR, readJson, writeJson, slugify } from './lib.mjs';
import { CHURCHES_DIR, siteUrl } from '../lib/load.mjs';
import { parseChurch } from '../lib/schema.mjs';

const args = process.argv.slice(2);
const scored = readJson(path.join(DATA_DIR, 'scored.json'), []);
if (!scored.length) {
  console.error('No scored leads. Run npm run leads:score first.');
  process.exit(1);
}
const previewsFile = path.join(DATA_DIR, 'previews.json');
const previews = readJson(previewsFile, {});

const ti = args.indexOf('--top');
const picked = ti >= 0
  ? scored.filter((s) => !previews[s.place_id]).slice(0, Number(args[ti + 1] ?? 10))
  : scored.filter((s) => args.includes(s.place_id));
if (!picked.length) {
  console.error('Nothing to preview. Use --top N or pass place IDs from scored.csv.');
  process.exit(1);
}

function presetFor(name) {
  const n = name.toLowerCase();
  if (/presbyterian|episcopal|lutheran|methodist|reformed|cathedral|\bst\.? |\bsaint|catholic|orthodox|congregational/.test(n)) return 'heritage';
  if (/baptist|a\.?m\.?e\.?|zion|pentecostal|church of god|apostolic|holiness|temple|tabernacle/.test(n)) return 'bold';
  if (/fellowship|life|city|vineyard|calvary|crossing|harvest church|bridge|journey|community church|non-?denom/.test(n)) return 'modern';
  if (/chapel|country|grange|valley|creek|hollow|mill|farm/.test(n)) return 'harvest';
  return 'coastal';
}

function parseAddress(addr) {
  const parts = addr.split(',').map((s) => s.trim());
  const m = parts.at(-1)?.match(/^([A-Z]{2})\s+(\d{5})/);
  if (parts.length < 3 || !m) return undefined;
  return { street: parts.slice(0, -2).join(', '), city: parts.at(-2), state: m[1], zip: m[2] };
}

// Pull "Sunday ... 10:30 AM" style lines from the church's current home page.
async function scrapeTimes(url) {
  if (!url) return [];
  try {
    const html = await (await fetch(url, { signal: AbortSignal.timeout(15000) })).text();
    const text = html.replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/gi, ' ').replace(/<[^>]+>/g, '\n').replace(/&nbsp;/g, ' ');
    const out = [];
    const re = /(Sunday|Saturday|Wednesday|Thursday|Friday)s?\b[^\n]{0,60}?(\d{1,2}(?::\d{2})?\s*(?:a\.?m\.?|p\.?m\.?))/gi;
    for (const m of text.matchAll(re)) {
      const day = m[1][0].toUpperCase() + m[1].slice(1).toLowerCase();
      const time = m[2].toUpperCase().replace(/\./g, '').replace(/(\d)(AM|PM)/, '$1 $2');
      const label = /school/i.test(m[0]) ? 'Sunday School' : /bible study/i.test(m[0]) ? 'Bible Study' : /prayer/i.test(m[0]) ? 'Prayer' : /mass/i.test(m[0]) ? 'Mass' : 'Worship';
      if (!out.some((o) => o.day === day && o.time === time)) out.push({ day, time, label });
    }
    return out.slice(0, 4);
  } catch {
    return [];
  }
}

for (const lead of picked) {
  let slug = slugify(lead.name, lead.town);
  if (fs.existsSync(path.join(CHURCHES_DIR, slug))) slug = `${slug}-${lead.place_id.slice(-4).toLowerCase().replace(/[^a-z0-9]/g, '')}`;
  const dir = path.join(CHURCHES_DIR, slug);
  const guesses = [];

  const address = parseAddress(lead.address);
  if (!address) guesses.push(`Address could not be parsed from "${lead.address}"; add contact.address by hand.`);
  let times = await scrapeTimes(lead.final_url || lead.website);
  if (!times.length) {
    times = [{ day: 'Sunday', time: '10:00 AM', label: 'Worship' }];
    guesses.push('Service time is a PLACEHOLDER (Sunday 10:00 AM). Check Google Maps, Facebook or call before sending.');
  } else {
    guesses.push(`Service times were scraped from their site: ${times.map((t) => `${t.day} ${t.time}`).join(', ')}. Confirm they are current.`);
  }
  const preset = presetFor(lead.name);
  guesses.push(`Preset "${preset}" was picked from the name. Change it if it doesn't fit their style.`);
  const city = address?.city ?? lead.town.replace(/,.*$/, '');

  const church = {
    slug,
    name: lead.name,
    tier: 'ministry',
    preset,
    preview: true,
    contact: {
      ...(lead.emails?.[0] ? { email: lead.emails[0] } : {}),
      ...(lead.phone ? { phone: lead.phone } : {}),
      ...(address ? { address } : {}),
    },
    serviceTimes: times,
    specialServices: [],
    hero: {
      headline: `Welcome to ${lead.name}`,
      subhead: `A church family in ${city}. Join us this Sunday. We'd love to meet you.`,
    },
    welcome: {
      heading: "You're welcome here",
      paragraphs: [
        `Whether you've been part of a church your whole life or you're just looking, there's a place for you at ${lead.name}. Come as you are and see what we're about.`,
      ],
    },
    about: { story: [`${lead.name} is a community of faith serving ${city} and the surrounding area.`], beliefs: [] },
    staff: [],
    ministries: [],
    visit: {},
    social: {},
  };
  guesses.push('Hero, welcome and about copy are generic. Rewrite from their current site, bulletin or Facebook page.');
  guesses.push('No photos yet. Use photos from their site or Facebook only to show them the preview; replace with their own once they sign.');

  const { church: valid } = parseChurch(church, `${slug}/church.json`);
  fs.mkdirSync(path.join(dir, 'public', 'images'), { recursive: true });
  fs.copyFileSync(path.join(CHURCHES_DIR, '_template', 'public', 'favicon.svg'), path.join(dir, 'public', 'favicon.svg'));
  writeJson(path.join(dir, 'church.json'), church);
  fs.writeFileSync(
    path.join(dir, 'REVIEW.md'),
    `# Preview: ${lead.name}

Lead score ${lead.score}. Current site: ${lead.website || '(none)'}
Preview URL once deployed: ${siteUrl(valid)}

## Their current site's biggest problems
${lead.problems.slice(0, 3).map((p) => `- ${p}`).join('\n') || '- (none found)'}

## Check before sending
${guesses.map((g) => `- [ ] ${g}`).join('\n')}

## Ask Claude Code
> Polish the preview in churches/${slug}. Read their current site (${lead.website || 'search for them'}) and rewrite the
> hero, welcome and about copy in their own voice, fill staff, ministries and visit details where public,
> and confirm the service times.

When they sign: set "preview" to false, set the tier they chose, delete this file.
`,
  );
  previews[lead.place_id] = { slug, created: new Date().toISOString().slice(0, 10) };
  console.log(`churches/${slug}  (${preset}, score ${lead.score})`);
}
writeJson(previewsFile, previews);
console.log('\nRead each REVIEW.md, build with npm run build -- <slug>, deploy, then npm run leads:emails');
