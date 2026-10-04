import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import toast from 'react-hot-toast';
import AuthLayout from '../components/AuthLayout';
import PasswordInput from '../components/PasswordInput';
import ResendConfirmation from '../components/ResendConfirmation';
import { useAuth } from '../context/AuthContext';
import { friendlyAuthError, startCooldown } from '../lib/authErrors';

export default function Signup() {
  const { signUp } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [sentTo, setSentTo] = useState(null); // email awaiting confirmation

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return toast.error('Please enter your name');
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) return toast.error('Please enter a valid email address');
    if (password.length < 6) return toast.error('Password must be at least 6 characters');

    setLoading(true);
    try {
      const { session, user } = await signUp(name.trim(), email.trim(), password);
      if (session) {
        toast.success(`Welcome to Vrinzu, ${name.trim()}!`);
        navigate('/app', { replace: true });
      } else if (user && user.identities?.length === 0) {
        // Supabase's privacy-safe answer when the address already has an account.
        toast.error('An account with this email already exists. Try signing in instead.', { duration: 6000 });
        setLoading(false);
      } else {
        startCooldown(email); // an email was just sent; don't let "resend" fire straight away
        setSentTo(email.trim());
        setLoading(false);
      }
    } catch (err) {
      toast.error(friendlyAuthError(err), { duration: 6000 });
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Start your journal"
      subtitle="Create a free account. It takes less than a minute."
      footer={
        <>
          Already have an account? <Link to="/login">Sign in</Link>
        </>
      }
    >
      <Helmet>
        <title>Sign Up · Vrinzu</title>
      </Helmet>
      {sentTo ? (
        <>
          <ResendConfirmation email={sentTo} title="Check your inbox">
            <p>
              We sent a confirmation link to <strong>{sentTo}</strong>. Tap it to finish, then sign in. It can take a
              minute; check spam too.
            </p>
          </ResendConfirmation>
          <Link to="/login" className="btn btn-primary btn-block btn-lg">
            I’ve confirmed, sign in
          </Link>
          <button type="button" className="link-btn auth-switch" onClick={() => setSentTo(null)}>
            Use a different email
          </button>
        </>
      ) : (
        <form className="auth-form" onSubmit={handleSubmit} noValidate>
          <label className="field">
            <span className="field-label">Name</span>
            <input
              className="input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
              autoComplete="name"
              required
            />
          </label>
          <label className="field">
            <span className="field-label">Email</span>
            <input
              className="input"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              autoComplete="email"
              inputMode="email"
              required
            />
          </label>
          <label className="field">
            <span className="field-label">Password</span>
            <PasswordInput
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 6 characters"
              autoComplete="new-password"
            />
          </label>
          <button type="submit" className="btn btn-primary btn-block btn-lg" disabled={loading}>
            {loading ? 'Creating account…' : 'Create account'}
          </button>
        </form>
      )}
    </AuthLayout>
  );
}
