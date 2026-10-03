// The passcode itself never leaves the device: only a salted PBKDF2 hash is
// stored, in the user's own account metadata on Supabase.
const ITERATIONS = 150000;

const toHex = (buffer) => Array.from(new Uint8Array(buffer), (b) => b.toString(16).padStart(2, '0')).join('');

export async function hashPin(pin, userId) {
  if (!window.crypto?.subtle) throw new Error('Passcode lock needs a secure (https) connection');
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey('raw', enc.encode(pin), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', hash: 'SHA-256', salt: enc.encode(`vrinzu-pin:${userId}`), iterations: ITERATIONS },
    key,
    256
  );
  return toHex(bits);
}

export const isValidPin = (pin) => /^\d{4,6}$/.test(pin);

/** How long the app may sit in the background before asking for the passcode again. */
export const RELOCK_AFTER_MS = 60 * 1000;
