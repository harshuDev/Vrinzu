/*
 * Chrome on Android offers "install this app" through a beforeinstallprompt
 * event that fires once, early in the page load. Catch it here (imported at
 * start-up) so the /install page can show a one-tap Install button later.
 */
let deferred = null;
let installed = false;
const listeners = new Set();
const notify = () => listeners.forEach((fn) => fn());

if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault(); // keep Chrome's mini-bar away; we show our own button
    deferred = e;
    notify();
  });
  window.addEventListener('appinstalled', () => {
    installed = true;
    deferred = null;
    notify();
  });
}

export const canPromptInstall = () => Boolean(deferred);
export const justInstalled = () => installed;

export function onInstallChange(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

/** Shows Chrome's install dialog. Resolves 'accepted', 'dismissed' or 'unavailable'. */
export async function promptInstall() {
  if (!deferred) return 'unavailable';
  const event = deferred;
  deferred = null;
  event.prompt();
  const { outcome } = await event.userChoice;
  notify();
  return outcome;
}

/** Already running as the installed app (opened from the home screen). */
export const isStandalone = () =>
  window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;

export function detectPlatform() {
  const ua = navigator.userAgent;
  const android = /Android/i.test(ua);
  const ios = /iPhone|iPad|iPod/i.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  // In-app browsers (WhatsApp, Instagram, etc.) and Android WebViews can't install apps.
  const inApp = /; wv\)|FBAN|FBAV|Instagram|Line\/|Snapchat|WhatsApp/i.test(ua);
  const chrome = android && /Chrome\/\d+/i.test(ua) && !/EdgA|OPR|SamsungBrowser|Firefox|Brave/i.test(ua) && !inApp;
  return { android, ios, inApp, chrome };
}

/** A link that opens this page in Chrome from another Android browser. */
export const chromeIntentUrl = () =>
  `intent://${window.location.host}/install#Intent;scheme=https;package=com.android.chrome;end`;
