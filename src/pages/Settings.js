import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import toast from 'react-hot-toast';
import { KeyRound, LogOut, User } from 'lucide-react';
import PasswordInput from '../components/PasswordInput';
import { Avatar } from '../components/AppLayout';
import { useAuth } from '../context/AuthContext';

export default function Settings() {
  const { user, displayName, updateProfile, signOut } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState(user?.user_metadata?.full_name ?? '');
  const [savingName, setSavingName] = useState(false);
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);

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
    </div>
  );
}
