import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { Image as ImageIcon, Lock, Trash2 } from 'lucide-react';
import { entryDisplayTitle } from '../lib/api';
import { moodGroup, moodLabel } from '../lib/constants';
import { getPhotoUrlBatched } from '../lib/photos';
import { useJournalLock } from '../context/JournalLockContext';

function useCoverPhoto(path) {
  const [url, setUrl] = useState(null);
  useEffect(() => {
    if (!path) return undefined;
    let alive = true;
    getPhotoUrlBatched(path).then((u) => alive && setUrl(u));
    return () => {
      alive = false;
    };
  }, [path]);
  return url;
}

export default function EntryCard({ entry, onDelete, showJournal = false, preview, to }) {
  const journal = entry.journals;
  const href = to ?? `/app/entries/${entry.id}`;
  const { isLocked, requestUnlock } = useJournalLock();
  const navigate = useNavigate();
  const locked = isLocked(journal);
  const coverUrl = useCoverPhoto(locked ? null : entry.photos?.[0]);
  const group = moodGroup(entry.mood);

  // Entries in a locked journal show no title or text until it's unlocked.
  if (locked) {
    return (
      <article className="entry-card entry-card-locked">
        <button
          type="button"
          className="entry-card-link"
          onClick={async () => (await requestUnlock(journal)) && navigate(href)}
        >
          <div className="entry-card-head">
            <span className="entry-mood">
              <Lock size={20} />
            </span>
            <div className="entry-card-heading">
              <h3 className="entry-title">Locked entry</h3>
              <time className="entry-date" dateTime={entry.created_at}>
                {format(new Date(entry.created_at), 'EEE, MMM d, yyyy')}
              </time>
            </div>
          </div>
          <p className="entry-preview">
            In {journal.cover_emoji} {journal.title}. Tap to unlock.
          </p>
        </button>
      </article>
    );
  }

  return (
    <article
      className={`entry-card${group ? ` mood-tint mood-${group}` : ''}${entry.photos?.length ? ' has-photo' : ''}`}
    >
      <Link to={href} className="entry-card-link">
        {entry.photos?.length > 0 && (
          <div className="entry-card-photo">{coverUrl && <img src={coverUrl} alt="" loading="lazy" />}</div>
        )}
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
        {(entry.tags?.length > 0 || entry.photos?.length > 0 || (showJournal && journal)) && (
          <div className="entry-meta">
            {entry.photos?.length > 0 && (
              <span className="tag tag-photos">
                <ImageIcon size={13} /> {entry.photos.length}
              </span>
            )}
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
        <button
          type="button"
          className="icon-btn entry-delete"
          onClick={() => onDelete(entry)}
          aria-label="Delete entry"
        >
          <Trash2 size={18} />
        </button>
      )}
    </article>
  );
}
