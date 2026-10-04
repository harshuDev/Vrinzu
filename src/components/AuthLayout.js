import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import Logo from './Logo';
import { useBarColor } from '../lib/theme';

export default function AuthLayout({ title, subtitle, children, footer }) {
  // Sign in / sign up sit on the same ocean background as the welcome slides.
  useBarColor('#0284c7');
  return (
    <div className="auth-page">
      <div className="welcome-bg" aria-hidden="true">
        <span className="welcome-glow welcome-glow-1" />
        <span className="welcome-glow welcome-glow-2" />
        <svg className="welcome-waves" viewBox="0 0 1200 120" preserveAspectRatio="none">
          <path d="M0 60 Q150 20 300 60 T600 60 T900 60 T1200 60 V120 H0Z" />
          <path d="M0 80 Q150 45 300 80 T600 80 T900 80 T1200 80 V120 H0Z" />
        </svg>
      </div>
      <Link to="/welcome" className="auth-back" aria-label="Back to welcome">
        <ArrowLeft size={22} />
      </Link>
      <div className="auth-card">
        <div className="auth-logo">
          <Logo />
        </div>
        <h1 className="auth-title">{title}</h1>
        <p className="auth-subtitle">{subtitle}</p>
        {children}
        <p className="auth-footer">{footer}</p>
      </div>
    </div>
  );
}
