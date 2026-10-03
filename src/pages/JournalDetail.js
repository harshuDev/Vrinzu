import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import toast from 'react-hot-toast';
import { ArrowLeft, Download, Feather, Pencil, Plus } from 'lucide-react';
import EntryCard from '../components/EntryCard';
import JournalCover from '../components/JournalCover';
import JournalModal from '../components/JournalModal';
import ConfirmDialog from '../components/ConfirmDialog';
import ExportModal from '../components/ExportModal';
import Spinner from '../components/Spinner';
import { supabase } from '../lib/supabase';
import { createEntry, entryDisplayTitle } from '../lib/api';
import { removePhotos } from '../lib/photos';
import { useAuth } from '../context/AuthContext';

export default function JournalDetail() {
  const { journalId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [journal, setJournal] = useState(null);
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [editingJournal, setEditingJournal] = useState(false);
  const [deleting, setDeleting] = useState(null);
  const [exporting, setExporting] = useState(false);

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
    try {
      const entry = await createEntry(user.id, journalId);
      navigate(`/app/entries/${entry.id}`);
    } catch (err) {
      toast.error(err.message);
      setCreating(false);
    }
  };

  const handleDelete = async () => {
    const { error } = await supabase.from('entries').delete().eq('id', deleting.id);
    if (error) {
      toast.error(error.message);
      throw error;
    }
    removePhotos(deleting.photos).catch(() => {});
    toast.success('Entry deleted');
    setEntries((list) => list.filter((e) => e.id !== deleting.id));
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
            <EntryCard key={entry.id} entry={entry} onDelete={setDeleting} />
          ))}
        </div>
      )}

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
    </div>
  );
}
