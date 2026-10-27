// The business's own website. npm run business:dev / npm run business:build
import { defineConfig } from 'astro/config';
import brand from '../brand.json' with { type: 'json' };

export default defineConfig({
  site: `https://${brand.domain}`,
  build: { format: 'directory' },
});
