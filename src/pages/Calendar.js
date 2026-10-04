import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import toast from 'react-hot-toast';
import {
  addDays,
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isAfter,
  isSameDay,
  isSameMonth,
  isToday,
  startOfDay,
  startOfMonth,
  startOfWeek,
} from 'date-fns';
import { ChevronLeft, ChevronRight, Feather, PenLine } from 'lucide-react';
import EntryList from '../components/EntryList';
import { ListSkeleton } from '../components/Skeleton';
import { supabase } from '../lib/supabase';
import { useStartEntry } from '../context/StartEntryContext';

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const dayKey = (d) => format(d, 'yyyy-MM-dd');

export default function Calendar() {
  const startEntry = useStartEntry();
  const [searchParams] = useSearchParams();
  // ?date=YYYY-MM-DD (from Insights) opens straight to that day.
  const initialDay = (() => {
    const p = searchParams.get('date');
    const d = p && /^\d{4}-\d{2}-\d{2}$/.test(p) ? new Date(`${p}T12:00:00`) : null;
    return d && !Number.isNaN(d.getTime()) ? d : new Date();
  })();
  const [month, setMonth] = useState(() => startOfMonth(initialDay));
  const [selected, setSelected] = useState(() => initialDay);
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  const days = useMemo(
    () =>
      eachDayOfInterval({
        start: startOfWeek(month, { weekStartsOn: 1 }),
        end: endOfWeek(endOfMonth(month), { weekStartsOn: 1 }),
      }),
    [month],
  );

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    supabase
      .from('entries')
      .select('*, journals(*)')
      .gte('created_at', days[0].toISOString())
      .lt('created_at', addDays(days[days.length - 1], 1).toISOString())
      .order('created_at', { ascending: true })
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error) toast.error(error.message);
        setEntries(data ?? []);
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [days]);

  const byDay = useMemo(() => {
    const map = {};
    for (const e of entries) (map[dayKey(new Date(e.created_at))] ||= []).push(e);
    return map;
  }, [entries]);

  const monthCount = entries.filter((e) => isSameMonth(new Date(e.created_at), month)).length;
  const selectedEntries = (byDay[dayKey(selected)] ?? []).slice().reverse();
  const selectedIsFuture = isAfter(startOfDay(selected), startOfDay(new Date()));

  const goMonth = (delta) => {
    const next = addMonths(month, delta);
    setMonth(next);
    setSelected(isSameMonth(new Date(), next) ? new Date() : next);
  };

  const writeOnDay = async () => {
    setCreating(true);
    // Keep the current time of day so entries on the same date stay in writing order.
    const now = new Date();
    const when = new Date(selected);
    when.setHours(now.getHours(), now.getMinutes(), now.getSeconds());
    await startEntry({ createdAt: isToday(selected) ? null : when });
    setCreating(false);
  };

  return (
    <div className="page">
      <Helmet>
        <title>Calendar · Vrinzu</title>
      </Helmet>
      <div className="page-header">
        <div>
          <h1 className="page-title">Calendar</h1>
          <p className="page-subtitle">See your writing at a glance, day by day.</p>
        </div>
      </div>

      <section className="calendar">
        <div className="calendar-head">
          <button type="button" className="icon-btn" onClick={() => goMonth(-1)} aria-label="Previous month">
            <ChevronLeft size={20} />
          </button>
          <div className="calendar-title">
            <h2>{format(month, 'MMMM yyyy')}</h2>
            <span>
              {monthCount} {monthCount === 1 ? 'entry' : 'entries'}
            </span>
          </div>
          <button type="button" className="icon-btn" onClick={() => goMonth(1)} aria-label="Next month">
            <ChevronRight size={20} />
          </button>
        </div>
        {!isSameMonth(month, new Date()) && (
          <button
            type="button"
            className="link-btn calendar-today"
            onClick={() => {
              setMonth(startOfMonth(new Date()));
              setSelected(new Date());
            }}
          >
            Back to today
          </button>
        )}

        <div className="calendar-grid" role="grid" aria-busy={loading}>
          {WEEKDAYS.map((d) => (
            <span key={d} className="calendar-weekday" role="columnheader">
              {d}
            </span>
          ))}
          {days.map((day) => {
            const list = byDay[dayKey(day)] ?? [];
            const mood = list.find((e) => e.mood)?.mood;
            const classes = [
              'calendar-day',
              !isSameMonth(day, month) && 'is-outside',
              isToday(day) && 'is-today',
              isSameDay(day, selected) && 'is-selected',
              list.length && 'has-entries',
            ]
              .filter(Boolean)
              .join(' ');
            return (
              <button
                type="button"
                key={dayKey(day)}
                className={classes}
                onClick={() => setSelected(day)}
                aria-label={`${format(day, 'EEEE, MMMM d')}: ${list.length} ${list.length === 1 ? 'entry' : 'entries'}`}
                aria-pressed={isSameDay(day, selected)}
              >
                <span className="calendar-num">{format(day, 'd')}</span>
                {list.length > 0 && <span className="calendar-mark">{mood || '•'}</span>}
                {list.length > 1 && <span className="calendar-count">{list.length}</span>}
              </button>
            );
          })}
        </div>
      </section>

      <section className="home-section calendar-day-section">
        <div className="section-row">
          <h2 className="section-heading">{format(selected, 'EEEE, MMMM d')}</h2>
          {!selectedIsFuture && (
            <button type="button" className="btn btn-primary" onClick={writeOnDay} disabled={creating}>
              <PenLine size={16} /> {creating ? 'Opening…' : 'Write'}
            </button>
          )}
        </div>
        {loading ? (
          <ListSkeleton rows={2} />
        ) : selectedEntries.length === 0 ? (
          <div className="empty-state empty-state-soft">
            <span className="empty-icon">
              <Feather size={26} />
            </span>
            <h3>{selectedIsFuture ? 'Not written yet' : 'No entries this day'}</h3>
            <p>
              {selectedIsFuture ? 'This day is still ahead of you.' : 'Missed a day? You can still write about it.'}
            </p>
          </div>
        ) : (
          <EntryList entries={selectedEntries} grouped={false} showJournal />
        )}
      </section>
    </div>
  );
}
