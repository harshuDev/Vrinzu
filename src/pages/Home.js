import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import toast from 'react-hot-toast';
import {
  addDays,
  differenceInCalendarYears,
  format,
  getDayOfYear,
  isSameDay,
  isToday,
  startOfDay,
  startOfWeek,
  subMonths,
  subYears,
} from 'date-fns';
import { ArrowRight, Check, Clock, Feather, Flame, Lightbulb, Lock, PenLine, Plus, Shuffle, X } from 'lucide-react';
import EntryList, { EntryRow } from '../components/EntryList';
import JournalCover from '../components/JournalCover';
import { Bone, ListSkeleton } from '../components/Skeleton';
import { supabase } from '../lib/supabase';
import { PROMPTS } from '../lib/constants';
import { cleanupStaleBlankEntries, entryDisplayTitle } from '../lib/api';
import { computeStreaks, dayKey } from '../lib/stats';
import { deleteEntryWithUndo, restoreInto } from '../lib/undoDelete';
import { markWroteToday } from '../lib/reminders';
import { useAuth } from '../context/AuthContext';
import { useStartEntry } from '../context/StartEntryContext';

// One tap on these starts today's entry with that mood (no check-in needed).
const QUICK_MOODS = ['😊', '😌', '🤔', '😴', '😔', '🎉'];
const PROMPT_DISMISS_KEY = 'vrinzu-prompt-dismissed';

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

const readDismissed = () => {
  try {
    return localStorage.getItem(PROMPT_DISMISS_KEY) === dayKey(new Date());
  } catch {
    return false;
  }
};

/** Mon–Sun of the current week, each marked if something was written that day. */
function WeekStrip({ writtenDays }) {
  const today = new Date();
  const start = startOfWeek(today, { weekStartsOn: 1 });
  return (
    <ol className="week-strip" aria-label="This week">
      {Array.from({ length: 7 }, (_, i) => {
        const day = addDays(start, i);
        const done = writtenDays.has(dayKey(day));
        const future = day > today && !isSameDay(day, today);
        return (
          <li
            key={i}
            className={`week-day${done ? ' is-done' : ''}${isSameDay(day, today) ? ' is-today' : ''}${
              future ? ' is-future' : ''
            }`}
            aria-label={`${format(day, 'EEEE')}${done ? ': written' : ''}`}
          >
            <span className="week-day-dot">{done ? <Check size={14} strokeWidth={3} /> : format(day, 'd')}</span>
            <span className="week-day-name">{format(day, 'EEEEE')}</span>
          </li>
        );
      })}
    </ol>
  );
}

export default function Home() {
  const { displayName } = useAuth();
  const startEntry = useStartEntry();
  const [loading, setLoading] = useState(true);
  const [recent, setRecent] = useState([]);
  const [journals, setJournals] = useState([]);
  const [streak, setStreak] = useState(0);
  const [writtenDays, setWrittenDays] = useState(new Set());
  const [memories, setMemories] = useState([]);
  const [starting, setStarting] = useState(false);
  const [promptOffset, setPromptOffset] = useState(0);
  const [promptHidden, setPromptHidden] = useState(readDismissed);

  const today = new Date();
  const prompt = PROMPTS[(getDayOfYear(today) + promptOffset) % PROMPTS.length];

  useEffect(() => {
    let cancelled = false;
    (async () => {
      await cleanupStaleBlankEntries();
      const now = new Date();
      const memoryFilter = memoryRanges(now)
        .map(([a, b]) => `and(created_at.gte.${a.toISOString()},created_at.lt.${b.toISOString()})`)
        .join(',');
      const [recentRes, journalsRes, datesRes, memoryRes] = await Promise.all([
        supabase.from('entries').select('*, journals(*)').order('created_at', { ascending: false }).limit(8),
        supabase.from('journals').select('*').order('updated_at', { ascending: false }).limit(8),
        supabase.from('entries').select('created_at').order('created_at', { ascending: false }).limit(10000),
        supabase.from('entries').select('*, journals(*)').or(memoryFilter).order('created_at', { ascending: true }),
      ]);
      if (cancelled) return;
      const error = [recentRes, journalsRes, datesRes, memoryRes].find((r) => r.error)?.error;
      if (error) toast.error(error.message);
      const dates = (datesRes.data ?? []).map((e) => e.created_at);
      const streaks = computeStreaks(dates, now);
      if (streaks.wroteToday) markWroteToday();
      setRecent(recentRes.data ?? []);
      setJournals(journalsRes.data ?? []);
      setStreak(streaks.current);
      setWrittenDays(new Set(dates.map(dayKey)));
      // Prefer memories from past years; fall back to a month ago.
      const all = memoryRes.data ?? [];
      const yearly = all.filter((e) => differenceInCalendarYears(now, new Date(e.created_at)) >= 1);
      setMemories((yearly.length ? yearly : all).slice(0, 1));
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

  const dismissPrompt = () => {
    setPromptHidden(true);
    try {
      localStorage.setItem(PROMPT_DISMISS_KEY, dayKey(new Date()));
    } catch {
      // Not saved for next time; it's still hidden for now.
    }
  };

  const handleDelete = (entry) =>
    deleteEntryWithUndo(entry, {
      onRemove: () => setRecent((list) => list.filter((e) => e.id !== entry.id)),
      onRestore: () => setRecent(restoreInto(entry)),
    });

  const firstName = displayName.split(' ')[0];
  const todays = recent.filter((e) => isToday(new Date(e.created_at)));
  const earlier = recent.filter((e) => e.id !== todays[0]?.id);

  return (
    <div className="page page-home">
      <Helmet>
        <title>Home · Vrinzu</title>
      </Helmet>

      <header className="home-head">
        <div>
          <p className="home-date">{format(today, 'EEEE, d MMMM')}</p>
          <h1 className="home-greeting">
            {greeting()}, <span className="nowrap">{firstName}</span>
          </h1>
        </div>
        <Link
          to="/app/insights"
          className={`streak-badge${streak > 0 ? ' is-on' : ''}`}
          aria-label={`${streak} day streak`}
          title="Day streak"
        >
          <Flame size={18} /> {loading ? '·' : streak}
        </Link>
      </header>

      {loading ? (
        <>
          <div className="today-card">
            <Bone w="40%" h={13} />
            <Bone w="70%" h={26} r={8} />
            <Bone h={48} r={14} />
          </div>
          <ListSkeleton rows={4} />
        </>
      ) : (
        <>
          <section className="today-card">
            {todays.length > 0 ? (
              <>
                <div className="today-head">
                  <p className="today-kicker">Today’s page</p>
                  <button type="button" className="link-btn today-new" onClick={() => write()} disabled={starting}>
                    <Plus size={16} /> New page
                  </button>
                </div>
                <Link to={`/app/entries/${todays[0].id}`} className="today-entry">
                  <span className="today-entry-mood">{todays[0].mood || '📝'}</span>
                  <span className="today-entry-text">
                    <strong>{entryDisplayTitle(todays[0])}</strong>
                    <span>{todays[0].content?.trim() || 'Pick up where you left off…'}</span>
                  </span>
                  <span className="today-entry-go" aria-hidden="true">
                    <span className="today-entry-go-label">Continue</span> <ArrowRight size={18} />
                  </span>
                </Link>
              </>
            ) : (
              <>
                <p className="today-kicker">Today’s page is blank</p>
                <h2 className="today-title">How are you feeling?</h2>
                <div className="quick-moods">
                  {QUICK_MOODS.map((m) => (
                    <button
                      key={m}
                      type="button"
                      className="quick-mood"
                      onClick={() => write({ mood: m })}
                      disabled={starting}
                      aria-label={`Start writing, feeling ${m}`}
                    >
                      {m}
                    </button>
                  ))}
                </div>
                <button type="button" className="btn btn-primary btn-block" onClick={() => write()} disabled={starting}>
                  <PenLine size={18} /> {starting ? 'Opening…' : 'Write today’s entry'}
                </button>
              </>
            )}
            <WeekStrip writtenDays={writtenDays} />
          </section>

          {!promptHidden && (
            <section className="prompt-card">
              <span className="prompt-icon">
                <Lightbulb size={18} />
              </span>
              <div className="prompt-body">
                <p className="prompt-kicker">Prompt of the day</p>
                <p className="prompt-text">{prompt}</p>
                <div className="prompt-actions">
                  <button
                    type="button"
                    className="btn btn-outline btn-sm"
                    onClick={() => write({ title: prompt })}
                    disabled={starting}
                  >
                    Write about this
                  </button>
                  <button
                    type="button"
                    className="icon-btn"
                    onClick={() => setPromptOffset((n) => n + 1)}
                    aria-label="Show another prompt"
                    title="Another prompt"
                  >
                    <Shuffle size={17} />
                  </button>
                </div>
              </div>
              <button
                type="button"
                className="icon-btn prompt-close"
                onClick={dismissPrompt}
                aria-label="Hide prompt for today"
              >
                <X size={17} />
              </button>
            </section>
          )}

          {memories.length > 0 && (
            <section className="home-section">
              <div className="section-row">
                <h2 className="section-heading">
                  <Clock size={17} /> On this day
                </h2>
                <span className="memory-label">{memoryLabel(memories[0].created_at, today)}</span>
              </div>
              <div className="entry-rows">
                <EntryRow entry={memories[0]} showJournal />
              </div>
            </section>
          )}

          {journals.length > 0 && (
            <section className="home-section">
              <div className="section-row">
                <h2 className="section-heading">Journals</h2>
                <Link to="/app/journals" className="link-more">
                  All <ArrowRight size={15} />
                </Link>
              </div>
              <div className="journal-chips">
                {journals.map((j) => (
                  <Link key={j.id} to={`/app/journals/${j.id}`} className="journal-chip">
                    <JournalCover color={j.cover_color} emoji={j.cover_emoji} pattern={j.cover_pattern} size="xs" />
                    <span>{j.title}</span>
                    {j.is_locked && <Lock size={13} className="mini-journal-lock" aria-label="Locked" />}
                  </Link>
                ))}
              </div>
            </section>
          )}

          <section className="home-section">
            <h2 className="section-heading">Recent entries</h2>
            {recent.length === 0 ? (
              <div className="empty-state empty-state-soft">
                <span className="empty-icon">
                  <Feather size={26} />
                </span>
                <h3>Your first page is waiting</h3>
                <p>Pick a mood above, or start with a single sentence about today.</p>
              </div>
            ) : earlier.length === 0 ? (
              <p className="section-note">Earlier entries will show up here.</p>
            ) : (
              <EntryList entries={earlier} showJournal onDelete={handleDelete} />
            )}
          </section>
        </>
      )}
    </div>
  );
}
