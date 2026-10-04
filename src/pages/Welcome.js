import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { format } from 'date-fns';
import { Waves } from 'lucide-react';
import { useBarColor } from '../lib/theme';

const WELCOME_BAR = '#0284c7';

/* ---------- Illustrations (drawn here, so they're ours and stay sharp) ---------- */

/** Sunset over the sea: used on the journal cover. */
function SeaScene() {
  return (
    <svg viewBox="0 0 300 300" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <defs>
        <linearGradient id="ws-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#0c4a6e" />
          <stop offset="0.45" stopColor="#38bdf8" />
          <stop offset="0.75" stopColor="#bae6fd" />
          <stop offset="1" stopColor="#fde68a" />
        </linearGradient>
        <radialGradient id="ws-sun" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#fff7d6" />
          <stop offset="0.45" stopColor="#fde68a" stopOpacity="0.9" />
          <stop offset="1" stopColor="#fde68a" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="ws-sea" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#0ea5e9" />
          <stop offset="1" stopColor="#075985" />
        </linearGradient>
      </defs>
      <rect width="300" height="300" fill="url(#ws-sky)" />
      <circle cx="200" cy="168" r="70" fill="url(#ws-sun)" />
      <circle cx="200" cy="168" r="20" fill="#fff7d6" />
      <g fill="#ffffff" opacity="0.75">
        <ellipse cx="70" cy="70" rx="46" ry="12" />
        <ellipse cx="100" cy="62" rx="30" ry="14" />
        <ellipse cx="230" cy="96" rx="40" ry="9" />
      </g>
      <path d="M0 190 Q40 170 80 186 T160 182 T240 178 T300 186 V300 H0Z" fill="#0369a1" opacity="0.55" />
      <rect y="196" width="300" height="104" fill="url(#ws-sea)" />
      <g fill="none" stroke="#e0f2fe" strokeLinecap="round" opacity="0.7">
        <path d="M150 214 h70" strokeWidth="3" />
        <path d="M170 226 h50" strokeWidth="2.5" />
        <path d="M184 238 h28" strokeWidth="2" />
      </g>
      <path d="M0 250 Q37 236 75 250 T150 250 T225 250 T300 250 V300 H0Z" fill="#0c4a6e" opacity="0.55" />
      <path d="M0 270 Q37 258 75 270 T150 270 T225 270 T300 270 V300 H0Z" fill="#082f49" opacity="0.6" />
    </svg>
  );
}

/** Mountains and a lake: the photo on the front entry card. */
function MountainScene() {
  return (
    <svg viewBox="0 0 320 170" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <defs>
        <linearGradient id="wm-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#38bdf8" />
          <stop offset="1" stopColor="#e0f2fe" />
        </linearGradient>
        <linearGradient id="wm-lake" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#7dd3fc" />
          <stop offset="1" stopColor="#0369a1" />
        </linearGradient>
      </defs>
      <rect width="320" height="170" fill="url(#wm-sky)" />
      <g fill="#ffffff" opacity="0.85">
        <ellipse cx="240" cy="34" rx="34" ry="9" />
        <ellipse cx="262" cy="28" rx="20" ry="10" />
        <ellipse cx="70" cy="44" rx="26" ry="7" />
      </g>
      <path d="M0 120 L60 50 L100 92 L150 30 L210 104 L250 64 L320 118 V170 H0Z" fill="#64748b" />
      <path d="M150 30 L168 52 L156 50 L148 60 L138 46Z M60 50 L74 66 L62 64 L52 70Z" fill="#f8fafc" />
      <path d="M0 132 L50 96 L110 124 L170 92 L240 128 L320 104 V170 H0Z" fill="#15803d" />
      <path d="M0 146 L80 122 L160 140 L240 120 L320 140 V170 H0Z" fill="#166534" />
      <rect y="146" width="320" height="24" fill="url(#wm-lake)" />
      <path
        d="M40 156 h40 M150 160 h56 M240 154 h30"
        stroke="#e0f2fe"
        strokeWidth="2"
        strokeLinecap="round"
        opacity="0.8"
      />
    </svg>
  );
}

/** A beach at dusk: the photo peeking from the back card. */
function BeachScene() {
  return (
    <svg viewBox="0 0 320 170" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <defs>
        <linearGradient id="wb-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#5eead4" />
          <stop offset="1" stopColor="#fef3c7" />
        </linearGradient>
      </defs>
      <rect width="320" height="170" fill="url(#wb-sky)" />
      <rect y="96" width="320" height="40" fill="#0ea5e9" />
      <path d="M0 136 Q80 120 160 132 T320 128 V170 H0Z" fill="#fcd9a8" />
      <path d="M0 140 Q60 128 120 138" stroke="#ffffff" strokeWidth="3" fill="none" opacity="0.8" />
    </svg>
  );
}

const SLIDES = [
  {
    key: 'welcome',
    art: (
      <div className="welcome-brand">
        <p className="welcome-kicker">Welcome to</p>
        <div className="welcome-wordmark">
          <span className="welcome-mark">
            <Waves strokeWidth={2.4} />
          </span>
          Vrinzu
        </div>
      </div>
    ),
    title: 'You’re gonna love it twin',
    text: 'Your private journal for every thought, mood and memory.',
  },
  {
    key: 'journals',
    art: (
      <div className="welcome-book">
        <span className="welcome-book-spine" />
        <SeaScene />
        <span className="welcome-book-label">
          <strong>Your Vrinzu Journal</strong>
          <span>Journal name</span>
        </span>
      </div>
    ),
    title: 'Your Private Journals',
    text: 'Create & customize journals for everything in your life.',
  },
  {
    key: 'entries',
    art: (
      <div className="welcome-cards">
        <div className="welcome-card welcome-card-back">
          <BeachScene />
        </div>
        <div className="welcome-card welcome-card-front">
          <MountainScene />
          <div className="welcome-card-body">
            <strong>Weekend in the Mountains!</strong>
            <span>Spent the morning by the lake watching the clouds roll over the peaks…</span>
            <small>{format(new Date(), 'MMMM d, yyyy')}</small>
          </div>
        </div>
      </div>
    ),
    title: 'Rich Entries',
    text: 'Add photos and choose fonts to make your journals your own.',
  },
];

/** Phone welcome: three swipeable slides over the ocean, with Sign In / Sign Up below. */
export default function Welcome() {
  const trackRef = useRef(null);
  const [active, setActive] = useState(0);
  useBarColor(WELCOME_BAR);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return undefined;
    const onScroll = () => setActive(Math.round(track.scrollLeft / track.clientWidth));
    track.addEventListener('scroll', onScroll, { passive: true });
    return () => track.removeEventListener('scroll', onScroll);
  }, []);

  const goTo = (i) => {
    const track = trackRef.current;
    track?.scrollTo({ left: i * track.clientWidth, behavior: 'smooth' });
  };

  return (
    <div className="welcome">
      <Helmet>
        <title>Welcome · Vrinzu</title>
      </Helmet>
      <div className="welcome-bg" aria-hidden="true">
        <span className="welcome-glow welcome-glow-1" />
        <span className="welcome-glow welcome-glow-2" />
        <svg className="welcome-waves" viewBox="0 0 1200 120" preserveAspectRatio="none">
          <path d="M0 60 Q150 20 300 60 T600 60 T900 60 T1200 60 V120 H0Z" />
          <path d="M0 80 Q150 45 300 80 T600 80 T900 80 T1200 80 V120 H0Z" />
        </svg>
      </div>

      <div
        className="welcome-track"
        ref={trackRef}
        tabIndex={0}
        aria-roledescription="carousel"
        onKeyDown={(e) => {
          if (e.key === 'ArrowRight') goTo(Math.min(SLIDES.length - 1, active + 1));
          if (e.key === 'ArrowLeft') goTo(Math.max(0, active - 1));
        }}
      >
        {SLIDES.map((s, i) => (
          <section
            key={s.key}
            className={`welcome-slide welcome-slide-${s.key}${i === active ? ' is-active' : ''}`}
            aria-roledescription="slide"
            aria-label={`${i + 1} of ${SLIDES.length}`}
          >
            <div className="welcome-art">{s.art}</div>
            <h1 className="welcome-title">{s.title}</h1>
            <p className="welcome-text">{s.text}</p>
          </section>
        ))}
      </div>

      <div className="welcome-dots" role="tablist" aria-label="Slides">
        {SLIDES.map((s, i) => (
          <button
            key={s.key}
            type="button"
            role="tab"
            aria-selected={i === active}
            aria-label={`Slide ${i + 1}`}
            className={`welcome-dot${i === active ? ' is-active' : ''}`}
            onClick={() => goTo(i)}
          />
        ))}
      </div>

      <nav className="welcome-actions">
        <Link to="/login" className="welcome-action">
          Sign In
        </Link>
        <Link to="/signup" className="welcome-action">
          Sign Up
        </Link>
      </nav>
    </div>
  );
}
