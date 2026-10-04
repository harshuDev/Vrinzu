import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import toast from 'react-hot-toast';
import { format, getDaysInMonth, isAfter } from 'date-fns';
import { ChevronLeft, ChevronRight, Flame } from 'lucide-react';
import Spinner from '../components/Spinner';
import { supabase } from '../lib/supabase';
import { MOOD_GROUPS, MOODS, moodGroup } from '../lib/constants';
import { computeStreaks, dayKey, wordCount } from '../lib/stats';

const MONTH_INITIALS = ['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'];
const nf = new Intl.NumberFormat();

/**
 * Shared label for chart marks (pixels and bars): shown on hover and focus,
 * and on tap when `tap` is set, since phones have no hover.
 */
function useTooltip() {
  const [tip, setTip] = useState(null);
  const hideTimer = useRef(null);

  useEffect(() => {
    if (!tip) return undefined;
    const hide = () => setTip(null);
    window.addEventListener('scroll', hide, { passive: true, capture: true });
    return () => window.removeEventListener('scroll', hide, { capture: true });
  }, [tip]);

  useEffect(() => () => clearTimeout(hideTimer.current), []);

  const show = (e, text) => {
    clearTimeout(hideTimer.current);
    const r = e.currentTarget.getBoundingClientRect();
    setTip({ text, x: r.left + r.width / 2, y: r.top });
  };
  const bind = (text, { tap = false } = {}) => ({
    onMouseEnter: (e) => show(e, text),
    onMouseLeave: () => setTip(null),
    onFocus: (e) => show(e, text),
    onBlur: () => setTip(null),
    ...(tap && {
      onClick: (e) => {
        show(e, text);
        hideTimer.current = setTimeout(() => setTip(null), 2500);
      },
    }),
  });
  const node = tip && (
    <div className="chart-tooltip" style={{ left: tip.x, top: tip.y }} role="status">
      {tip.text}
    </div>
  );
  return [bind, node];
}

export default function Insights() {
  const navigate = useNavigate();
  const thisYear = new Date().getFullYear();
  const [year, setYear] = useState(thisYear);
  const [yearEntries, setYearEntries] = useState([]);
  const [allDates, setAllDates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [bind, tooltip] = useTooltip();

  useEffect(() => {
    supabase
      .from('entries')
      .select('created_at')
      .order('created_at', { ascending: false })
      .limit(10000)
      .then(({ data }) => setAllDates((data ?? []).map((e) => e.created_at)));
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    supabase
      .from('entries')
      .select('id, created_at, mood, content')
      .gte('created_at', new Date(year, 0, 1).toISOString())
      .lt('created_at', new Date(year + 1, 0, 1).toISOString())
      .order('created_at', { ascending: true })
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error) toast.error(error.message);
        setYearEntries(data ?? []);
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [year]);

  const streaks = useMemo(() => computeStreaks(allDates), [allDates]);

  const { byDay, words, moodCounts, groupCounts, perMonth } = useMemo(() => {
    const days = {};
    const moods = {};
    const groups = { bright: 0, calm: 0, heavy: 0 };
    const months = Array(12).fill(0);
    let w = 0;
    for (const e of yearEntries) {
      const d = new Date(e.created_at);
      const k = dayKey(d);
      const day = (days[k] ||= { count: 0, mood: null });
      day.count += 1;
      if (e.mood) day.mood = e.mood; // latest mood of the day wins
      months[d.getMonth()] += 1;
      w += wordCount(e.content);
      if (e.mood) {
        moods[e.mood] = (moods[e.mood] || 0) + 1;
        const g = moodGroup(e.mood);
        if (g) groups[g] += 1;
      }
    }
    return { byDay: days, words: w, moodCounts: moods, groupCounts: groups, perMonth: months };
  }, [yearEntries]);

  const daysWritten = Object.keys(byDay).length;
  const moodTotal = Object.values(moodCounts).reduce((a, b) => a + b, 0);
  const moodRows = MOODS.filter((m) => moodCounts[m.emoji]).sort((a, b) => moodCounts[b.emoji] - moodCounts[a.emoji]);
  const maxMood = Math.max(1, ...Object.values(moodCounts));
  const maxMonth = Math.max(1, ...perMonth);
  const today = new Date();

  return (
    <div className="page insights">
      <Helmet>
        <title>Insights · Vrinzu</title>
      </Helmet>
      <div className="page-header">
        <div>
          <h1 className="page-title">Insights</h1>
          <p className="page-subtitle">Your writing habit and moods at a glance.</p>
        </div>
        <div className="year-switch" aria-label="Year">
          <button type="button" className="icon-btn" onClick={() => setYear(year - 1)} aria-label="Previous year">
            <ChevronLeft size={20} />
          </button>
          <span>{year}</span>
          <button
            type="button"
            className="icon-btn"
            onClick={() => setYear(year + 1)}
            disabled={year >= thisYear}
            aria-label="Next year"
          >
            <ChevronRight size={20} />
          </button>
        </div>
      </div>

      <section className="kpi-row">
        <div className="stat-card stat-streak">
          <span className="stat-value">
            <Flame size={26} className="streak-flame" /> {streaks.current}
          </span>
          <span className="stat-label">
            Day streak{streaks.wroteToday ? '' : streaks.current ? ' · write today to keep it' : ''}
          </span>
        </div>
        <div className="stat-card">
          <span className="stat-value">{streaks.longest}</span>
          <span className="stat-label">Longest streak</span>
        </div>
        <div className="stat-card">
          <span className="stat-value">{nf.format(yearEntries.length)}</span>
          <span className="stat-label">Entries in {year}</span>
        </div>
        <div className="stat-card">
          <span className="stat-value">{nf.format(words)}</span>
          <span className="stat-label">Words in {year}</span>
        </div>
      </section>

      {loading ? (
        <Spinner />
      ) : (
        <div className="insights-grid">
          <section className="chart-card pixels-card">
            <div className="chart-head">
              <h2>Year in Pixels</h2>
              <p>
                {daysWritten} {daysWritten === 1 ? 'day' : 'days'} written in {year}. Each square is a day, coloured by
                how you felt.
              </p>
            </div>
            <div className="pixels" role="grid" aria-label={`Moods by day in ${year}`}>
              <span />
              {MONTH_INITIALS.map((m, i) => (
                <span key={i} className="pixels-month" aria-hidden="true">
                  {m}
                </span>
              ))}
              {Array.from({ length: 31 }, (_, d) => (
                <div key={d} className="pixels-row" role="row">
                  <span className="pixels-day" aria-hidden="true">
                    {d % 5 === 0 || d === 30 ? d + 1 : ''}
                  </span>
                  {Array.from({ length: 12 }, (_, m) => {
                    const date = new Date(year, m, d + 1);
                    if (d + 1 > getDaysInMonth(new Date(year, m, 1)))
                      return <span key={m} className="pixel pixel-void" />;
                    const info = byDay[dayKey(date)];
                    const g = info?.mood ? moodGroup(info.mood) : null;
                    const future = isAfter(date, today);
                    const label = `${format(date, 'EEE, MMM d')}: ${
                      info
                        ? `${info.mood ? `${info.mood} ${MOODS.find((x) => x.emoji === info.mood)?.label}` : 'no mood'} · ${
                            info.count
                          } ${info.count === 1 ? 'entry' : 'entries'}`
                        : 'no entry'
                    }`;
                    const cls = info
                      ? g
                        ? `pixel mood-${g}`
                        : 'pixel pixel-none'
                      : `pixel pixel-empty${future ? ' pixel-future' : ''}`;
                    return (
                      <button
                        type="button"
                        key={m}
                        className={cls}
                        aria-label={label}
                        disabled={future}
                        onClick={() => navigate(`/app/calendar?date=${dayKey(date)}`)}
                        {...bind(label)}
                      />
                    );
                  })}
                </div>
              ))}
            </div>
            <div className="chart-legend">
              {MOOD_GROUPS.map((g) => (
                <span key={g.key}>
                  <i className={`legend-swatch mood-${g.key}`} /> {g.label}
                </span>
              ))}
              <span>
                <i className="legend-swatch pixel-none" /> No mood
              </span>
              <span>
                <i className="legend-swatch pixel-empty" /> No entry
              </span>
            </div>
          </section>

          <div className="insights-side">
            <section className="chart-card">
              <div className="chart-head">
                <h2>Moods</h2>
                <p>
                  {moodTotal
                    ? MOOD_GROUPS.map((g) => `${g.label} ${Math.round((groupCounts[g.key] / moodTotal) * 100)}%`).join(
                        ' · ',
                      )
                    : `No moods recorded in ${year} yet.`}
                </p>
              </div>
              <div className="mood-bars">
                {moodRows.map((m) => (
                  <div
                    key={m.emoji}
                    className="mood-bar-row"
                    tabIndex={0}
                    {...bind(`${m.label}: ${moodCounts[m.emoji]}`, { tap: true })}
                  >
                    <span className="mood-bar-label">
                      {m.emoji} {m.label}
                    </span>
                    <span className="mood-bar-track">
                      <span
                        className={`mood-bar mood-${m.group}`}
                        style={{ width: `${(moodCounts[m.emoji] / maxMood) * 100}%` }}
                      />
                    </span>
                    <span className="mood-bar-value">{moodCounts[m.emoji]}</span>
                  </div>
                ))}
              </div>
            </section>

            <section className="chart-card">
              <div className="chart-head">
                <h2>Entries per month</h2>
                <p>
                  Busiest:{' '}
                  {Math.max(...perMonth) > 0
                    ? `${format(new Date(year, perMonth.indexOf(Math.max(...perMonth)), 1), 'MMMM')} (${Math.max(...perMonth)})`
                    : 'none yet'}
                </p>
              </div>
              <div className="month-bars" role="img" aria-label={`Entries per month in ${year}`}>
                {perMonth.map((n, i) => (
                  <div
                    key={i}
                    className="month-bar-col"
                    tabIndex={0}
                    {...bind(`${format(new Date(year, i, 1), 'MMMM')}: ${n}`, { tap: true })}
                  >
                    <span className="month-bar-slot">
                      {n === maxMonth && n > 0 && <span className="month-bar-value">{n}</span>}
                      <span className="month-bar" style={{ height: `${(n / maxMonth) * 100}%` }} />
                    </span>
                    <span className="month-bar-label">{MONTH_INITIALS[i]}</span>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </div>
      )}
      {tooltip}
    </div>
  );
}
