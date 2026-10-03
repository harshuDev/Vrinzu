import { useState } from 'react';
import Modal from './Modal';
import { hashPin } from '../lib/pin';
import { useAuth } from '../context/AuthContext';

export default function PinPrompt({ title, onSuccess, onCancel }) {
  const { user } = useAuth();
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [checking, setChecking] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (!pin) return;
    setChecking(true);
    const ok = (await hashPin(pin, user.id)) === user.user_metadata.pin_hash;
    setChecking(false);
    if (ok) onSuccess();
    else {
      setError('Wrong passcode');
      setPin('');
    }
  };

  return (
    <Modal
      title={title}
      onClose={onCancel}
      size="sm"
      footer={
        <>
          <button type="button" className="btn btn-ghost" onClick={onCancel}>
            Cancel
          </button>
          <button type="submit" form="pin-prompt" className="btn btn-primary" disabled={checking || !pin}>
            {checking ? 'Checking…' : 'Unlock'}
          </button>
        </>
      }
    >
      <form id="pin-prompt" className="pin-form" onSubmit={submit}>
        <p className="confirm-message">This journal is locked. Enter your passcode to open it.</p>
        <input
          className="input pin-input"
          type="password"
          inputMode="numeric"
          pattern="[0-9]*"
          autoComplete="off"
          maxLength={6}
          value={pin}
          onChange={(e) => {
            setError('');
            setPin(e.target.value.replace(/\D/g, ''));
          }}
          placeholder="••••"
          aria-label="Passcode"
          autoFocus
        />
        <p className="pin-error" role="alert">
          {error}
        </p>
      </form>
    </Modal>
  );
}
