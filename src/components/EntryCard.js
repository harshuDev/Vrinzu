import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { Trash2 } from 'lucide-react';
import { entryDisplayTitle } from '../lib/api';
import { moodLabel } from '../lib/constants';

export default function EntryCard({ entry, onDelete, showJournal = false, preview }) {
  const journal = entry.journals;
  return (
    <article className="entry-card">
      <Link to={`/app/entries/${entry.id}`} className="entry-card-link">
        <div className="entry-card-head">
          <span className="entry-mood" title={moodLabel(entry.mood) || 'No mood'}>
            {entry.mood || '📝'}
          </span>
          <div className="entry-card-heading">
            <h3 className="entry-title">{entryDisplayTitle(entry)}</h3>
            <time className="entry-date" dateTime={entry.created_at}>
              {format(new Date(entry.created_at), 'EEE, MMM d, yyyy · h:mm a')}
            </time>
          </div>
        </div>
        <p className="entry-preview">{preview ?? (entry.content?.trim() || 'No content yet…')}</p>
        {(entry.tags?.length > 0 || (showJournal && journal)) && (
          <div className="entry-meta">
            {showJournal && journal && (
              <span className="journal-pill" style={{ '--cover': journal.cover_color }}>
                {journal.cover_emoji} {journal.title}
              </span>
            )}
            {entry.tags?.map((tag) => (
              <span key={tag} className="tag">
                #{tag}
              </span>
            ))}
          </div>
        )}
      </Link>
      {onDelete && (
        <button type="button" className="icon-btn entry-delete" onClick={() => onDelete(entry)} aria-label="Delete entry">
          <Trash2 size={18} />
        </button>
      )}
    </article>
  );
}
