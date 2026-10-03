import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import {
  ArrowRight,
  Bell,
  BookOpen,
  Infinity as InfinityIcon,
  Lock,
  Search,
  ShieldCheck,
  Smartphone,
  Sparkles,
  KeyRound,
  EyeOff,
} from 'lucide-react';
import Logo from '../components/Logo';
import { useAuth } from '../context/AuthContext';

const FEATURES = [
  {
    icon: InfinityIcon,
    title: 'Unlimited Entries',
    text: 'Write as much as you like, every day. No caps, no paywalls on your own thoughts.',
  },
  {
    icon: Lock,
    title: 'Private & Secure',
    text: 'Your journal is locked to your account with row-level security. Only you can read it.',
  },
  {
    icon: Bell,
    title: 'Smart Reminders',
    text: 'Build a gentle writing habit with nudges that fit the rhythm of your day.',
  },
  {
    icon: BookOpen,
    title: 'Custom Journals',
    text: 'Separate journals for dreams, gratitude, travel or work, each with its own cover.',
  },
  {
    icon: Search,
    title: 'Powerful Search',
    text: 'Find any memory in an instant by searching across every title and every word.',
  },
  {
    icon: Smartphone,
    title: 'Mobile First',
    text: 'Install Vrinzu on your phone’s home screen and write wherever the tide takes you.',
  },
];

export default function Landing() {
  const { user } = useAuth();

  return (
    <div className="landing">
      <Helmet>
        <title>Vrinzu | Your private online journal</title>
      </Helmet>

      <header className="landing-nav">
        <div className="container landing-nav-inner">
          <Logo />
          <nav className="landing-nav-actions">
            {user ? (
              <Link to="/app" className="btn btn-primary">
                Open journal
              </Link>
            ) : (
              <>
                <Link to="/login" className="btn btn-ghost">
                  Sign In
                </Link>
                <Link to="/signup" className="btn btn-primary">
                  Start Free
                </Link>
              </>
            )}
          </nav>
        </div>
      </header>

      <section className="hero">
        <div className="hero-blobs" aria-hidden="true">
          <span className="blob blob-1" />
          <span className="blob blob-2" />
          <span className="blob blob-3" />
        </div>
        <div className="container hero-inner">
          <span className="eyebrow">
            <Sparkles size={16} /> Your calm corner of the internet
          </span>
          <h1 className="hero-title">
            Write freely.
            <br />
            <span className="text-gradient">Remember deeply.</span>
          </h1>
          <p className="hero-subtitle">
            Vrinzu is a beautiful, private online journal. Capture your days, track your moods and keep every memory
            safe on any device.
          </p>
          <div className="hero-ctas">
            <Link to="/signup" className="btn btn-primary btn-lg">
              Start journaling free <ArrowRight size={18} />
            </Link>
            <Link to="/login" className="btn btn-outline btn-lg">
              I already have an account
            </Link>
          </div>

          <div className="hero-preview" aria-hidden="true">
            <div className="preview-card">
              <div className="preview-toolbar">
                <span className="dot" />
                <span className="dot" />
                <span className="dot" />
                <span className="preview-status">Saved</span>
              </div>
              <div className="preview-body">
                <span className="preview-mood">😌</span>
                <h3>A quiet morning by the sea</h3>
                <p>
                  The tide was out and the sand was still cool. I sat with my coffee and finally wrote down the idea I
                  have been carrying around all week…
                </p>
                <div className="preview-tags">
                  <span className="tag">#gratitude</span>
                  <span className="tag">#mornings</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="section" id="features">
        <div className="container">
          <div className="section-head">
            <span className="eyebrow">Features</span>
            <h2 className="section-title">Everything you need to keep a journal</h2>
            <p className="section-subtitle">
              Thoughtfully simple, so the only thing you have to think about is what to write.
            </p>
          </div>
          <div className="features-grid">
            {FEATURES.map(({ icon: Icon, title, text }) => (
              <div className="feature-card" key={title}>
                <span className="feature-icon">
                  <Icon size={24} />
                </span>
                <h3>{title}</h3>
                <p>{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section privacy">
        <div className="container privacy-inner">
          <div className="privacy-copy">
            <span className="eyebrow eyebrow-light">Privacy first</span>
            <h2 className="section-title">Your journal is yours alone.</h2>
            <p>
              We believe a diary should be the most private place you own. Every entry is tied to your account and
              protected by database-level security rules, so nobody else can open it.
            </p>
            <ul className="privacy-list">
              <li>
                <ShieldCheck size={20} /> Row-level security on every journal and entry
              </li>
              <li>
                <KeyRound size={20} /> Encrypted connections from your device to our servers
              </li>
              <li>
                <EyeOff size={20} /> No ads, no tracking, no selling your words
              </li>
            </ul>
          </div>
          <div className="privacy-visual" aria-hidden="true">
            <div className="lock-orb">
              <Lock size={56} />
            </div>
          </div>
        </div>
      </section>

      <section className="section cta">
        <div className="container">
          <div className="cta-card">
            <h2>Your story deserves a safe harbour.</h2>
            <p>Join Vrinzu today and write your first entry in under a minute.</p>
            <Link to="/signup" className="btn btn-light btn-lg">
              Start Free <ArrowRight size={18} />
            </Link>
          </div>
        </div>
      </section>

      <footer className="footer">
        <div className="container footer-inner">
          <Logo />
          <nav className="footer-links">
            <a href="#features">Features</a>
            <Link to="/login">Sign In</Link>
            <Link to="/signup">Sign Up</Link>
          </nav>
          <p className="footer-copy">© {new Date().getFullYear()} Vrinzu. Made with 💙 for writers everywhere.</p>
        </div>
      </footer>
    </div>
  );
}
