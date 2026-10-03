import { useCallback, useEffect, useState } from 'react';
import { Link, NavLink, useNavigate, useParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { ArrowLeft, Download, Feather, Lock, Pencil, Plus } from 'lucide-react';
import EntryCard from '../components/EntryCard';
import EntryEditor from './EntryEditor';
import JournalCover from '../components/JournalCover';
import JournalModal from '../components/JournalModal';
import ConfirmDialog from '../components/ConfirmDialog';
import ExportModal from '../components/ExportModal';
import LockedPanel from '../components/LockedPanel';
import Spinner from '../components/Spinner';
import { supabase } from '../lib/supabase';
import { entryDisplayTitle } from '../lib/api';
import { removePhotos } from '../lib/photos';
import useMediaQuery from '../lib/useMediaQuery';
import { useStartEntry } from '../context/StartEntryContext';
import { useJournalLock } from '../context/JournalLockContext';

const WIDE = '(min-width: 1024px)';

export default function JournalDetail() {
  const { journalId, entryId } = useParams();
  const startEntry = useStartEntry();
  const { isLocked, requestUnlock } = useJournalLock();
  const navigate = useNavigate();
  const isWide = useMediaQuery(WIDE);
  const [journal, setJournal] = useState(null);
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [editingJournal, setEditingJournal] = useState(false);
  const [deleting, setDeleting] = useState(null);
  const [exporting, setExporting] = useState(false);

  const journalPath = `/app/journals/${journalId}`;
  const entryPath = (id) => `${journalPath}/entries/${id}`;

  const load = useCallback(async () => {
    const [journalRes, entriesRes] = await Promise.all([
      supabase.from('journals').select('*').eq('id', journalId).maybeSingle(),
      supabase.from('entries').select('*').eq('journal_id', journalId).order('created_at', { ascending: false }),
    ]);
    if (journalRes.error || entriesRes.error) toast.error((journalRes.error || entriesRes.error).message);
    setJournal(journalRes.data);
    setEntries(entriesRes.data ?? []);
    setLoading(false);
  }, [journalId]);

  useEffect(() => {
    load();
  }, [load]);

  const handleNewEntry = async () => {
    setCreating(true);
    const entry = await startEntry({ journalId, to: (e) => entryPath(e.id) });
    if (entry) setEntries((list) => [entry, ...list]);
    setCreating(false);
  };

  // Keep the list in step with the open editor.
  const handleSaved = useCallback(
    (fields) => setEntries((list) => list.map((e) => (e.id === fields.id ? { ...e, ...fields } : e))),
    [],
  );
  const handleRemoved = useCallback((id) => setEntries((list) => list.filter((e) => e.id !== id)), []);

  const handleDelete = async () => {
    const { error } = await supabase.from('entries').delete().eq('id', deleting.id);
    if (error) {
      toast.error(error.message);
      throw error;
    }
    removePhotos(deleting.photos).catch(() => {});
    toast.success('Entry deleted');
    handleRemoved(deleting.id);
    if (deleting.id === entryId) navigate(journalPath, { replace: true });
  };

  if (loading) return <Spinner />;

  if (!journal) {
    return (
      <div className="page">
        <div className="empty-state">
          <h3>Journal not found</h3>
          <p>It may have been deleted.</p>
          <Link to="/app/journals" className="btn btn-primary">
            Back to journals
          </Link>
        </div>
      </div>
    );
  }

  if (isLocked(journal)) {
    return (
      <div className="page">
        <Helmet>
          <title>Locked journal · Vrinzu</title>
        </Helmet>
        <Link to="/app/journals" className="back-link">
          <ArrowLeft size={18} /> All journals
        </Link>
        <LockedPanel journal={journal} onUnlock={() => requestUnlock(journal)} />
      </div>
    );
  }

  const editor = entryId && (
    <EntryEditor
      key={entryId}
      entryId={entryId}
      embedded={isWide}
      backTo={journalPath}
      journalOverride={journal}
      onSaved={handleSaved}
      onDeleted={handleRemoved}
    />
  );

  const modals = (
    <>
      {editingJournal && (
        <JournalModal journal={journal} onClose={() => setEditingJournal(false)} onSaved={(j) => setJournal(j)} />
      )}
      {exporting && <ExportModal journal={journal} onClose={() => setExporting(false)} />}
      {deleting && (
        <ConfirmDialog
          title="Delete entry?"
          message={`“${entryDisplayTitle(deleting)}” will be permanently deleted.`}
          confirmLabel="Delete entry"
          onConfirm={handleDelete}
          onClose={() => setDeleting(null)}
        />
      )}
    </>
  );

  // Phones and tablets: an open entry takes the whole screen.
  if (!isWide && entryId) return editor;

  // Wide screens: the journal's entries on the left, the open page on the right.
  if (isWide) {
    return (
      <div className="journal-split">
        <Helmet>
          <title>{journal.title} · Vrinzu</title>
        </Helmet>
        <aside className="journal-pane">
          <div className="journal-pane-head" style={{ '--cover': journal.cover_color }}>
            <Link to="/app/journals" className="back-link">
              <ArrowLeft size={16} /> All journals
            </Link>
            <div className="journal-pane-title">
              <JournalCover color={journal.cover_color} emoji={journal.cover_emoji} size="xs" />
              <div>
                <h1>
                  {journal.title} {journal.is_locked && <Lock size={14} aria-label="Locked" />}
                </h1>
                <p>
                  {entries.length} {entries.length === 1 ? 'entry' : 'entries'}
                </p>
              </div>
            </div>
            <div className="journal-pane-actions">
              <button type="button" className="btn btn-primary" onClick={handleNewEntry} disabled={creating}>
                <Plus size={18} /> {creating ? 'Creating…' : 'New Entry'}
              </button>
              <button
                type="button"
                className="icon-btn"
                onClick={() => setEditingJournal(true)}
                aria-label="Edit journal"
                title="Edit journal"
              >
                <Pencil size={18} />
              </button>
              <button
                type="button"
                className="icon-btn"
                onClick={() => setExporting(true)}
                aria-label="Export journal"
                title="Export journal"
              >
                <Download size={18} />
              </button>
            </div>
          </div>
          <nav className="entry-index" aria-label="Entries">
            {entries.length === 0 && <p className="entry-index-empty">No entries yet. Start with a new one.</p>}
            {entries.map((e) => {
              const d = new Date(e.created_at);
              return (
                <NavLink key={e.id} to={entryPath(e.id)} className="entry-index-item">
                  <span className="entry-index-date">
                    <strong>{format(d, 'd')}</strong>
                    {format(d, 'MMM')}
                  </span>
                  <span className="entry-index-text">
                    <span className="entry-index-title">{entryDisplayTitle(e)}</span>
                    <span className="entry-index-preview">{e.content?.trim() || 'No content yet…'}</span>
                  </span>
                  {e.mood && <span className="entry-index-mood">{e.mood}</span>}
                </NavLink>
              );
            })}
          </nav>
        </aside>
        <section className="journal-page">
          {editor || (
            <div className="journal-page-empty">
              <span className="empty-icon">
                <Feather size={28} />
              </span>
              <h2>{entries.length ? 'Pick an entry to read' : 'Every story starts with a blank page'}</h2>
              <p>{entries.length ? 'Or start a fresh page for today.' : 'Write the first entry in this journal.'}</p>
              <button type="button" className="btn btn-primary" onClick={handleNewEntry} disabled={creating}>
                <Plus size={18} /> New Entry
              </button>
            </div>
          )}
        </section>
        {modals}
      </div>
    );
  }

  return (
    <div className="page">
      <Helmet>
        <title>{journal.title} · Vrinzu</title>
      </Helmet>

      <Link to="/app/journals" className="back-link">
        <ArrowLeft size={18} /> All journals
      </Link>

      <header className="journal-header" style={{ '--cover': journal.cover_color }}>
        <JournalCover color={journal.cover_color} emoji={journal.cover_emoji} size="sm" />
        <div className="journal-header-info">
          <h1 className="page-title">{journal.title}</h1>
          {journal.description && <p className="page-subtitle">{journal.description}</p>}
          <p className="journal-meta">
            {entries.length} {entries.length === 1 ? 'entry' : 'entries'}
          </p>
        </div>
        <div className="journal-header-actions">
          <button type="button" className="btn btn-ghost" onClick={() => setEditingJournal(true)}>
            <Pencil size={16} /> Edit
          </button>
          <button type="button" className="btn btn-ghost" onClick={() => setExporting(true)}>
            <Download size={16} /> Export
          </button>
          <button type="button" className="btn btn-primary" onClick={handleNewEntry} disabled={creating}>
            <Plus size={18} /> {creating ? 'Creating…' : 'New Entry'}
          </button>
        </div>
      </header>

      {entries.length === 0 ? (
        <div className="empty-state">
          <span className="empty-icon">
            <Feather size={28} />
          </span>
          <h3>This journal is empty</h3>
          <p>Every story starts with a blank page.</p>
          <button type="button" className="btn btn-primary" onClick={handleNewEntry} disabled={creating}>
            <Plus size={18} /> Write the first entry
          </button>
        </div>
      ) : (
        <div className="entry-list">
          {entries.map((entry) => (
            <EntryCard key={entry.id} entry={entry} to={entryPath(entry.id)} onDelete={setDeleting} />
          ))}
        </div>
      )}
      {modals}
    </div>
  );
}
