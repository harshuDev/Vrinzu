/*
 * Decoration for the optional Winter theme: gently falling snow and a small
 * snowy scene along the bottom of the screen (hills, pines, a cosy house and a
 * snowman). Always rendered, but only shown when <html data-theme="winter">,
 * so switching themes is instant. Purely decorative and hidden from screen readers.
 */

// Fixed positions so the snowfall looks the same on every render.
const FLAKES = [
  [4, 0, 11, 3],
  [11, 6, 14, 5],
  [18, 2, 9, 2],
  [26, 9, 13, 4],
  [33, 4, 10, 3],
  [41, 11, 15, 5],
  [48, 1, 12, 2],
  [56, 7, 9, 3],
  [63, 3, 14, 4],
  [70, 10, 11, 2],
  [77, 5, 13, 5],
  [84, 8, 10, 3],
  [91, 2, 12, 4],
  [96, 12, 9, 2],
  [8, 14, 13, 3],
  [37, 15, 11, 4],
  [59, 13, 12, 2],
  [88, 16, 14, 3],
]; // [left %, delay s, duration s, size px]

function Flake({ big }) {
  if (!big) return <span className="winter-dot" />;
  return (
    <svg viewBox="0 0 24 24" className="winter-star">
      <g stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <path d="M12 2v20M3.3 7l17.4 10M3.3 17l17.4-10" />
        <path d="M9 4l3 2 3-2M9 20l3-2 3 2M4 10.5l3.5.5-1.5 3M20 13.5l-3.5-.5 1.5-3M4 13.5l3.5-.5L6 10M20 10.5l-3.5.5 1.5 3" />
      </g>
    </svg>
  );
}

function Pine({ x, y, s = 1 }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <rect x="-3" y="34" width="6" height="10" fill="#7a5a4a" />
      <path d="M0 -6 L18 22 H-18 Z" fill="#5f7bb0" />
      <path d="M0 6 L22 38 H-22 Z" fill="#4f6aa0" />
      <path d="M0 -6 L8 6 Q0 9 -8 6 Z M-12 22 Q0 27 12 22 L15 27 Q0 32 -15 27 Z" fill="#ffffff" opacity="0.95" />
    </g>
  );
}

export default function WinterScene() {
  return (
    <div className="winter-scene" aria-hidden="true">
      <div className="winter-snow">
        {FLAKES.map(([left, delay, dur, size], i) => (
          <span
            key={i}
            className="winter-flake"
            style={{
              left: `${left}%`,
              animationDelay: `-${delay}s`,
              animationDuration: `${dur}s`,
              '--size': `${size}px`,
            }}
          >
            <Flake big={size >= 4 && i % 2 === 0} />
          </span>
        ))}
      </div>

      <svg className="winter-hills" viewBox="0 0 1200 140" preserveAspectRatio="xMidYMax slice">
        {/* far hills */}
        <path d="M0 78 Q120 40 260 70 T540 62 T820 72 T1200 58 V140 H0Z" fill="#b9c2ea" />
        <path d="M0 96 Q160 62 330 92 T700 86 T1000 94 T1200 84 V140 H0Z" fill="#e9ecfb" />

        <Pine x={120} y={58} s={0.9} />
        <Pine x={152} y={70} s={0.7} />
        <Pine x={1010} y={52} s={1} />
        <Pine x={1046} y={68} s={0.75} />
        <Pine x={640} y={66} s={0.65} />
        <Pine x={380} y={74} s={0.6} />
        <Pine x={835} y={70} s={0.7} />

        {/* cosy house */}
        <g transform="translate(420 66)">
          <rect x="0" y="16" width="46" height="34" rx="2" fill="#f4e7da" />
          <path d="M-6 18 L23 -6 L52 18 Z" fill="#c0504a" />
          <path d="M-7 18 Q23 -8 53 18 Q40 10 23 4 Q6 10 -7 18Z" fill="#ffffff" />
          <rect x="9" y="25" width="11" height="10" rx="1.5" fill="#ffd27a" />
          <rect x="28" y="30" width="10" height="20" rx="1.5" fill="#8c6450" />
          <rect x="34" y="-2" width="7" height="12" fill="#a8625a" />
        </g>

        {/* snowman */}
        <g transform="translate(770 62)">
          <circle cx="0" cy="34" r="16" fill="#ffffff" stroke="#c9d0ee" strokeWidth="1.5" />
          <circle cx="0" cy="12" r="11" fill="#ffffff" stroke="#c9d0ee" strokeWidth="1.5" />
          <circle cx="-3.5" cy="10" r="1.4" fill="#2c3565" />
          <circle cx="3.5" cy="10" r="1.4" fill="#2c3565" />
          <path d="M0 13 l7 2 -7 1z" fill="#f0884c" />
          <path d="M-10 19 Q0 24 10 19 L11 23 Q0 28 -11 23 Z" fill="#c0504a" />
          <rect x="5" y="21" width="5" height="11" rx="1.5" fill="#c0504a" />
          <path d="M-9 4 Q0 -10 9 4 Z" fill="#4f5fb6" />
          <circle cx="0" cy="-5" r="3" fill="#ffffff" />
        </g>

        {/* snow in front */}
        <path d="M0 118 Q200 98 420 114 T860 112 T1200 108 V140 H0Z" fill="#ffffff" />
      </svg>
    </div>
  );
}
