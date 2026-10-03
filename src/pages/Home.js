import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import toast from 'react-hot-toast';
import {
  addDays,
  differenceInCalendarYears,
  getDayOfYear,
  startOfDay,
  startOfMonth,
  startOfWeek,
  subMonths,
  subYears,
} from 'date-fns';
import { ArrowRight, Clock, Feather, Flame, Lightbulb, Lock, PenLine, Shuffle } from 'lucide-react';
import EntryCard from '../components/EntryCard';
import JournalCover from '../components/JournalCover';
import Spinner from '../components/Spinner';
import { supabase } from '../lib/supabase';
import { PROMPTS } from '../lib/constants';
import { computeStreaks, wordCount } from '../lib/stats';
import { useAuth } from '../context/AuthContext';
import { useStartEntry } from '../context/StartEntryContext';

const nf = new Intl.NumberFormat();

function greeting() {
  const hour = new Date().getHours();
  if (hour < 5) return 'Good night';
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

/** Same calendar day 1 to 5 years ago, plus a month ago for newer journals. */
function memoryRanges(today) {
  const day = startOfDay(today);
  const ranges = [1, 2, 3, 4, 5].map((n) => subYears(day, n));
  ranges.push(subMonths(day, 1));
  return ranges.map((start) => [start, addDays(start, 1)]);
}

function memoryLabel(dateStr, today) {
  const years = differenceInCalendarYears(today, new Date(dateStr));
  if (years >= 1) return `${years} ${years === 1 ? 'year' : 'years'} ago today`;
  return 'A month ago today';
}

export default function Home() {
  const { displayName } = useAuth();
  const startEntry = useStartEntry();
  const [loading, setLoading] = useState(true);
  const [recent, setRecent] = useState([]);
  const [journals, setJournals] = useState([]);
  const [stats, setStats] = useState({ week: 0, monthWords: 0, streak: 0, wroteToday: false });
  const [memories, setMemories] = useState([]);
  const [starting, setStarting] = useState(false);
  const [promptOffset, setPromptOffset] = useState(0);

  const today = new Date();
  const prompt = PROMPTS[(getDayOfYear(today) + promptOffset) % PROMPTS.length];

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const now = new Date();
      const weekStart = startOfWeek(now, { weekStartsOn: 1 }).toISOString();
      const memoryFilter = memoryRanges(now)
        .map(([a, b]) => `and(created_at.gte.${a.toISOString()},created_at.lt.${b.toISOString()})`)
        .join(',');
      const [recentRes, journalsRes, weekRes, datesRes, monthRes, memoryRes] = await Promise.all([
        supabase.from('entries').select('*, journals(*)').order('created_at', { ascending: false }).limit(6),
        supabase.from('journals').select('*').order('updated_at', { ascending: false }).limit(4),
        supabase.from('entries').select('id', { count: 'exact', head: true }).gte('created_at', weekStart),
        supabase.from('entries').select('created_at').order('created_at', { ascending: false }).limit(10000),
        supabase.from('entries').select('content').gte('created_at', startOfMonth(now).toISOString()),
        supabase.from('entries').select('*, journals(*)').or(memoryFilter).order('created_at', { ascending: true }),
      ]);
      if (cancelled) return;
      const error = [recentRes, journalsRes, weekRes, datesRes, monthRes, memoryRes].find((r) => r.error)?.error;
      if (error) toast.error(error.message);
      const streaks = computeStreaks(
        (datesRes.data ?? []).map((e) => e.created_at),
        now,
      );
      setRecent(recentRes.data ?? []);
      setJournals(journalsRes.data ?? []);
      setStats({
        week: weekRes.count ?? 0,
        monthWords: (monthRes.data ?? []).reduce((sum, e) => sum + wordCount(e.content), 0),
        streak: streaks.current,
        wroteToday: streaks.wroteToday,
      });
      // Prefer memories from past years; fall back to a month ago.
      const all = memoryRes.data ?? [];
      const yearly = all.filter((e) => differenceInCalendarYears(now, new Date(e.created_at)) >= 1);
      setMemories((yearly.length ? yearly : all).slice(0, 3));
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const write = async (options) => {
    setStarting(true);
    await startEntry(options);
    setStarting(false);
  };

  const firstName = displayName.split(' ')[0];

  return (
    <div className="page">
      <Helmet>
        <title>Home · Vrinzu</title>
      </Helmet>

      <section className="home-hero">
        <div>
          <p className="home-date">
            {today.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
          </p>
          <h1 className="page-title">
            {greeting()},{' '}
            <span className="nowrap">
              {firstName} <span aria-hidden="true">🌊</span>
            </span>
          </h1>
          <p className="page-subtitle">What’s on your mind today?</p>
        </div>
        <button type="button" className="btn btn-light btn-lg" onClick={() => write()} disabled={starting}>
          <PenLine size={18} /> {starting ? 'Opening…' : 'Write today’s entry'}
        </button>
      </section>

      {loading ? (
        <Spinner />
      ) : (
        <>
          <section className="stats-grid">
            <Link to="/app/insights" className="stat-card stat-streak">
              <span className="stat-value">
                <Flame size={24} className="streak-flame" /> {stats.streak}
              </span>
              <span className="stat-label">
                Day streak
                {!stats.wroteToday && stats.streak > 0 ? ' · keep it going' : ''}
              </span>
            </Link>
            <div className="stat-card">
              <span className="stat-value">{stats.week}</span>
              <span className="stat-label">This week</span>
            </div>
            <div className="stat-card">
              <span className="stat-value">{nf.format(stats.monthWords)}</span>
              <span className="stat-label">Words this month</span>
            </div>
          </section>

          <section className="prompt-card">
            <span className="prompt-icon">
              <Lightbulb size={20} />
            </span>
            <div className="prompt-body">
              <p className="prompt-kicker">Today’s prompt</p>
              <p className="prompt-text">{prompt}</p>
            </div>
            <div className="prompt-actions">
              <button
                type="button"
                className="icon-btn"
                onClick={() => setPromptOffset((n) => n + 1)}
                aria-label="Show another prompt"
                title="Another prompt"
              >
                <Shuffle size={18} />
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => write({ title: prompt })}
                disabled={starting}
              >
                Write about this
              </button>
            </div>
          </section>

          {memories.length > 0 && (
            <section className="home-section">
              <div className="section-row">
                <h2 className="section-heading">
                  <Clock size={18} /> On this day
                </h2>
                <span className="memory-label">{memoryLabel(memories[0].created_at, today)}</span>
              </div>
              <div className="entry-list">
                {memories.map((entry) => (
                  <EntryCard key={entry.id} entry={entry} showJournal />
                ))}
              </div>
            </section>
          )}

          {journals.length > 0 && (
            <section className="home-section">
              <div className="section-row">
                <h2 className="section-heading">Your journals</h2>
                <Link to="/app/journals" className="link-more">
                  View all <ArrowRight size={16} />
                </Link>
              </div>
              <div className="mini-journals">
                {journals.map((j) => (
                  <Link key={j.id} to={`/app/journals/${j.id}`} className="mini-journal">
                    <JournalCover color={j.cover_color} emoji={j.cover_emoji} size="xs" />
                    <span>{j.title}</span>
                    {j.is_locked && <Lock size={14} className="mini-journal-lock" aria-label="Locked" />}
                  </Link>
                ))}
              </div>
            </section>
          )}

          <section className="home-section">
            <h2 className="section-heading">Recent entries</h2>
            {recent.length === 0 ? (
              <div className="empty-state">
                <span className="empty-icon">
                  <Feather size={28} />
                </span>
                <h3>Your first page is waiting</h3>
                <p>Start with a single sentence about today. You can always come back to it.</p>
                <button type="button" className="btn btn-primary" onClick={() => write()} disabled={starting}>
                  <PenLine size={18} /> Write your first entry
                </button>
              </div>
            ) : (
              <div className="entry-list">
                {recent.map((entry) => (
                  <EntryCard key={entry.id} entry={entry} showJournal />
                ))}
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}
