import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import { SITE_URL } from './src/site';
import { codeTheme, codeThemeLight } from './src/lib/code-theme';

export default defineConfig({
  site: SITE_URL,
  trailingSlash: 'always',
  integrations: [sitemap()],
  // Both desktops' colours go into the page as CSS variables; global.css picks the current one
  markdown: { shikiConfig: { themes: { dark: codeTheme, light: codeThemeLight }, defaultColor: false } },
  build: { inlineStylesheets: 'auto' },
});
