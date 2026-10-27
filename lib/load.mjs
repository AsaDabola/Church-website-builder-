import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseChurch } from './schema.mjs';

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const CHURCHES_DIR = path.join(ROOT, 'churches');

export const brand = JSON.parse(fs.readFileSync(path.join(ROOT, 'brand.json'), 'utf8'));

export function listChurches() {
  return fs
    .readdirSync(CHURCHES_DIR, { withFileTypes: true })
    .filter((d) => d.isDirectory() && !d.name.startsWith('_') && fs.existsSync(path.join(CHURCHES_DIR, d.name, 'church.json')))
    .map((d) => d.name)
    .sort();
}

export function loadChurch(slug) {
  const dir = path.join(CHURCHES_DIR, slug);
  const file = path.join(dir, 'church.json');
  if (!fs.existsSync(file)) {
    throw new Error(`No church named "${slug}". Expected ${path.relative(ROOT, file)}. Known: ${listChurches().join(', ')}`);
  }
  const parsed = parseChurch(JSON.parse(fs.readFileSync(file, 'utf8')), path.relative(ROOT, file));
  if (parsed.church.slug !== slug) {
    throw new Error(`${path.relative(ROOT, file)}: slug "${parsed.church.slug}" must match its folder name "${slug}"`);
  }
  return { ...parsed, dir };
}

// The live domain once the church points DNS at us, otherwise the preview subdomain.
export function siteUrl(church) {
  return church.domain ? `https://${church.domain}` : `https://${church.slug}.${brand.domain}`;
}
