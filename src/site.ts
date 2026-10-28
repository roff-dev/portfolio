// The live site; it feeds canonical links, the sitemap, robots.txt and social cards
export const SITE_URL = 'https://roff-dev.com';

export const site = {
  name: 'Kieron Oates',
  /** The browser tab's title, after the page name on every page but home */
  title: 'Personal Portfolio',
  url: SITE_URL,
  description: 'I build fast, accessible websites and web apps. These are my projects, the code behind them and how I got here.',
  /** Cloudflare Web Analytics token for roff-dev.com: public by design, it appears in every page's source */
  analyticsToken: '4ad3e0dd424a415f981528343b2c4b06',
  social: {
    linkedin: 'https://www.linkedin.com/in/kieron-oates-b061b3317/',
    github: 'https://github.com/roff-dev',
  },
} as const;
