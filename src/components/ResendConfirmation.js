import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { MailCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { cooldownLeft, friendlyAuthError, retryAfterSeconds, startCooldown, isRateLimited } from '../lib/authErrors';

/**
 * "Resend confirmation email" with a countdown, so people can't burn through
 * the project's email limit by tapping repeatedly.
 */
export default function ResendConfirmation({ email, onEmailChange, title, children }) {
  const { resendConfirmation } = useAuth();
  const [left, setLeft] = useState(() => cooldownLeft(email));
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  useEffect(() => {
    setLeft(cooldownLeft(email));
  }, [email]);

  useEffect(() => {
    if (left <= 0) return undefined;
    const t = setInterval(() => setLeft(cooldownLeft(email)), 1000);
    return () => clearInterval(t);
  }, [left, email]);

  const resend = async () => {
    if (!/^\S+@\S+\.\S+$/.test((email || '').trim())) {
      toast.error('Enter your email address first');
      return;
    }
    setSending(true);
    try {
      await resendConfirmation(email.trim());
      startCooldown(email);
      setLeft(cooldownLeft(email));
      setSent(true);
      toast.success('Confirmation email sent. Check your inbox (and spam).', { duration: 6000 });
    } catch (err) {
      // Respect the wait Supabase asks for; a general limit gets the full cooldown.
      if (isRateLimited(err)) {
        startCooldown(email, retryAfterSeconds(err) ?? 5 * 60);
        setLeft(cooldownLeft(email));
      }
      toast.error(friendlyAuthError(err), { duration: 6000 });
    }
    setSending(false);
  };

  return (
    <div className="auth-notice" role="status">
      <span className="auth-notice-icon">
        <MailCheck size={20} />
      </span>
      <div className="auth-notice-body">
        <p className="auth-notice-title">{title}</p>
        {children}
        {onEmailChange && (
          <input
            className="input auth-notice-input"
            type="email"
            value={email}
            onChange={(e) => onEmailChange(e.target.value)}
            placeholder="you@example.com"
            autoComplete="email"
            inputMode="email"
            aria-label="Email for the confirmation link"
          />
        )}
        <button type="button" className="btn btn-outline btn-sm" onClick={resend} disabled={sending || left > 0}>
          {sending
            ? 'Sending…'
            : left > 0
              ? `Resend in ${left}s`
              : sent
                ? 'Send it again'
                : 'Resend confirmation email'}
        </button>
      </div>
    </div>
  );
}
