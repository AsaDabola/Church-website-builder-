// Start a new church from the template.
//   npm run new-church -- grace-chapel "Grace Chapel" --tier ministry --preset coastal
// Then fill churches/<slug>/church.json from the intake form (docs/intake-form.md)
// and drop photos into churches/<slug>/public/images/.
import fs from 'node:fs';
import path from 'node:path';
import { CHURCHES_DIR } from '../lib/load.mjs';
import { TIERS, PRESETS } from '../lib/schema.mjs';

const [slug, name, ...rest] = process.argv.slice(2);
const opt = (flag, def) => {
  const i = rest.indexOf(flag);
  return i >= 0 ? rest[i + 1] : def;
};
const tier = opt('--tier', 'essentials');
const preset = opt('--preset', 'heritage');

if (!slug || !name || !/^[a-z0-9-]+$/.test(slug)) {
  console.error('Usage: npm run new-church -- <slug> "<Church Name>" [--tier essentials|ministry|custom] [--preset heritage|modern|harvest|coastal|bold]');
  process.exit(1);
}
if (!TIERS.includes(tier) || !PRESETS.includes(preset)) {
  console.error(`tier must be one of ${TIERS.join(', ')}; preset one of ${PRESETS.join(', ')}`);
  process.exit(1);
}
const dir = path.join(CHURCHES_DIR, slug);
if (fs.existsSync(dir)) {
  console.error(`churches/${slug} already exists.`);
  process.exit(1);
}

fs.cpSync(path.join(CHURCHES_DIR, '_template'), dir, { recursive: true });
fs.mkdirSync(path.join(dir, 'public', 'images'), { recursive: true });
const file = path.join(dir, 'church.json');
const data = JSON.parse(fs.readFileSync(file, 'utf8'));
Object.assign(data, { slug, name, tier, preset });
fs.writeFileSync(file, JSON.stringify(data, null, 2) + '\n');
console.log(`Created churches/${slug}. Next:
  1. Fill church.json from the intake answers (replace every "TODO").
  2. Put the logo and photos in churches/${slug}/public/images/.
  3. npm run validate -- ${slug}
  4. npm run dev -- ${slug}`);
