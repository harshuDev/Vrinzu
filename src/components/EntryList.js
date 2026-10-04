import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { Image as ImageIcon, Lock, Trash2 } from 'lucide-react';
import { entryDisplayTitle } from '../lib/api';
import { moodGroup, moodLabel } from '../lib/constants';
import { getPhotoUrlBatched } from '../lib/photos';
import { useJournalLock } from '../context/JournalLockContext';

const SWIPE_DELETE_AT = 96; // px of left swipe that deletes on release

function useThumb(path) {
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

/** Left-swipe on touch screens; reports the drag distance and fires onSwiped past the threshold. */
function useSwipe(enabled, onSwiped) {
  const [dx, setDx] = useState(0);
  const start = useRef(null);
  const swiped = useRef(false);
  if (!enabled) return { dx: 0, handlers: {}, swiped };
  const handlers = {
    onPointerDown: (e) => {
      if (e.pointerType !== 'touch') return;
      start.current = { x: e.clientX, y: e.clientY, locked: null };
      swiped.current = false;
    },
    onPointerMove: (e) => {
      const s = start.current;
      if (!s) return;
      const mx = e.clientX - s.x;
      const my = e.clientY - s.y;
      if (s.locked === null && (Math.abs(mx) > 8 || Math.abs(my) > 8)) s.locked = Math.abs(mx) > Math.abs(my);
      if (s.locked) {
        swiped.current = true;
        setDx(Math.min(0, mx));
      }
    },
    onPointerUp: () => {
      if (start.current?.locked && dx <= -SWIPE_DELETE_AT) onSwiped();
      start.current = null;
      setDx(0);
    },
    onPointerCancel: () => {
      start.current = null;
      setDx(0);
    },
  };
  return { dx, handlers, swiped };
}

export function EntryRow({ entry, to, showJournal = false, preview, onDelete }) {
  const journal = entry.journals;
  const href = to ?? `/app/entries/${entry.id}`;
  const { isLocked, requestUnlock } = useJournalLock();
  const navigate = useNavigate();
  const locked = isLocked(journal);
  const thumb = useThumb(locked ? null : entry.photos?.[0]);
  const { dx, handlers, swiped } = useSwipe(Boolean(onDelete), () => onDelete(entry));
  const d = new Date(entry.created_at);
  const group = moodGroup(entry.mood);

  const dateBlock = (
    <span className="entry-row-date">
      <strong>{format(d, 'd')}</strong>
      {format(d, 'EEE')}
    </span>
  );

  if (locked) {
    return (
      <article className="entry-row entry-row-locked">
        <button
          type="button"
          className="entry-row-link"
          onClick={async () => (await requestUnlock(journal)) && navigate(href)}
        >
          {dateBlock}
          <span className="entry-row-body">
            <span className="entry-row-title">
              <Lock size={14} /> Locked entry
            </span>
            <span className="entry-row-preview">
              In {journal.cover_emoji} {journal.title}. Tap to unlock.
            </span>
          </span>
        </button>
      </article>
    );
  }

  const meta = [format(d, 'h:mm a')];
  return (
    <article
      className={`entry-row${group ? ` mood-${group}` : ''}${dx < 0 ? ' is-swiping' : ''}${
        dx <= -SWIPE_DELETE_AT ? ' will-delete' : ''
      }`}
    >
      {onDelete && (
        <span className="entry-row-swipe-bg" aria-hidden="true">
          <Trash2 size={20} /> Delete
        </span>
      )}
      <Link
        to={href}
        className="entry-row-link"
        style={dx ? { transform: `translateX(${dx}px)` } : undefined}
        onClickCapture={(e) => {
          if (swiped.current) {
            e.preventDefault();
            swiped.current = false;
          }
        }}
        draggable={false}
        {...handlers}
      >
        {dateBlock}
        <span className="entry-row-body">
          <span className="entry-row-title">{entryDisplayTitle(entry)}</span>
          <span className="entry-row-preview">{preview ?? (entry.content?.trim() || 'No content yet…')}</span>
          <span className="entry-row-meta">
            {meta.join(' · ')}
            {showJournal && journal && (
              <span className="entry-row-journal" style={{ '--cover': journal.cover_color }}>
                {journal.cover_emoji} {journal.title}
              </span>
            )}
            {entry.photos?.length > 0 && !thumb && (
              <span className="entry-row-chip">
                <ImageIcon size={12} /> {entry.photos.length}
              </span>
            )}
            {entry.tags?.slice(0, 3).map((tag) => (
              <span key={tag} className="entry-row-tag">
                #{tag}
              </span>
            ))}
          </span>
        </span>
        {thumb ? (
          <span className="entry-row-thumb">
            <img src={thumb} alt="" loading="lazy" />
            {entry.mood && <span className="entry-row-thumb-mood">{entry.mood}</span>}
          </span>
        ) : (
          entry.mood && (
            <span className="entry-row-mood" title={moodLabel(entry.mood)}>
              {entry.mood}
            </span>
          )
        )}
      </Link>
      {onDelete && (
        <button
          type="button"
          className="icon-btn entry-row-delete"
          onClick={() => onDelete(entry)}
          aria-label="Delete entry"
          title="Delete entry"
        >
          <Trash2 size={17} />
        </button>
      )}
    </article>
  );
}

/** Entries grouped under month headings ("October 2026"), newest first. */
export default function EntryList({ entries, grouped = true, ...rowProps }) {
  if (!grouped) {
    return (
      <div className="entry-rows">
        {entries.map((e) => (
          <EntryRow key={e.id} entry={e} {...rowProps} to={rowProps.to?.(e)} preview={rowProps.preview?.(e)} />
        ))}
      </div>
    );
  }
  const groups = [];
  for (const e of entries) {
    const label = format(new Date(e.created_at), 'MMMM yyyy');
    if (groups.at(-1)?.label !== label) groups.push({ label, items: [] });
    groups.at(-1).items.push(e);
  }
  return (
    <div className="entry-groups">
      {groups.map((g) => (
        <section key={g.label} className="entry-group">
          <h3 className="entry-group-label">
            {g.label}
            <span>{g.items.length}</span>
          </h3>
          <div className="entry-rows">
            {g.items.map((e) => (
              <EntryRow key={e.id} entry={e} {...rowProps} to={rowProps.to?.(e)} preview={rowProps.preview?.(e)} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
