import { Lock } from 'lucide-react';

/** Shown in place of a locked journal's contents until it's unlocked. */
export default function LockedPanel({ journal, onUnlock }) {
  return (
    <div className="empty-state locked-panel">
      <span className="empty-icon">
        <Lock size={26} />
      </span>
      <h3>{journal.title} is locked</h3>
      <p>Enter your passcode to read and write in this journal.</p>
      <button type="button" className="btn btn-primary" onClick={onUnlock}>
        <Lock size={16} /> Unlock
      </button>
    </div>
  );
}
