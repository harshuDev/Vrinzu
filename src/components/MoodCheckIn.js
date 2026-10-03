import Modal from './Modal';
import { MOODS } from '../lib/constants';

export default function MoodCheckIn({ prompt, busy, onPick, onCancel }) {
  return (
    <Modal title="How are you feeling?" onClose={onCancel} size="sm">
      <div className="checkin">
        {prompt && <p className="checkin-prompt">“{prompt}”</p>}
        <div className="checkin-grid">
          {MOODS.map((m) => (
            <button
              type="button"
              key={m.emoji}
              className={`checkin-mood mood-${m.group}`}
              onClick={() => onPick(m.emoji)}
              disabled={busy}
            >
              <span className="checkin-emoji">{m.emoji}</span>
              <span className="checkin-label">{m.label}</span>
            </button>
          ))}
        </div>
        <button type="button" className="btn btn-ghost btn-block" onClick={() => onPick(null)} disabled={busy}>
          {busy ? 'Opening…' : 'Skip and just write'}
        </button>
      </div>
    </Modal>
  );
}
