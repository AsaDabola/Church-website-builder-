// Check every church.json (or the ones named) against the schema without building.
//   npm run validate                 all churches
//   npm run validate -- riverlight-church
import fs from 'node:fs';
import path from 'node:path';
import { listChurches, loadChurch } from '../lib/load.mjs';

const slugs = process.argv.slice(2).length ? process.argv.slice(2) : listChurches();
let bad = 0;
for (const slug of slugs) {
  try {
    const { church, pages, warnings, dir } = loadChurch(slug);
    // Every referenced image must exist in the church's public folder.
    const images = [church.logo, church.hero.image, ...church.staff.map((s) => s.photo), ...church.ministries.map((m) => m.image)].filter(Boolean);
    const missing = images.filter((i) => !fs.existsSync(path.join(dir, 'public', i)));
    for (const m of missing) warnings.push(`image not found: public/${m}`);
    const todos = (fs.readFileSync(path.join(dir, 'church.json'), 'utf8').match(/TODO/g) ?? []).length;
    if (todos) warnings.push(`${todos} TODO placeholder(s) left in church.json; fill them before launch.`);
    if (missing.length) bad++;
    console.log(`${missing.length ? '✗' : '✓'} ${slug} (${church.tier}, ${church.preset}) pages: home, ${pages.join(', ')}`);
    for (const w of warnings) console.log(`    ! ${w}`);
  } catch (e) {
    bad++;
    console.log(`✗ ${slug}\n${e.message}`);
  }
}
process.exit(bad ? 1 : 0);
