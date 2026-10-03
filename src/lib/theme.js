export const THEMES = ['system', 'light', 'dark'];

/** Applies a theme preference to <html>. "system" removes the override so the OS setting wins. */
export function applyTheme(pref) {
  const root = document.documentElement;
  if (pref === 'light' || pref === 'dark') root.dataset.theme = pref;
  else delete root.dataset.theme;
}
