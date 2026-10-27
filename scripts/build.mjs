// Build church sites into dist/<slug>.
//   npm run build -- grace-fellowship     one church
//   npm run build -- --all                every church in churches/
//   npm run dev -- grace-fellowship       local preview with live reload
import { spawnSync } from 'node:child_process';
import { listChurches, ROOT } from '../lib/load.mjs';

const args = process.argv.slice(2);
const dev = args[0] === '--dev';
if (dev) args.shift();
const slugs = args.includes('--all') ? listChurches() : args;

if (!slugs.length) {
  console.error(`Usage: npm run ${dev ? 'dev' : 'build'} -- <church-slug>${dev ? '' : ' | --all'}\nChurches: ${listChurches().join(', ')}`);
  process.exit(1);
}

const failed = [];
for (const slug of slugs) {
  console.log(`\n=== ${dev ? 'dev' : 'build'}: ${slug} ===`);
  const r = spawnSync('npx', ['astro', dev ? 'dev' : 'build'], {
    cwd: ROOT,
    stdio: 'inherit',
    env: { ...process.env, CHURCH: slug, ASTRO_TELEMETRY_DISABLED: '1' },
  });
  if (r.status !== 0) failed.push(slug);
}

if (failed.length) {
  console.error(`\nFailed: ${failed.join(', ')}`);
  process.exit(1);
}
if (!dev) console.log(`\nBuilt ${slugs.length} site(s) into dist/.`);
