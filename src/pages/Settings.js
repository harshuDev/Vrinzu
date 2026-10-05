import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import toast from 'react-hot-toast';
import { Download, KeyRound, Lock, LogOut, Monitor, Moon, Palette, Share2, Smartphone, Sun, User } from 'lucide-react';
import PasswordInput from '../components/PasswordInput';
import { Avatar } from '../components/AppLayout';
import ExportModal from '../components/ExportModal';
import WritingSettings from '../components/WritingSettings';
import { hashPin, isValidPin } from '../lib/pin';
import { applyTheme } from '../lib/theme';
import { useAuth } from '../context/AuthContext';

export default function Settings() {
  const { user, displayName, updateProfile, signOut } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState(user?.user_metadata?.full_name ?? '');
  const [savingName, setSavingName] = useState(false);
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);
  const [exporting, setExporting] = useState(false);
  const themePref = user?.user_metadata?.theme || 'system';
  const hasPin = Boolean(user?.user_metadata?.pin_hash);
  const [pinMode, setPinMode] = useState(null); // null | 'set' | 'remove'
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [currentPin, setCurrentPin] = useState('');
  const [savingPin, setSavingPin] = useState(false);

  const changeTheme = async (theme) => {
    applyTheme(theme); // instant feedback; saved to the account below
    try {
      await updateProfile({ data: { theme } });
    } catch (err) {
      applyTheme(themePref);
      toast.error(err.message);
    }
  };

  const resetPinForm = () => {
    setPinMode(null);
    setNewPin('');
    setConfirmPin('');
    setCurrentPin('');
  };

  const handlePin = async (e) => {
    e.preventDefault();
    setSavingPin(true);
    try {
      if (hasPin) {
        if ((await hashPin(currentPin, user.id)) !== user.user_metadata.pin_hash) {
          toast.error('Current passcode is incorrect');
          setSavingPin(false);
          return;
        }
      }
      if (pinMode === 'remove') {
        await updateProfile({ data: { pin_hash: null, pin_length: null } });
        toast.success('Passcode lock turned off');
      } else {
        if (!isValidPin(newPin)) throw new Error('Passcode must be 4 to 6 digits');
        if (newPin !== confirmPin) throw new Error('Passcodes do not match');
        const pin_hash = await hashPin(newPin, user.id);
        await updateProfile({ data: { pin_hash, pin_length: newPin.length } });
        toast.success(hasPin ? 'Passcode changed' : 'Passcode lock turned on');
      }
      resetPinForm();
    } catch (err) {
      toast.error(err.message);
    }
    setSavingPin(false);
  };

  const pinInput = (value, setValue, label, autoFocus = false) => (
    <label className="field">
      <span className="field-label">{label}</span>
      <input
        className="input pin-input"
        type="password"
        inputMode="numeric"
        autoComplete="off"
        pattern="[0-9]*"
        maxLength={6}
        value={value}
        onChange={(e) => setValue(e.target.value.replace(/\D/g, ''))}
        placeholder="••••"
        autoFocus={autoFocus}
      />
    </label>
  );

  const handleName = async (e) => {
    e.preventDefault();
    if (!name.trim()) return toast.error('Name cannot be empty');
    setSavingName(true);
    try {
      await updateProfile({ data: { full_name: name.trim() } });
      toast.success('Display name updated');
    } catch (err) {
      toast.error(err.message);
    }
    setSavingName(false);
  };

  const handlePassword = async (e) => {
    e.preventDefault();
    if (password.length < 6) return toast.error('Password must be at least 6 characters');
    if (password !== confirm) return toast.error('Passwords do not match');
    setSavingPassword(true);
    try {
      await updateProfile({ password });
      toast.success('Password changed');
      setPassword('');
      setConfirm('');
    } catch (err) {
      toast.error(err.message);
    }
    setSavingPassword(false);
  };

  const shareInstallLink = async () => {
    const url = `${window.location.origin}/install`;
    try {
      if (navigator.share) {
        await navigator.share({ title: 'Vrinzu', text: 'My private journal app. Install it here:', url });
      } else {
        await navigator.clipboard.writeText(url);
        toast.success('Install link copied');
      }
    } catch (err) {
      if (err?.name !== 'AbortError') toast(url, { duration: 8000 });
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      toast.success('Signed out. See you soon!');
      navigate('/');
    } catch (err) {
      toast.error(err.message);
    }
  };

  return (
    <div className="page page-narrow">
      <Helmet>
        <title>Settings · Vrinzu</title>
      </Helmet>
      <div className="page-header">
        <div>
          <h1 className="page-title">Settings</h1>
          <p className="page-subtitle">Manage your profile and account.</p>
        </div>
      </div>

      <section className="settings-card settings-profile">
        <Avatar name={displayName} size="lg" />
        <div>
          <p className="settings-name">{displayName}</p>
          <p className="settings-email">{user?.email}</p>
        </div>
      </section>

      <section className="settings-card">
        <h2 className="settings-heading">
          <Palette size={18} /> Appearance
        </h2>
        <div className="segmented" role="radiogroup" aria-label="Theme">
          {[
            { value: 'system', label: 'System', icon: Monitor },
            { value: 'light', label: 'Light', icon: Sun },
            { value: 'dark', label: 'Dark', icon: Moon },
          ].map(({ value, label, icon: Icon }) => (
            <button
              type="button"
              key={value}
              role="radio"
              aria-checked={themePref === value}
              className={`segmented-option${themePref === value ? ' is-selected' : ''}`}
              onClick={() => changeTheme(value)}
            >
              <Icon size={16} /> {label}
            </button>
          ))}
        </div>
        <p className="settings-help">“System” follows your device’s light or dark setting. Saved to your account.</p>
      </section>

      <WritingSettings />

      <section className="settings-card">
        <h2 className="settings-heading">
          <Lock size={18} /> Passcode lock
        </h2>
        <p className="settings-help">
          {hasPin
            ? 'On. Vrinzu asks for your passcode when it opens and after a minute in the background.'
            : 'Ask for a 4 to 6 digit passcode whenever Vrinzu opens. Handy on a shared device.'}
        </p>
        {pinMode ? (
          <form className="pin-form" onSubmit={handlePin}>
            {hasPin && pinInput(currentPin, setCurrentPin, 'Current passcode', true)}
            {pinMode === 'set' && (
              <>
                {pinInput(newPin, setNewPin, hasPin ? 'New passcode' : 'Passcode (4 to 6 digits)', !hasPin)}
                {pinInput(confirmPin, setConfirmPin, 'Confirm passcode')}
              </>
            )}
            <div className="pin-form-actions">
              <button type="button" className="btn btn-ghost" onClick={resetPinForm}>
                Cancel
              </button>
              <button
                type="submit"
                className={`btn ${pinMode === 'remove' ? 'btn-danger' : 'btn-primary'}`}
                disabled={savingPin}
              >
                {savingPin ? 'Saving…' : pinMode === 'remove' ? 'Turn off' : 'Save passcode'}
              </button>
            </div>
          </form>
        ) : (
          <div className="pin-form-actions">
            <button type="button" className="btn btn-primary" onClick={() => setPinMode('set')}>
              <Lock size={16} /> {hasPin ? 'Change passcode' : 'Set a passcode'}
            </button>
            {hasPin && (
              <button type="button" className="btn btn-danger-outline" onClick={() => setPinMode('remove')}>
                Turn off
              </button>
            )}
          </div>
        )}
      </section>

      <section className="settings-card">
        <h2 className="settings-heading">
          <Smartphone size={18} /> Get the app
        </h2>
        <p className="settings-help">
          Install Vrinzu on your phone (works on Android, including Nothing OS, and iPhone), or share the link with a
          friend.
        </p>
        <div className="pin-form-actions">
          <Link to="/install" className="btn btn-primary">
            <Download size={16} /> Install on this phone
          </Link>
          <button type="button" className="btn btn-outline" onClick={shareInstallLink}>
            <Share2 size={16} /> Share link
          </button>
        </div>
      </section>
      <section className="settings-card">
        <h2 className="settings-heading">
          <Download size={18} /> Export
        </h2>
        <p className="settings-help">Download your journals as a PDF document or a plain text file.</p>
        <button type="button" className="btn btn-outline" onClick={() => setExporting(true)}>
          <Download size={16} /> Export journals
        </button>
      </section>

      <form className="settings-card" onSubmit={handleName}>
        <h2 className="settings-heading">
          <User size={18} /> Display name
        </h2>
        <label className="field">
          <span className="field-label">Name</span>
          <input
            className="input"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your name"
            autoComplete="name"
            maxLength={80}
          />
        </label>
        <button type="submit" className="btn btn-primary" disabled={savingName}>
          {savingName ? 'Saving…' : 'Save name'}
        </button>
      </form>

      <form className="settings-card" onSubmit={handlePassword}>
        <h2 className="settings-heading">
          <KeyRound size={18} /> Change password
        </h2>
        <input type="email" value={user?.email ?? ''} autoComplete="username" readOnly hidden />
        <label className="field">
          <span className="field-label">New password</span>
          <PasswordInput
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="At least 6 characters"
            autoComplete="new-password"
          />
        </label>
        <label className="field">
          <span className="field-label">Confirm new password</span>
          <PasswordInput
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            placeholder="Type it again"
            autoComplete="new-password"
          />
        </label>
        <button type="submit" className="btn btn-primary" disabled={savingPassword}>
          {savingPassword ? 'Updating…' : 'Update password'}
        </button>
      </form>

      <section className="settings-card">
        <h2 className="settings-heading">
          <LogOut size={18} /> Sign out
        </h2>
        <p className="settings-help">You’ll need your email and password to sign back in.</p>
        <button type="button" className="btn btn-danger-outline" onClick={handleSignOut}>
          <LogOut size={18} /> Sign out
        </button>
      </section>

      {exporting && <ExportModal onClose={() => setExporting(false)} />}
    </div>
  );
}
