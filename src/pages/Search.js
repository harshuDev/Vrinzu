import { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import toast from 'react-hot-toast';
import { Search as SearchIcon, X } from 'lucide-react';
import EntryCard from '../components/EntryCard';
import Spinner from '../components/Spinner';
import { supabase } from '../lib/supabase';

// Characters that have meaning inside a PostgREST `or=(...)` filter or an ILIKE pattern.
const sanitize = (q) => q.replace(/[,()%_*\\"]/g, ' ').trim();

function Highlight({ text, query }) {
  if (!query) return text;
  const lower = text.toLowerCase();
  const q = query.toLowerCase();
  const parts = [];
  let start = 0;
  let idx = lower.indexOf(q);
  while (idx !== -1) {
    if (idx > start) parts.push(text.slice(start, idx));
    parts.push(<mark key={idx}>{text.slice(idx, idx + q.length)}</mark>);
    start = idx + q.length;
    idx = lower.indexOf(q, start);
  }
  parts.push(text.slice(start));
  return parts;
}

function snippet(content, query) {
  const text = (content || '').replace(/\s+/g, ' ').trim();
  if (!text) return 'No content yet…';
  const idx = text.toLowerCase().indexOf(query.toLowerCase());
  if (idx < 0) return text.slice(0, 180);
  const start = Math.max(0, idx - 60);
  const end = Math.min(text.length, idx + query.length + 120);
  return `${start > 0 ? '…' : ''}${text.slice(start, end)}${end < text.length ? '…' : ''}`;
}

export default function Search() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState('');

  useEffect(() => {
    const q = sanitize(query);
    if (q.length < 2) {
      setResults([]);
      setSearched('');
      setLoading(false);
      return undefined;
    }
    setLoading(true);
    let cancelled = false;
    const timer = setTimeout(async () => {
      const { data, error } = await supabase
        .from('entries')
        .select('*, journals(title, cover_emoji, cover_color)')
        .or(`title.ilike.%${q}%,content.ilike.%${q}%`)
        .order('created_at', { ascending: false })
        .limit(50);
      if (cancelled) return;
      if (error) toast.error(error.message);
      setResults(data ?? []);
      setSearched(q);
      setLoading(false);
    }, 300);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [query]);

  return (
    <div className="page">
      <Helmet>
        <title>Search · Vrinzu</title>
      </Helmet>
      <div className="page-header">
        <div>
          <h1 className="page-title">Search</h1>
          <p className="page-subtitle">Find any memory across all of your journals.</p>
        </div>
      </div>

      <div className="search-box">
        <SearchIcon size={20} className="search-icon" />
        <input
          className="input search-input"
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search titles and content…"
          aria-label="Search entries"
          enterKeyHint="search"
          autoFocus
        />
        {query && (
          <button type="button" className="icon-btn search-clear" onClick={() => setQuery('')} aria-label="Clear search">
            <X size={18} />
          </button>
        )}
      </div>

      {loading ? (
        <Spinner />
      ) : searched ? (
        <>
          <p className="search-count">
            {results.length} {results.length === 1 ? 'result' : 'results'} for “{searched}”
          </p>
          {results.length === 0 ? (
            <div className="empty-state">
              <span className="empty-icon">
                <SearchIcon size={28} />
              </span>
              <h3>No matches</h3>
              <p>Try a different word or a shorter phrase.</p>
            </div>
          ) : (
            <div className="entry-list">
              {results.map((entry) => (
                <EntryCard
                  key={entry.id}
                  entry={entry}
                  showJournal
                  preview={<Highlight text={snippet(entry.content, searched)} query={searched} />}
                />
              ))}
            </div>
          )}
        </>
      ) : (
        <div className="empty-state empty-state-soft">
          <span className="empty-icon">
            <SearchIcon size={28} />
          </span>
          <h3>Search your journal</h3>
          <p>Type at least two characters to search every entry’s title and content.</p>
        </div>
      )}
    </div>
  );
}
