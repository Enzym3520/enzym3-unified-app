import { useEffect } from 'react';

/**
 * Keeps the browser/PWA <meta name="theme-color"> (the OS title-bar tint) in
 * sync with the active portal's background, so the banner blends into each
 * portal scheme — client / staff / vendor — and follows light/dark mode.
 *
 * The portal-* and `dark` classes live on <html> (set by each portal shell and
 * next-themes). We read the resolved `--background` CSS variable and write it to
 * the meta tag, re-running whenever the <html> class list changes. No hardcoded
 * colors — it always matches whatever the active theme resolves to.
 */
export function useThemeColorSync() {
  useEffect(() => {
    const sync = () => {
      const bg = getComputedStyle(document.documentElement)
        .getPropertyValue('--background')
        .trim();
      if (!bg) return;
      // --background is an HSL triple like "43 18% 90%". Use comma syntax for the
      // widest browser support in the theme-color parser.
      const parts = bg.split(/\s+/);
      const color = `hsl(${parts.join(', ')})`;
      // Re-insert the meta tag (rather than just mutating content): mobile Safari
      // often won't repaint the status-bar tint on an in-place content change, but
      // does when the theme-color meta is removed and re-added.
      document.querySelectorAll('meta[name="theme-color"]').forEach((m) => m.remove());
      const meta = document.createElement('meta');
      meta.name = 'theme-color';
      meta.setAttribute('content', color);
      document.head.appendChild(meta);
    };

    sync();
    const observer = new MutationObserver(sync);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);
}
