import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import toast from 'react-hot-toast';
import AuthLayout from '../components/AuthLayout';
import PasswordInput from '../components/PasswordInput';
import ResendConfirmation from '../components/ResendConfirmation';
import { useAuth } from '../context/AuthContext';
import { friendlyAuthError, isEmailNotConfirmed } from '../lib/authErrors';

export default function Login() {
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  // 'unconfirmed' after signing in too early; 'expired' after opening an old email link.
  const [notice, setNotice] = useState(location.state?.linkError ? 'expired' : null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      toast.error('Please enter your email and password');
      return;
    }
    setLoading(true);
    try {
      await signIn(email.trim(), password);
      toast.success('Welcome back!');
      navigate(location.state?.from?.pathname || '/app', { replace: true });
    } catch (err) {
      if (isEmailNotConfirmed(err)) setNotice('unconfirmed');
      else toast.error(friendlyAuthError(err));
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Sign in to continue writing."
      footer={
        <>
          New to Vrinzu? <Link to="/signup">Create an account</Link>
        </>
      }
    >
      <Helmet>
        <title>Sign In · Vrinzu</title>
      </Helmet>
      {notice === 'unconfirmed' && (
        <ResendConfirmation email={email} title="Confirm your email first">
          <p>We sent a link to {email.trim() || 'your inbox'}. Tap it, then sign in. No email? Send a new one.</p>
        </ResendConfirmation>
      )}
      {notice === 'expired' && (
        <ResendConfirmation email={email} onEmailChange={setEmail} title="That link has expired">
          <p>Email links work once and only the newest one counts. Enter your email to get a fresh link.</p>
        </ResendConfirmation>
      )}
      <form className="auth-form" onSubmit={handleSubmit} noValidate>
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
            autoComplete="current-password"
          />
        </label>
        <button type="submit" className="btn btn-primary btn-block btn-lg" disabled={loading}>
          {loading ? 'Signing in…' : 'Sign In'}
        </button>
      </form>
    </AuthLayout>
  );
}
