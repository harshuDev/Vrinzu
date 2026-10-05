import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import toast from 'react-hot-toast';
import { CheckCircle2, Copy, Download, EllipsisVertical, Share, SquarePlus } from 'lucide-react';
import { LOGO_SRC } from '../components/Logo';
import { useBarColor } from '../lib/theme';
import {
  canPromptInstall,
  chromeIntentUrl,
  detectPlatform,
  isStandalone,
  justInstalled,
  onInstallChange,
  promptInstall,
} from '../lib/installPrompt';

const PERKS = [
  'Opens full screen from your home screen',
  'Works offline',
  'Optional daily reminder',
  'Free, no app store needed',
];

function Steps({ items }) {
  return (
    <ol className="install-steps">
      {items.map((s, i) => (
        <li key={i}>
          <span className="install-step-num">{i + 1}</span>
          <span>{s}</span>
        </li>
      ))}
    </ol>
  );
}

/** Shareable "get the app" page: vrinzu…/install. One tap to install on Android (Chrome). */
export default function Install() {
  useBarColor('#0284c7');
  const platform = detectPlatform();
  const [, rerender] = useState(0);
  const [busy, setBusy] = useState(false);
  useEffect(() => onInstallChange(() => rerender((n) => n + 1)), []);

  const link = `${window.location.origin}/install`;
  const install = async () => {
    setBusy(true);
    const outcome = await promptInstall();
    setBusy(false);
    if (outcome === 'accepted') toast.success('Vrinzu is installing. Find it in your app drawer.', { duration: 6000 });
  };
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(link);
      toast.success('Link copied');
    } catch {
      toast(link, { duration: 8000 });
    }
  };

  let body;
  if (isStandalone()) {
    body = (
      <>
        <p className="install-state">
          <CheckCircle2 size={20} /> You’re already in the Vrinzu app.
        </p>
        <Link to="/app" className="install-cta">
          Open my journal
        </Link>
      </>
    );
  } else if (justInstalled()) {
    body = (
      <p className="install-state">
        <CheckCircle2 size={20} /> Installed! Open Vrinzu from your home screen or app drawer.
      </p>
    );
  } else if (canPromptInstall()) {
    body = (
      <>
        <button type="button" className="install-cta" onClick={install} disabled={busy}>
          <Download size={22} /> {busy ? 'Opening…' : 'Install Vrinzu'}
        </button>
        <p className="install-note">Adds Vrinzu to your home screen and app drawer. Takes a few seconds.</p>
      </>
    );
  } else if (platform.android && !platform.chrome) {
    body = (
      <>
        <a className="install-cta" href={chromeIntentUrl()}>
          Open in Chrome to install
        </a>
        <p className="install-note">
          {platform.inApp
            ? 'This page opened inside another app, which can’t install apps. Open it in Chrome instead.'
            : 'Installing works best from Chrome. If that button doesn’t work, copy the link and paste it into Chrome.'}
        </p>
        <button type="button" className="install-link" onClick={copy}>
          <Copy size={16} /> Copy link
        </button>
      </>
    );
  } else if (platform.android) {
    body = (
      <>
        <Steps
          items={[
            <>
              Tap <EllipsisVertical size={16} className="install-inline" /> at the top right of Chrome
            </>,
            <>
              Choose <strong>Install app</strong> (or <strong>Add to Home screen</strong> → <strong>Install</strong>)
            </>,
            <>Open Vrinzu from your app drawer</>,
          ]}
        />
        <p className="install-note">If the menu shows “Open app” instead, Vrinzu is already installed.</p>
      </>
    );
  } else if (platform.ios) {
    body = (
      <>
        <Steps
          items={[
            <>Open this page in Safari</>,
            <>
              Tap <Share size={16} className="install-inline" /> Share
            </>,
            <>
              Choose <SquarePlus size={16} className="install-inline" /> <strong>Add to Home Screen</strong>
            </>,
          ]}
        />
      </>
    );
  } else {
    body = (
      <>
        <p className="install-note install-note-lg">Open this link on your phone to install Vrinzu:</p>
        <button type="button" className="install-url" onClick={copy}>
          {link.replace(/^https?:\/\//, '')} <Copy size={16} />
        </button>
        <p className="install-note">
          On a computer you can also install it from the install icon in Chrome’s address bar.
        </p>
      </>
    );
  }

  return (
    <div className="welcome install-page">
      <Helmet>
        <title>Get the app · Vrinzu</title>
        <meta
          name="description"
          content="Install Vrinzu, your private journal, on your phone. Free, no app store needed."
        />
      </Helmet>
      <div className="welcome-bg" aria-hidden="true">
        <span className="welcome-glow welcome-glow-1" />
        <span className="welcome-glow welcome-glow-2" />
        <svg className="welcome-waves" viewBox="0 0 1200 120" preserveAspectRatio="none">
          <path d="M0 60 Q150 20 300 60 T600 60 T900 60 T1200 60 V120 H0Z" />
          <path d="M0 80 Q150 45 300 80 T600 80 T900 80 T1200 80 V120 H0Z" />
        </svg>
      </div>
      <main className="install-main">
        <img className="install-logo" src={LOGO_SRC} alt="" />
        <h1 className="install-title">Get Vrinzu on your phone</h1>
        <p className="install-sub">Your private journal, one tap away.</p>
        <ul className="install-perks">
          {PERKS.map((p) => (
            <li key={p}>
              <CheckCircle2 size={16} /> {p}
            </li>
          ))}
        </ul>
        <div className="install-card">{body}</div>
        <Link to="/" className="install-back">
          Continue in the browser
        </Link>
      </main>
    </div>
  );
}
