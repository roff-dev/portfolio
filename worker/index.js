// The Worker in front of the built site. Requests to the old workers.dev address are sent, permanently, to the
// same page on the site's own domain, so old links keep working and search engines see one copy of the site.
// Everything else is the static site, with its _headers, _redirects and 404 page as before.
import { SITE_URL } from '../src/site.ts';

const HOME = new URL(SITE_URL);

export default {
  /** @param {Request} request @param {{ ASSETS: { fetch: typeof fetch } }} env */
  fetch(request, env) {
    const url = new URL(request.url);
    if (url.hostname.endsWith('.workers.dev')) {
      url.protocol = HOME.protocol;
      url.host = HOME.host;
      return Response.redirect(url.href, 301);
    }
    return env.ASSETS.fetch(request);
  },
};
