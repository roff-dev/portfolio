// The live site; it feeds canonical links, the sitemap, robots.txt and social cards
export const SITE_URL = 'https://roff-dev.com';

export const site = {
  name: 'Kieron Oates',
  /** The browser tab's title, after the page name on every page but home */
  title: 'Personal Portfolio',
  url: SITE_URL,
  description: 'I build fast, accessible websites and web apps. These are my projects, the code behind them and how I got here.',
  /** Cloudflare Web Analytics token: public by design, added once the site is hosted */
  analyticsToken: '',
  social: {
    linkedin: 'https://www.linkedin.com/in/kieron-oates-b061b3317/',
    github: 'https://github.com/roff-dev',
  },
} as const;
