/*
 * Plain-language messages for Supabase Auth errors, plus helpers for the
 * "wait before asking for another email" cooldown.
 */

/** Seconds Supabase asked us to wait ("...only request this after 20 seconds"), or null. */
export function retryAfterSeconds(error) {
  const match = /after (\d+) seconds?/i.exec(error?.message || '');
  return match ? Number(match[1]) : null;
}

export const isRateLimited = (error) =>
  error?.status === 429 ||
  /rate.?limit/i.test(error?.code || '') ||
  /rate limit|after \d+ seconds/i.test(error?.message || '');

export const isEmailNotConfirmed = (error) =>
  error?.code === 'email_not_confirmed' || /email not confirmed/i.test(error?.message || '');

export function friendlyAuthError(error) {
  if (!error) return 'Something went wrong. Please try again.';
  const code = error.code || '';
  const message = error.message || '';
  const wait = retryAfterSeconds(error);

  if (wait) return `Please wait ${wait} seconds before trying again.`;
  if (code === 'over_email_send_rate_limit' || /email rate limit/i.test(message)) {
    return 'Too many emails were sent just now. Please wait a few minutes and try again.';
  }
  if (code === 'over_request_rate_limit' || isRateLimited(error)) {
    return 'Too many attempts. Please wait a minute and try again.';
  }
  if (isEmailNotConfirmed(error)) return 'Please confirm your email first. Check your inbox for the link.';
  if (code === 'invalid_credentials' || /invalid login credentials/i.test(message))
    return 'Incorrect email or password.';
  if (code === 'user_already_exists' || /already registered/i.test(message)) {
    return 'An account with this email already exists. Try signing in instead.';
  }
  if (code === 'weak_password') return 'Please choose a stronger password (at least 6 characters).';
  if (code === 'email_address_invalid') return 'That email address doesn’t look right. Please check it.';
  if (code === 'signup_disabled') return 'New sign-ups are turned off right now.';
  if (/failed to fetch|network/i.test(message)) return 'Can’t reach the server. Check your connection and try again.';
  return message;
}

/* ---------- Resend cooldown, remembered per email so a reload can't skip it ---------- */
const COOLDOWN_KEY = 'vrinzu-resend-until';
export const RESEND_COOLDOWN_S = 60;

const readCooldowns = () => {
  try {
    return JSON.parse(localStorage.getItem(COOLDOWN_KEY) || '{}');
  } catch {
    return {};
  }
};

/** Seconds left before another confirmation email may be requested for this address. */
export function cooldownLeft(email) {
  const until = readCooldowns()[(email || '').trim().toLowerCase()];
  return until ? Math.max(0, Math.ceil((until - Date.now()) / 1000)) : 0;
}

export function startCooldown(email, seconds = RESEND_COOLDOWN_S) {
  const all = readCooldowns();
  all[(email || '').trim().toLowerCase()] = Date.now() + seconds * 1000;
  try {
    localStorage.setItem(COOLDOWN_KEY, JSON.stringify(all));
  } catch {
    // Without storage the cooldown still applies until the page reloads.
  }
}

/** Reads an auth error that Supabase put in the address after a failed email link, e.g. #error_code=otp_expired. */
export function readLinkError() {
  const params = new URLSearchParams(window.location.hash.replace(/^#/, '') || window.location.search);
  const code = params.get('error_code');
  if (!code && !params.get('error')) return null;
  return { code: code || params.get('error'), description: params.get('error_description') || '' };
}
