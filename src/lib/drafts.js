/*
 * Unsynced entry changes kept on the device while offline. They are written
 * back to the server automatically once the connection returns.
 */
const key = (entryId) => `vrinzu-draft:${entryId}`;

export function saveDraft(entryId, values) {
  try {
    localStorage.setItem(key(entryId), JSON.stringify({ values, savedAt: Date.now() }));
  } catch {
    // Storage full or blocked: the in-memory copy is still retried.
  }
}

/** The offline copy if it is newer than the server's last update, else null (and it is dropped). */
export function readDraft(entryId, serverUpdatedAt) {
  try {
    const raw = localStorage.getItem(key(entryId));
    if (!raw) return null;
    const { values, savedAt } = JSON.parse(raw);
    if (serverUpdatedAt && savedAt <= Date.parse(serverUpdatedAt)) {
      localStorage.removeItem(key(entryId));
      return null;
    }
    return values;
  } catch {
    return null;
  }
}

export function clearDraft(entryId) {
  try {
    localStorage.removeItem(key(entryId));
  } catch {
    // Nothing to clear.
  }
}

/** Supabase reports a lost connection as a fetch failure rather than an HTTP error. */
export const isNetworkError = (error) =>
  !navigator.onLine || /failed to fetch|network|load failed|fetch failed/i.test(error?.message || '');
