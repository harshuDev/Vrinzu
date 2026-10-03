import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { FileDown, FileText } from 'lucide-react';
import Modal from './Modal';
import { supabase } from '../lib/supabase';
import { exportAsPdf, exportAsText, exportTitle, fetchEntriesForExport } from '../lib/export';
import { useJournalLock } from '../context/JournalLockContext';

/** Export a single journal (when `journal` is given) or let the user pick one / all. */
export default function ExportModal({ journal, onClose }) {
  const [journals, setJournals] = useState([]);
  const [selected, setSelected] = useState(journal?.id ?? 'all');
  const [busy, setBusy] = useState(null);
  const { isLocked, requestUnlock } = useJournalLock();

  useEffect(() => {
    if (journal) return;
    supabase
      .from('journals')
      .select('*')
      .order('title')
      .then(({ data }) => setJournals(data ?? []));
  }, [journal]);

  const run = async (kind) => {
    setBusy(kind);
    try {
      const target = journal ?? journals.find((j) => j.id === selected) ?? null;
      // Locked journals need the passcode before their entries leave the app.
      for (const j of target ? [target] : journals) {
        if (isLocked(j) && !(await requestUnlock(j))) {
          setBusy(null);
          return;
        }
      }
      const entries = await fetchEntriesForExport(target?.id);
      if (!entries.length) {
        toast('There are no entries to export yet', { icon: '📭' });
        setBusy(null);
        return;
      }
      const title = exportTitle(target);
      if (kind === 'pdf') {
        await exportAsPdf(entries, title);
        toast.success('Choose “Save as PDF” in the print dialog');
      } else {
        exportAsText(entries, title);
        toast.success('Text file downloaded');
      }
      onClose();
    } catch (err) {
      toast.error(err.message);
      setBusy(null);
    }
  };

  return (
    <Modal title="Export journal" onClose={onClose} size="sm">
      <div className="export-body">
        {!journal && (
          <label className="field">
            <span className="field-label">What to export</span>
            <select className="input" value={selected} onChange={(e) => setSelected(e.target.value)}>
              <option value="all">All journals</option>
              {journals.map((j) => (
                <option key={j.id} value={j.id}>
                  {j.cover_emoji} {j.title}
                </option>
              ))}
            </select>
          </label>
        )}
        <button type="button" className="export-option" onClick={() => run('pdf')} disabled={Boolean(busy)}>
          <FileDown size={24} />
          <span>
            <strong>{busy === 'pdf' ? 'Preparing PDF…' : 'PDF document'}</strong>
            <small>Beautifully formatted, with photos. Pick “Save as PDF” in the print dialog.</small>
          </span>
        </button>
        <button type="button" className="export-option" onClick={() => run('text')} disabled={Boolean(busy)}>
          <FileText size={24} />
          <span>
            <strong>{busy === 'text' ? 'Preparing…' : 'Plain text (.txt)'}</strong>
            <small>Every entry with dates, moods and tags. Opens anywhere.</small>
          </span>
        </button>
      </div>
    </Modal>
  );
}
