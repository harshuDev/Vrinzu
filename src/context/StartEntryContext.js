import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import MoodCheckIn from '../components/MoodCheckIn';
import { createEntry, getOrCreateDefaultJournal } from '../lib/api';
import { useAuth } from './AuthContext';

// Every "new entry" button goes through here: a quick mood check-in first,
// then the entry is created and opened.
const StartEntryContext = createContext(null);

export function StartEntryProvider({ children }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [request, setRequest] = useState(null); // { journalId, createdAt, title, to }
  const [busy, setBusy] = useState(false);
  const resolver = useRef(null);

  /**
   * Opens the mood check-in, then creates the entry and navigates to it.
   * Resolves with the new entry, or null if cancelled.
   * Options: journalId (default journal if omitted), createdAt, title, to(entry) => path.
   */
  const startEntry = useCallback((options = {}) => {
    resolver.current?.(null);
    return new Promise((resolve) => {
      resolver.current = resolve;
      setRequest(options);
    });
  }, []);

  const finish = (entry) => {
    setRequest(null);
    setBusy(false);
    resolver.current?.(entry);
    resolver.current = null;
  };

  const create = async (mood) => {
    setBusy(true);
    try {
      const journalId = request.journalId ?? (await getOrCreateDefaultJournal(user.id)).id;
      const entry = await createEntry(user.id, journalId, request.createdAt, { mood, title: request.title ?? '' });
      navigate(request.to ? request.to(entry) : `/app/entries/${entry.id}`);
      finish(entry);
    } catch (err) {
      toast.error(err.message);
      setBusy(false);
    }
  };

  const value = useMemo(() => ({ startEntry }), [startEntry]);

  return (
    <StartEntryContext.Provider value={value}>
      {children}
      {request && <MoodCheckIn prompt={request.title} busy={busy} onPick={create} onCancel={() => finish(null)} />}
    </StartEntryContext.Provider>
  );
}

export function useStartEntry() {
  const ctx = useContext(StartEntryContext);
  if (!ctx) throw new Error('useStartEntry must be used inside <StartEntryProvider>');
  return ctx.startEntry;
}
