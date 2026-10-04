import toast from 'react-hot-toast';
import { supabase } from './supabase';
import { removePhotos } from './photos';
import { haptic } from './haptics';

const UNDO_MS = 5000;
const pending = new Map(); // entry id -> run()

/**
 * Removes an entry from the screen at once and deletes it for real after a few
 * seconds, unless "Undo" is tapped. Pending deletes run straight away if the
 * app is closed or sent to the background, so nothing is left half-done.
 */
export function deleteEntryWithUndo(entry, { onRemove, onRestore }) {
  onRemove();
  haptic(15);
  let timer;
  const run = async () => {
    clearTimeout(timer);
    if (!pending.has(entry.id)) return;
    pending.delete(entry.id);
    const { error } = await supabase.from('entries').delete().eq('id', entry.id);
    if (error) {
      toast.error(`Couldn’t delete: ${error.message}`);
      onRestore();
      return;
    }
    removePhotos(entry.photos ?? []).catch(() => {});
  };
  pending.set(entry.id, run);
  timer = setTimeout(run, UNDO_MS);

  toast(
    (t) => (
      <span className="undo-toast">
        Entry deleted
        <button
          type="button"
          className="undo-btn"
          onClick={() => {
            clearTimeout(timer);
            pending.delete(entry.id);
            toast.dismiss(t.id);
            onRestore();
          }}
        >
          Undo
        </button>
      </span>
    ),
    { id: `delete-${entry.id}`, duration: UNDO_MS, icon: '🗑️' },
  );
}

const flushAll = () => pending.forEach((run) => run());
if (typeof window !== 'undefined') {
  window.addEventListener('pagehide', flushAll);
  document.addEventListener('visibilitychange', () => document.visibilityState === 'hidden' && flushAll());
}

/** Puts a restored entry back into a newest-first list. */
export const restoreInto = (entry) => (list) =>
  [...list.filter((e) => e.id !== entry.id), entry].sort((a, b) => (a.created_at < b.created_at ? 1 : -1));
