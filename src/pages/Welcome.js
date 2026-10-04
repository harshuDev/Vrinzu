import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { format } from 'date-fns';
import { LOGO_SRC } from '../components/Logo';
import { useBarColor } from '../lib/theme';

const WELCOME_BAR = '#0284c7';

// Journal photos shown on the slides (in public/welcome).
const photo = (name) => `${process.env.PUBLIC_URL}/welcome/${name}`;

const SLIDES = [
  {
    key: 'welcome',
    art: (
      <div className="welcome-brand">
        <p className="welcome-kicker">Welcome to</p>
        <div className="welcome-wordmark">
          <img className="welcome-mark" src={LOGO_SRC} alt="" />
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
        <img src={photo('scrapbook-page.webp')} alt="" />
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
          <img src={photo('scrapbook-page.webp')} alt="" />
        </div>
        <div className="welcome-card welcome-card-front">
          <img src={photo('planner-spread.webp')} alt="" />
          <div className="welcome-card-body">
            <strong>My March Spread</strong>
            <span>Pressed flowers, a little calendar and a to-do list for the week ahead…</span>
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
