// Print which sites a set of commits touched, so CI only rebuilds those.
//   node scripts/changed-sites.mjs <base-sha> [head-sha]
// Output (one per line): church slugs, plus "business" if the business site changed.
// Shared code (src/, lib/, package files...) changing means every church.
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { listChurches, ROOT } from '../lib/load.mjs';

const [base, head = 'HEAD'] = process.argv.slice(2);
let files;
try {
  if (!base || /^0+$/.test(base)) throw new Error('no base');
  files = execFileSync('git', ['diff', '--name-only', base, head], { cwd: ROOT, encoding: 'utf8' }).split('\n').filter(Boolean);
} catch {
  files = null; // first push or unknown base: build everything
}

const out = new Set();
const shared = /^(src\/|lib\/|astro\.config|package(-lock)?\.json|tsconfig|brand\.json|churches\/_template\/)/;
const businessShared = /^(business\/|brand\.json|pricing\.json|package(-lock)?\.json)/;
if (!files || files.some((f) => shared.test(f))) listChurches().forEach((s) => out.add(s));
for (const f of files ?? []) {
  const m = f.match(/^churches\/([^/_][^/]*)\//);
  if (m && fs.existsSync(path.join(ROOT, 'churches', m[1], 'church.json'))) out.add(m[1]);
}
if (!files || files.some((f) => businessShared.test(f))) out.add('business');
console.log([...out].join('\n'));
