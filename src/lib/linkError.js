import { readLinkError } from './authErrors';

/*
 * When an email link fails (expired, already used), Supabase sends the browser
 * back with the error in the address, e.g. /app#error_code=otp_expired.
 * Read it before anything else runs and tidy the address, so the sign-in page
 * can explain what happened and offer a fresh link.
 */
export const initialLinkError = readLinkError();

if (initialLinkError) {
  window.history.replaceState(null, '', window.location.pathname);
}
