// Step 1: pull church listings from Google Maps through SerpApi.
//   SERPAPI_KEY=... npm run leads:pull                     every town in towns.json, "church" query
//   npm run leads:pull -- --towns "Hamilton, NJ" "Ewing, NJ"
//   npm run leads:pull -- --deep                           also denomination queries (many more searches)
//   npm run leads:pull -- --pages 2                        up to 2 pages (20 results each) per search
// Responses are cached in leads/data/cache so re-running costs no searches.
// Output: leads/data/leads.json and leads.csv (merged with earlier pulls, de-duplicated by place ID).
import fs from 'node:fs';
import path from 'node:path';
import { DATA_DIR, LEADS_DIR, readJson, writeJson, toCsv, loadEnv } from './lib.mjs';

loadEnv();
const args = process.argv.slice(2);
const key = process.env.SERPAPI_KEY;
if (!key) {
  console.error('Set SERPAPI_KEY (in .env or the environment). Get it from serpapi.com/manage-api-key.');
  process.exit(1);
}
const config = readJson(path.join(LEADS_DIR, 'towns.json'));
const ti = args.indexOf('--towns');
const towns = ti >= 0 ? args.slice(ti + 1).filter((a) => !a.startsWith('--')) : config.towns;
const queries = args.includes('--deep') ? [...config.queries, ...config.deepQueries] : config.queries;
const pi = args.indexOf('--pages');
const maxPages = pi >= 0 ? Number(args[pi + 1]) : 1;

const cacheDir = path.join(DATA_DIR, 'cache');
fs.mkdirSync(cacheDir, { recursive: true });

async function search(q, start) {
  const cacheFile = path.join(cacheDir, `${q.replace(/[^a-z0-9]+/gi, '_')}_${start}.json`);
  if (fs.existsSync(cacheFile)) return { data: readJson(cacheFile), cached: true };
  const params = new URLSearchParams({ engine: 'google_maps', type: 'search', q, start: String(start), hl: 'en', gl: 'us', api_key: key });
  const r = await fetch(`https://serpapi.com/search.json?${params}`);
  const data = await r.json();
  if (data.error) throw new Error(data.error);
  writeJson(cacheFile, data);
  return { data, cached: false };
}

const leadsFile = path.join(DATA_DIR, 'leads.json');
const leads = new Map(readJson(leadsFile, []).map((l) => [l.place_id, l]));
const before = leads.size;
let spent = 0;

for (const town of towns) {
  for (const query of queries) {
    const q = `${query} in ${town}`;
    for (let page = 0; page < maxPages; page++) {
      let res;
      try {
        res = await search(q, page * 20);
      } catch (e) {
        console.error(`  ${q}: ${e.message}`);
        break;
      }
      if (!res.cached) spent++;
      const results = res.data.local_results ?? [];
      for (const r of results) {
        const types = (r.types ?? [r.type]).filter(Boolean).join(' ').toLowerCase();
        if (!/church|chapel|worship|congregation|cathedral|parish|ministr/.test(`${types} ${r.title}`.toLowerCase())) continue;
        const id = r.place_id ?? r.data_id ?? `${r.title}|${r.address}`;
        const prev = leads.get(id);
        leads.set(id, {
          place_id: id,
          name: r.title,
          address: r.address ?? '',
          town,
          phone: r.phone ?? '',
          website: r.website ?? '',
          type: r.type ?? '',
          rating: r.rating ?? '',
          reviews: r.reviews ?? '',
          hours: r.operating_hours?.sunday ?? '',
          query: prev?.query ?? query,
          first_seen: prev?.first_seen ?? new Date().toISOString().slice(0, 10),
        });
      }
      console.log(`${res.cached ? '(cached) ' : ''}${q}${page ? ` p${page + 1}` : ''}: ${results.length} results`);
      if (results.length < 20) break;
    }
  }
}

const all = [...leads.values()];
writeJson(leadsFile, all);
fs.writeFileSync(path.join(DATA_DIR, 'leads.csv'), toCsv(all, ['name', 'town', 'address', 'phone', 'website', 'type', 'rating', 'reviews', 'place_id']));
console.log(`\n${all.length} churches total (${all.length - before} new). SerpApi searches used: ${spent}.`);
console.log('Next: npm run leads:score');
