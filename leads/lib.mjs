import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const LEADS_DIR = path.dirname(fileURLToPath(import.meta.url));
export const DATA_DIR = path.join(LEADS_DIR, 'data');
fs.mkdirSync(DATA_DIR, { recursive: true });

export const readJson = (f, fallback) => (fs.existsSync(f) ? JSON.parse(fs.readFileSync(f, 'utf8')) : fallback);
export const writeJson = (f, v) => fs.writeFileSync(f, JSON.stringify(v, null, 2) + '\n');

export function toCsv(rows, columns) {
  const esc = (v) => {
    const s = Array.isArray(v) ? v.join('; ') : v == null ? '' : String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return [columns.join(','), ...rows.map((r) => columns.map((c) => esc(r[c])).join(','))].join('\n') + '\n';
}

export function slugify(name, town = '') {
  const base = name
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/&/g, ' and ')
    .replace(/\b(the|of|inc|llc)\b/g, ' ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
  const t = town.toLowerCase().replace(/,.*$/, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  return (t && !base.includes(t) ? `${base}-${t}` : base).slice(0, 60).replace(/-$/, '');
}

// Run async work over items with a concurrency limit.
export async function pool(items, limit, fn) {
  const out = new Array(items.length);
  let i = 0;
  await Promise.all(
    Array.from({ length: Math.min(limit, items.length) }, async () => {
      while (i < items.length) {
        const n = i++;
        out[n] = await fn(items[n], n);
      }
    }),
  );
  return out;
}

export function loadEnv() {
  const f = path.join(LEADS_DIR, '..', '.env');
  if (!fs.existsSync(f)) return;
  for (const line of fs.readFileSync(f, 'utf8').split('\n')) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
  }
}
