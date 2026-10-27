import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import { SITE_URL } from './src/site';
import { codeTheme } from './src/lib/code-theme';

export default defineConfig({
  site: SITE_URL,
  trailingSlash: 'always',
  integrations: [sitemap()],
  markdown: { shikiConfig: { theme: codeTheme } },
  build: { inlineStylesheets: 'auto' },
});
