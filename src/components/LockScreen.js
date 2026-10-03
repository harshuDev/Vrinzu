import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Delete, Lock } from 'lucide-react';
import PasswordInput from './PasswordInput';
import { supabase } from '../lib/supabase';
import { hashPin } from '../lib/pin';
import { useAuth } from '../context/AuthContext';

const MAX_ATTEMPTS = 5;
const COOLDOWN_MS = 30 * 1000;
const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'del'];

export default function LockScreen({ onUnlock }) {
  const { user, displayName, signOut, updateProfile } = useAuth();
  const pinLength = user.user_metadata.pin_length || 4;
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [shake, setShake] = useState(false);
  const [checking, setChecking] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [lockedUntil, setLockedUntil] = useState(0);
  const [now, setNow] = useState(Date.now());
  const [forgot, setForgot] = useState(false);
  const [password, setPassword] = useState('');
  const [resetting, setResetting] = useState(false);

  const coolingDown = lockedUntil > now;

  useEffect(() => {
    if (!coolingDown) return undefined;
    const t = setInterval(() => setNow(Date.now()), 500);
    return () => clearInterval(t);
  }, [coolingDown]);

  const verify = useCallback(
    async (candidate) => {
      setChecking(true);
      const hash = await hashPin(candidate, user.id);
      setChecking(false);
      if (hash === user.user_metadata.pin_hash) {
        onUnlock();
        return;
      }
      const next = attempts + 1;
      setAttempts(next);
      setShake(true);
      setTimeout(() => setShake(false), 450);
      setPin('');
      if (next >= MAX_ATTEMPTS) {
        setLockedUntil(Date.now() + COOLDOWN_MS);
        setNow(Date.now());
        setAttempts(0);
        setError('Too many attempts. Try again in 30 seconds.');
      } else {
        setError('Wrong passcode');
      }
    },
    [attempts, onUnlock, user]
  );

  const press = useCallback(
    (key) => {
      if (checking || coolingDown) return;
      if (key === 'del') {
        setPin((p) => p.slice(0, -1));
        return;
      }
      if (pin.length >= pinLength) return;
      setError('');
      const next = pin + key;
      setPin(next);
      if (next.length === pinLength) verify(next);
    },
    [checking, coolingDown, pin, pinLength, verify]
  );

  useEffect(() => {
    if (forgot) return undefined;
    const onKey = (e) => {
      if (/^\d$/.test(e.key)) press(e.key);
      else if (e.key === 'Backspace') press('del');
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [forgot, press]);

  const resetWithPassword = async (e) => {
    e.preventDefault();
    if (!password) return;
    setResetting(true);
    const { error: signInError } = await supabase.auth.signInWithPassword({ email: user.email, password });
    if (signInError) {
      setResetting(false);
      toast.error('Incorrect password');
      return;
    }
    try {
      await updateProfile({ data: { pin_hash: null, pin_length: null } });
      toast.success('Passcode removed. You can set a new one in Settings.');
      onUnlock();
    } catch (err) {
      toast.error(err.message);
      setResetting(false);
    }
  };

  return (
    <div className="lock-screen">
      <div className="lock-card">
        <span className="lock-icon">
          <Lock size={26} />
        </span>
        <h1>Welcome back{displayName ? `, ${displayName.split(' ')[0]}` : ''}</h1>

        {forgot ? (
          <form className="lock-forgot" onSubmit={resetWithPassword}>
            <p>Enter your account password to remove the passcode.</p>
            <PasswordInput
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Account password"
              autoComplete="current-password"
            />
            <button type="submit" className="btn btn-primary btn-block" disabled={resetting}>
              {resetting ? 'Checking…' : 'Remove passcode'}
            </button>
            <button type="button" className="link-btn" onClick={() => setForgot(false)}>
              Back to passcode
            </button>
          </form>
        ) : (
          <>
            <p className="lock-subtitle">Enter your passcode to open your journal</p>
            <div className={`pin-dots${shake ? ' shake' : ''}`} aria-label={`${pin.length} of ${pinLength} digits entered`}>
              {Array.from({ length: pinLength }, (_, i) => (
                <span key={i} className={`pin-dot${i < pin.length ? ' filled' : ''}`} />
              ))}
            </div>
            <p className="lock-error" role="alert">
              {coolingDown ? `Too many attempts. Try again in ${Math.ceil((lockedUntil - now) / 1000)}s.` : error}
            </p>
            <div className="keypad">
              {KEYS.map((key, i) =>
                key === '' ? (
                  <span key={i} />
                ) : (
                  <button
                    type="button"
                    key={key}
                    className={`keypad-key${key === 'del' ? ' keypad-del' : ''}`}
                    onClick={() => press(key)}
                    disabled={coolingDown}
                    aria-label={key === 'del' ? 'Delete digit' : key}
                  >
                    {key === 'del' ? <Delete size={22} /> : key}
                  </button>
                )
              )}
            </div>
            <div className="lock-links">
              <button type="button" className="link-btn" onClick={() => setForgot(true)}>
                Forgot passcode?
              </button>
              <button type="button" className="link-btn lock-signout" onClick={() => signOut()}>
                Sign out
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
