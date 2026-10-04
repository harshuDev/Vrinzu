import { useEffect } from 'react';

export const THEMES = ['system', 'light', 'dark'];

// Phone status bar / title bar colour, matched to the app header in each theme.
const BAR_COLORS = { light: '#ffffff', dark: '#0f1d30' };
const darkQuery = typeof window !== 'undefined' ? window.matchMedia('(prefers-color-scheme: dark)') : null;
let currentPref = 'system';
let barOverride = null;

const resolveTheme = (pref) => {
  if (pref === 'light' || pref === 'dark') return pref;
  return darkQuery?.matches ? 'dark' : 'light';
};

function syncThemeColor() {
  let meta = document.querySelector('meta[name="theme-color"]');
  if (!meta) {
    meta = document.createElement('meta');
    meta.name = 'theme-color';
    document.head.appendChild(meta);
  }
  meta.content = barOverride || BAR_COLORS[resolveTheme(currentPref)];
}

darkQuery?.addEventListener('change', () => currentPref === 'system' && syncThemeColor());

/** Applies a theme preference to <html>. "system" removes the override so the OS setting wins. */
export function applyTheme(pref) {
  const root = document.documentElement;
  currentPref = pref;
  if (pref === 'light' || pref === 'dark') root.dataset.theme = pref;
  else delete root.dataset.theme;
  syncThemeColor();
}

/** Gives the status bar a fixed colour while a screen is shown (e.g. the blue welcome screens). */
export function useBarColor(color) {
  useEffect(() => {
    barOverride = color;
    syncThemeColor();
    return () => {
      barOverride = null;
      syncThemeColor();
    };
  }, [color]);
}
