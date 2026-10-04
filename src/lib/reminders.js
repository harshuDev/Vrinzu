import { dayKey } from './stats';

/*
 * Daily writing reminder. The settings live on this device (notifications are
 * per device) and are mirrored into the Cache Storage so the service worker
 * can read them when the phone wakes it for a background check.
 */
const KEY = 'vrinzu-reminder';
const STATE_CACHE = 'vrinzu-state';
const STATE_URL = '/__vrinzu/reminder';
const DEFAULTS = { enabled: false, time: '20:00', lastWritten: null, lastNotified: null };

export function getReminder() {
  try {
    return { ...DEFAULTS, ...JSON.parse(localStorage.getItem(KEY) || '{}') };
  } catch {
    return { ...DEFAULTS };
  }
}

async function persist(next) {
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    // Private mode: the reminder just won't survive a reload.
  }
  try {
    const cache = await caches.open(STATE_CACHE);
    await cache.put(STATE_URL, new Response(JSON.stringify(next), { headers: { 'Content-Type': 'application/json' } }));
  } catch {
    // No Cache Storage (old browser): background reminders are unavailable.
  }
  return next;
}

export const notificationsSupported = () => 'Notification' in window && 'serviceWorker' in navigator;

/** True when the browser can wake the app in the background to check the reminder. */
export async function backgroundChecksSupported() {
  try {
    const reg = await navigator.serviceWorker?.ready;
    return Boolean(reg && 'periodicSync' in reg);
  } catch {
    return false;
  }
}

async function registerBackgroundCheck(enabled) {
  try {
    const reg = await navigator.serviceWorker.ready;
    if (!('periodicSync' in reg)) return;
    if (enabled) await reg.periodicSync.register('vrinzu-reminder', { minInterval: 60 * 60 * 1000 });
    else await reg.periodicSync.unregister('vrinzu-reminder');
  } catch {
    // The browser declined (e.g. app not installed); reminders fall back to app opens.
  }
}

/** Turns the reminder on or off / changes its time. Asks for notification permission when enabling. */
export async function setReminder(changes) {
  const next = { ...getReminder(), ...changes };
  if (changes.enabled && Notification.permission !== 'granted') {
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') throw new Error('Notifications are blocked for Vrinzu in your browser settings.');
  }
  await persist(next);
  if ('enabled' in changes) await registerBackgroundCheck(next.enabled);
  return next;
}

/** Called whenever the user writes, so today's reminder is skipped. */
export function markWroteToday() {
  const current = getReminder();
  const today = dayKey(new Date());
  if (current.lastWritten !== today) persist({ ...current, lastWritten: today });
}

export async function sendTestReminder() {
  const reg = await navigator.serviceWorker.ready;
  await reg.showNotification('Time to write ✍️', {
    body: 'This is how your daily reminder will look.',
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    tag: 'vrinzu-reminder',
    data: { url: '/app' },
  });
}
