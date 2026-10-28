// The two desktops: macOS (dark) and Windows (light). The choice is set on <html> before the page paints by
// the inline script in Base.astro, which follows the device's light or dark setting until a choice is saved.

export type Theme = 'mac' | 'windows';

const KEY = 'theme';
/** The browser's own bar, matching each desktop's surface */
export const THEME_COLOUR: Record<Theme, string> = { mac: '#202020', windows: '#f3f3f3' };

export const currentTheme = (): Theme => (document.documentElement.dataset.theme === 'windows' ? 'windows' : 'mac');

/** Switches desktop, saving the choice, with a cross-fade where the browser can and motion is welcome */
export function setTheme(theme: Theme) {
  const apply = () => {
    document.documentElement.dataset.theme = theme;
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', THEME_COLOUR[theme]);
    document.dispatchEvent(new CustomEvent<Theme>('themechange', { detail: theme }));
  };
  try {
    localStorage.setItem(KEY, theme);
  } catch {
    // Storage can be blocked; the switch still works for this page
  }
  if (document.startViewTransition && !matchMedia('(prefers-reduced-motion: reduce)').matches) document.startViewTransition(apply);
  else apply();
}
