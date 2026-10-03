import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import PinPrompt from '../components/PinPrompt';
import { useAuth } from './AuthContext';

// Tracks which locked journals have been opened with the passcode in this
// session. It lives inside the app shell, so it resets whenever the app locks.
const JournalLockContext = createContext(null);

export function JournalLockProvider({ children }) {
  const { user } = useAuth();
  const hasPin = Boolean(user?.user_metadata?.pin_hash);
  const [unlocked, setUnlocked] = useState(() => new Set());
  const [prompt, setPrompt] = useState(null); // { journal }
  const resolver = useRef(null);

  // A lock only works while a passcode exists; without one the journal stays open.
  const isLocked = useCallback(
    (journal) => Boolean(journal?.is_locked && hasPin && !unlocked.has(journal.id)),
    [hasPin, unlocked],
  );

  const requestUnlock = useCallback(
    (journal) => {
      if (!isLocked(journal)) return Promise.resolve(true);
      return new Promise((resolve) => {
        resolver.current = resolve;
        setPrompt({ journal });
      });
    },
    [isLocked],
  );

  const finish = (ok) => {
    if (ok && prompt) setUnlocked((s) => new Set(s).add(prompt.journal.id));
    setPrompt(null);
    resolver.current?.(ok);
    resolver.current = null;
  };

  const value = useMemo(() => ({ isLocked, requestUnlock, hasPin }), [isLocked, requestUnlock, hasPin]);

  return (
    <JournalLockContext.Provider value={value}>
      {children}
      {prompt && (
        <PinPrompt
          title={`Unlock “${prompt.journal.title}”`}
          onSuccess={() => finish(true)}
          onCancel={() => finish(false)}
        />
      )}
    </JournalLockContext.Provider>
  );
}

export function useJournalLock() {
  const ctx = useContext(JournalLockContext);
  if (!ctx) throw new Error('useJournalLock must be used inside <JournalLockProvider>');
  return ctx;
}
