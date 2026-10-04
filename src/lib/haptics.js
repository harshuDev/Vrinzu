/** A short vibration on phones that support it (Android); silently does nothing elsewhere. */
export function haptic(pattern = 10) {
  try {
    if (window.matchMedia('(pointer: coarse)').matches) navigator.vibrate?.(pattern);
  } catch {
    // Vibration is a nicety; never let it break an action.
  }
}
