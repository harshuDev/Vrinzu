import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { BookOpen, Pencil, Plus, Trash2 } from 'lucide-react';
import JournalCover from '../components/JournalCover';
import JournalModal from '../components/JournalModal';
import ConfirmDialog from '../components/ConfirmDialog';
import Spinner from '../components/Spinner';
import { supabase } from '../lib/supabase';
import { removeJournalPhotos } from '../lib/photos';

export default function Journals() {
  const [journals, setJournals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null); // null = closed, {} = new, journal = edit
  const [deleting, setDeleting] = useState(null);

  const load = useCallback(async () => {
    const { data, error } = await supabase
      .from('journals')
      .select('*, entries(count)')
      .order('updated_at', { ascending: false });
    if (error) toast.error(error.message);
    setJournals(data ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleDelete = async () => {
    await removeJournalPhotos(deleting.id).catch(() => {});
    const { error } = await supabase.from('journals').delete().eq('id', deleting.id);
    if (error) {
      toast.error(error.message);
      throw error;
    }
    toast.success('Journal deleted');
    setJournals((list) => list.filter((j) => j.id !== deleting.id));
  };

  return (
    <div className="page">
      <Helmet>
        <title>Journals · Vrinzu</title>
      </Helmet>
      <div className="page-header">
        <div>
          <h1 className="page-title">Journals</h1>
          <p className="page-subtitle">Organise your writing into collections.</p>
        </div>
        <button type="button" className="btn btn-primary" onClick={() => setEditing({})}>
          <Plus size={18} /> New journal
        </button>
      </div>

      {loading ? (
        <Spinner />
      ) : journals.length === 0 ? (
        <div className="empty-state">
          <span className="empty-icon">
            <BookOpen size={28} />
          </span>
          <h3>No journals yet</h3>
          <p>Create your first journal — a home for your daily thoughts, dreams or travels.</p>
          <button type="button" className="btn btn-primary" onClick={() => setEditing({})}>
            <Plus size={18} /> Create a journal
          </button>
        </div>
      ) : (
        <div className="journal-grid">
          {journals.map((j) => {
            const count = j.entries?.[0]?.count ?? 0;
            return (
              <article key={j.id} className="journal-card">
                <Link to={`/app/journals/${j.id}`} className="journal-card-link">
                  <JournalCover color={j.cover_color} emoji={j.cover_emoji} />
                  <div className="journal-card-body">
                    <h3>{j.title}</h3>
                    {j.description && <p className="journal-desc">{j.description}</p>}
                    <p className="journal-meta">
                      {count} {count === 1 ? 'entry' : 'entries'} · Updated {format(new Date(j.updated_at), 'MMM d')}
                    </p>
                  </div>
                </Link>
                <div className="journal-card-actions">
                  <button type="button" className="icon-btn" onClick={() => setEditing(j)} aria-label={`Edit ${j.title}`}>
                    <Pencil size={18} />
                  </button>
                  <button
                    type="button"
                    className="icon-btn icon-btn-danger"
                    onClick={() => setDeleting(j)}
                    aria-label={`Delete ${j.title}`}
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {editing && (
        <JournalModal
          journal={editing.id ? editing : null}
          onClose={() => setEditing(null)}
          onSaved={() => load()}
        />
      )}
      {deleting && (
        <ConfirmDialog
          title="Delete journal?"
          message={`“${deleting.title}” and all of its entries will be permanently deleted. This cannot be undone.`}
          confirmLabel="Delete journal"
          onConfirm={handleDelete}
          onClose={() => setDeleting(null)}
        />
      )}
    </div>
  );
}
