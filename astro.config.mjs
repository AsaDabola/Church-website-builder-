// Builds one church site. Pick the church with the CHURCH env var:
//   CHURCH=grace-fellowship npm run dev
//   npm run build -- grace-fellowship   (see scripts/build.mjs)
import { defineConfig } from 'astro/config';
import fs from 'node:fs';
import path from 'node:path';
import { loadChurch, siteUrl, ROOT } from './lib/load.mjs';

const slug = process.env.CHURCH;
if (!slug) {
  throw new Error('Set CHURCH to a folder name in churches/, e.g. CHURCH=grace-fellowship npm run dev');
}

const { church, pages, warnings, dir } = loadChurch(slug);
for (const w of warnings) console.warn(`[${slug}] ${w}`);

const customCss = path.join(dir, 'custom.css');

export default defineConfig({
  site: siteUrl(church),
  outDir: path.join(ROOT, 'dist', slug),
  publicDir: path.join(dir, 'public'),
  cacheDir: path.join(ROOT, 'node_modules', '.astro', slug),
  trailingSlash: 'ignore',
  build: { format: 'directory' },
  vite: {
    define: {
      __CHURCH__: JSON.stringify(church),
      __PAGES__: JSON.stringify(pages),
      // Custom-tier churches can add churches/<slug>/custom.css for their unique design.
      __CUSTOM_CSS__: JSON.stringify(church.tier === 'custom' && fs.existsSync(customCss) ? fs.readFileSync(customCss, 'utf8') : ''),
    },
  },
});
