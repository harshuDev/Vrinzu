import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import toast from 'react-hot-toast';
import { startOfWeek } from 'date-fns';
import { ArrowRight, Feather, Lock, PenLine } from 'lucide-react';
import EntryCard from '../components/EntryCard';
import JournalCover from '../components/JournalCover';
import Spinner from '../components/Spinner';
import { supabase } from '../lib/supabase';
import { createEntry, getOrCreateDefaultJournal } from '../lib/api';
import { useAuth } from '../context/AuthContext';

function greeting() {
  const hour = new Date().getHours();
  if (hour < 5) return 'Good night';
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

export default function Home() {
  const { user, displayName } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [recent, setRecent] = useState([]);
  const [journals, setJournals] = useState([]);
  const [stats, setStats] = useState({ entries: 0, week: 0 });
  const [starting, setStarting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 }).toISOString();
      const [recentRes, journalsRes, totalRes, weekRes] = await Promise.all([
        supabase
          .from('entries')
          .select('*, journals(*)')
          .order('created_at', { ascending: false })
          .limit(6),
        supabase.from('journals').select('*').order('updated_at', { ascending: false }).limit(4),
        supabase.from('entries').select('id', { count: 'exact', head: true }),
        supabase.from('entries').select('id', { count: 'exact', head: true }).gte('created_at', weekStart),
      ]);
      if (cancelled) return;
      const error = recentRes.error || journalsRes.error || totalRes.error || weekRes.error;
      if (error) toast.error(error.message);
      setRecent(recentRes.data ?? []);
      setJournals(journalsRes.data ?? []);
      setStats({ entries: totalRes.count ?? 0, week: weekRes.count ?? 0 });
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const startWriting = async () => {
    setStarting(true);
    try {
      const journal = await getOrCreateDefaultJournal(user.id);
      const entry = await createEntry(user.id, journal.id);
      navigate(`/app/entries/${entry.id}`);
    } catch (err) {
      toast.error(err.message);
      setStarting(false);
    }
  };

  const firstName = displayName.split(' ')[0];

  return (
    <div className="page">
      <Helmet>
        <title>Home · Vrinzu</title>
      </Helmet>

      <section className="home-hero">
        <div>
          <p className="home-date">{new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}</p>
          <h1 className="page-title">
            {greeting()}, {firstName} <span aria-hidden="true">🌊</span>
          </h1>
          <p className="page-subtitle">What’s on your mind today?</p>
        </div>
        <button type="button" className="btn btn-light btn-lg" onClick={startWriting} disabled={starting}>
          <PenLine size={18} /> {starting ? 'Opening…' : 'Write today’s entry'}
        </button>
      </section>

      {loading ? (
        <Spinner />
      ) : (
        <>
          <section className="stats-grid">
            <div className="stat-card">
              <span className="stat-value">{stats.entries}</span>
              <span className="stat-label">Total entries</span>
            </div>
            <div className="stat-card">
              <span className="stat-value">{stats.week}</span>
              <span className="stat-label">This week</span>
            </div>
            <div className="stat-card">
              <span className="stat-value">{journals.length}</span>
              <span className="stat-label">{journals.length === 1 ? 'Journal' : 'Journals'}</span>
            </div>
          </section>

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
                <button type="button" className="btn btn-primary" onClick={startWriting} disabled={starting}>
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
