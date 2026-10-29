# Kieron Oates: portfolio

My portfolio site, live at **[roff-dev.com](https://roff-dev.com)**: my projects, the code behind them, and how I got into web development.

The site is dressed as a desktop. macOS (dark) and Windows (light) each have their own wallpaper, taskbar, terminal windows and shell prompts. It follows the device's light or dark setting until a visitor picks one with the switch in the taskbar.

- **Home:** a terminal that types `npm install Web Developer`, then the projects in one tabbed window.
- **About:** an installer for "Kieron Oates": introduction, education, training, contact and finish, one step at a time.
- **Code:** a searchable library of snippets from my projects, each with the problem, why I solved it that way and what to notice.

## Stack

- [Astro](https://astro.build) 7, static output, strict TypeScript, no UI framework
- Content collections: Markdown and JSON, validated with Zod at build time
- Shiki for code highlighting, with both desktops' colours in each block
- Cloudflare Workers static assets, with a small script in front (`worker/index.js`)
- Cloudflare Web Analytics: cookieless, no personal data

Every page works without JavaScript. The scripts add the tabs, the installer's steps, search and the moving background on top.

## Running it

Needs Node 22.23.4 or later (what Astro 7 requires).

```sh
npm install
npm run dev      # http://localhost:4321
npm run build    # astro check, then build into dist/
npm run preview  # serve dist/
```

## Changing the content

Everything visitors read lives in `src/content/`. The build fails with a clear message if a file doesn't match its schema in `src/content.config.ts`.

| Folder | What it is |
|---|---|
| `projects/*.json` | One file per project in the projects window: name, order, summary, description, stack, links and screenshot (in `src/assets/projects/`). |
| `journey/*.md` | One file per installer step on the about page: its name in the step list, heading, lines, and an optional body shown as a file. `link.href: "social:linkedin"` or `"social:github"` uses the profile in `src/site.ts`. |
| `snippets/*.md` | One file per code snippet: title, project, language, skill and order, then the code and three short paragraphs. |

Site-wide settings, such as the address, the description, the analytics token and the LinkedIn and GitHub profiles, are in `src/site.ts`.

The look comes from `src/styles/tokens.css`, which holds both desktops' colours, fonts, radii and the room each desktop's taskbar takes.

## For other sites

Two files are published for my other sites to read at their own build time. Both allow cross-origin requests:

- `/projects.json`: the projects, as in `src/content/projects/`
- `/snippets.json`: the code library

## Deploying

```sh
npm run build
npx wrangler deploy
```

`wrangler.jsonc` serves `dist/` from the Worker `portfolio` on roff-dev.com. `worker/index.js` permanently redirects the old `portfolio.kieronoates.workers.dev` address to the same page on roff-dev.com. Everything else is served as built.

- `public/_headers` sets the security headers and caching.
- `public/_redirects` sends the old site's addresses (`/about.php` and the rest) to their new homes.
- `www` and plain `http` are redirected by rules on the Cloudflare zone.

## License

[MIT](LICENSE)
