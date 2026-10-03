import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { AlertCircle, ArrowLeft, Check, ImagePlus, Loader2, Smile, Tag, Trash2, X } from 'lucide-react';
import ConfirmDialog from '../components/ConfirmDialog';
import Spinner from '../components/Spinner';
import PhotoGallery from '../components/PhotoGallery';
import { supabase } from '../lib/supabase';
import { entryDisplayTitle, isEntryEmpty } from '../lib/api';
import { AUTOSAVE_DELAY, MOODS, moodLabel } from '../lib/constants';
import { removePhotos, uploadPhoto } from '../lib/photos';
import { useAuth } from '../context/AuthContext';

const snapshotOf = ({ title, content, mood, tags, photos }) => JSON.stringify({ title, content, mood, tags, photos });

export default function EntryEditor() {
  const { entryId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [entry, setEntry] = useState(null);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [mood, setMood] = useState(null);
  const [tags, setTags] = useState([]);
  const [photos, setPhotos] = useState([]);
  // False until the photos migration has been run on the database.
  const [photosSupported, setPhotosSupported] = useState(false);
  const [uploading, setUploading] = useState(0);
  const [tagInput, setTagInput] = useState('');
  const [status, setStatus] = useState('saved'); // saved | unsaved | saving | error
  const [showMoods, setShowMoods] = useState(false);
  const [showTags, setShowTags] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const latestRef = useRef({ title: '', content: '', mood: null, tags: [] });
  const savedSnapshotRef = useRef(null);
  const saveChainRef = useRef(Promise.resolve());
  const loadedRef = useRef(false);
  const deletedRef = useRef(false);
  const photosSupportedRef = useRef(false);
  const textareaRef = useRef(null);
  const moodRef = useRef(null);
  const tagInputRef = useRef(null);
  const fileInputRef = useRef(null);

  latestRef.current = { title, content, mood, tags, photos };
  photosSupportedRef.current = photosSupported;

  // ---- Load ---------------------------------------------------------------
  useEffect(() => {
    let cancelled = false;
    loadedRef.current = false;
    setLoading(true);
    supabase
      .from('entries')
      .select('*, journals(id, title, cover_emoji, cover_color)')
      .eq('id', entryId)
      .maybeSingle()
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error) toast.error(error.message);
        if (data) {
          const initial = {
            title: data.title ?? '',
            content: data.content ?? '',
            mood: data.mood ?? null,
            tags: data.tags ?? [],
            photos: data.photos ?? [],
          };
          setTitle(initial.title);
          setContent(initial.content);
          setMood(initial.mood);
          setTags(initial.tags);
          setPhotos(initial.photos);
          setPhotosSupported(Array.isArray(data.photos));
          savedSnapshotRef.current = snapshotOf(initial);
          latestRef.current = initial;
          loadedRef.current = true;
          setStatus('saved');
        }
        setEntry(data);
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [entryId]);

  // ---- Save ---------------------------------------------------------------
  const save = useCallback(() => {
    saveChainRef.current = saveChainRef.current.then(async () => {
      if (!loadedRef.current || deletedRef.current) return;
      const values = latestRef.current;
      const snapshot = snapshotOf(values);
      if (snapshot === savedSnapshotRef.current) return;

      setStatus('saving');
      const fields = { title: values.title, content: values.content, mood: values.mood, tags: values.tags };
      if (photosSupportedRef.current) fields.photos = values.photos;
      const { error } = await supabase.from('entries').update(fields).eq('id', entryId);

      if (error) {
        setStatus('error');
        toast.error(`Couldn’t save: ${error.message}`, { id: 'autosave-error' });
        return;
      }
      savedSnapshotRef.current = snapshot;
      setStatus(snapshotOf(latestRef.current) === snapshot ? 'saved' : 'unsaved');
    });
    return saveChainRef.current;
  }, [entryId]);

  // Autosave 1.5s after the last change.
  useEffect(() => {
    if (!loadedRef.current) return undefined;
    if (snapshotOf({ title, content, mood, tags, photos }) === savedSnapshotRef.current) return undefined;
    setStatus((s) => (s === 'saving' ? s : 'unsaved'));
    const timer = setTimeout(save, AUTOSAVE_DELAY);
    return () => clearTimeout(timer);
  }, [title, content, mood, tags, photos, save]);

  // On leaving the page: flush pending changes, or discard the entry if it was never written in.
  useEffect(() => {
    return () => {
      if (!loadedRef.current || deletedRef.current) return;
      if (isEntryEmpty(latestRef.current)) {
        deletedRef.current = true;
        supabase.from('entries').delete().eq('id', entryId).then(() => {});
      } else {
        save();
      }
    };
  }, [entryId, save]);

  // Warn before closing the tab with unsaved changes.
  useEffect(() => {
    const onBeforeUnload = (e) => {
      if (loadedRef.current && snapshotOf(latestRef.current) !== savedSnapshotRef.current) {
        save();
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, [save]);

  // Cmd/Ctrl + S saves immediately.
  useEffect(() => {
    const onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        save();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [save]);

  // Close the mood picker when clicking outside it.
  useEffect(() => {
    if (!showMoods) return undefined;
    const onDown = (e) => {
      if (moodRef.current && !moodRef.current.contains(e.target)) setShowMoods(false);
    };
    document.addEventListener('pointerdown', onDown);
    return () => document.removeEventListener('pointerdown', onDown);
  }, [showMoods]);

  // Grow the textarea with its content so the whole page scrolls naturally.
  useLayoutEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${el.scrollHeight}px`;
  }, [content, loading]);

  useEffect(() => {
    if (showTags) tagInputRef.current?.focus();
  }, [showTags]);

  // ---- Tags ---------------------------------------------------------------
  const addTag = () => {
    const tag = tagInput.trim().replace(/^#+/, '').replace(/\s+/g, '-').toLowerCase().slice(0, 30);
    setTagInput('');
    if (!tag) return;
    if (tags.includes(tag)) {
      toast(`#${tag} is already added`, { icon: '🏷️' });
      return;
    }
    setTags([...tags, tag]);
  };

  const handleTagKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addTag();
    } else if (e.key === 'Backspace' && !tagInput && tags.length) {
      setTags(tags.slice(0, -1));
    }
  };

  // ---- Photos -------------------------------------------------------------
  const handleFiles = async (e) => {
    const files = Array.from(e.target.files || []).filter((f) => f.type.startsWith('image/'));
    e.target.value = '';
    if (!files.length) return;
    setUploading(files.length);
    for (const file of files) {
      try {
        const path = await uploadPhoto(user.id, entryId, file);
        setPhotos((p) => [...p, path]);
      } catch (err) {
        toast.error(`Couldn’t upload ${file.name}: ${err.message}`);
      }
      setUploading((n) => n - 1);
    }
  };

  const handleRemovePhoto = (path) => {
    setPhotos((p) => p.filter((x) => x !== path));
    removePhotos([path]).catch(() => {});
  };

  // ---- Delete -------------------------------------------------------------
  const handleDelete = async () => {
    deletedRef.current = true;
    const { error } = await supabase.from('entries').delete().eq('id', entryId);
    if (error) {
      deletedRef.current = false;
      toast.error(error.message);
      throw error;
    }
    removePhotos(latestRef.current.photos).catch(() => {});
    toast.success('Entry deleted');
    navigate(entry?.journals ? `/app/journals/${entry.journals.id}` : '/app', { replace: true });
  };

  // ---- Render -------------------------------------------------------------
  if (loading) return <Spinner />;

  if (!entry) {
    return (
      <div className="page">
        <div className="empty-state">
          <h3>Entry not found</h3>
          <p>It may have been deleted.</p>
          <Link to="/app" className="btn btn-primary">
            Go home
          </Link>
        </div>
      </div>
    );
  }

  const backTo = entry.journals ? `/app/journals/${entry.journals.id}` : '/app';
  const wordCount = content.trim() ? content.trim().split(/\s+/).length : 0;

  return (
    <div className="editor">
      <Helmet>
        <title>{entryDisplayTitle({ title, content })} · Vrinzu</title>
      </Helmet>

      <div className="editor-toolbar">
        <button type="button" className="icon-btn" onClick={() => navigate(backTo)} aria-label="Back">
          <ArrowLeft size={20} />
        </button>

        <span className={`save-status save-status-${status}`} aria-live="polite">
          {uploading > 0 && (
            <>
              <Loader2 size={14} className="spin" /> Uploading {uploading} photo{uploading > 1 ? 's' : ''}…
            </>
          )}
          {!uploading && status === 'saving' && (
            <>
              <Loader2 size={14} className="spin" /> Saving…
            </>
          )}
          {!uploading && status === 'saved' && (
            <>
              <Check size={14} /> Saved
            </>
          )}
          {!uploading && status === 'unsaved' && <>Editing…</>}
          {status === 'error' && (
            <button type="button" className="link-btn" onClick={save}>
              <AlertCircle size={14} /> Retry save
            </button>
          )}
        </span>

        <div className="editor-toolbar-actions">
          <div className="mood-picker" ref={moodRef}>
            <button
              type="button"
              className={`toolbar-btn${mood ? ' has-value' : ''}`}
              onClick={() => setShowMoods((v) => !v)}
              aria-expanded={showMoods}
              aria-label="Mood"
              title={mood ? `Mood: ${moodLabel(mood)}` : 'Set mood'}
            >
              {mood ? <span className="toolbar-emoji">{mood}</span> : <Smile size={20} />}
              <span className="toolbar-btn-label">Mood</span>
            </button>
            {showMoods && (
              <div className="mood-popover" role="menu">
                <p className="mood-popover-title">How are you feeling?</p>
                <div className="mood-grid">
                  {MOODS.map((m) => (
                    <button
                      type="button"
                      key={m.emoji}
                      className={`mood-option${mood === m.emoji ? ' is-selected' : ''}`}
                      onClick={() => {
                        setMood(mood === m.emoji ? null : m.emoji);
                        setShowMoods(false);
                      }}
                      title={m.label}
                      aria-label={m.label}
                    >
                      {m.emoji}
                    </button>
                  ))}
                </div>
                {mood && (
                  <button
                    type="button"
                    className="link-btn mood-clear"
                    onClick={() => {
                      setMood(null);
                      setShowMoods(false);
                    }}
                  >
                    Clear mood
                  </button>
                )}
              </div>
            )}
          </div>

          {photosSupported && (
            <>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                hidden
                onChange={handleFiles}
              />
              <button
                type="button"
                className={`toolbar-btn${photos.length ? ' has-value' : ''}`}
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading > 0}
                aria-label="Add photos"
                title="Add photos"
              >
                <ImagePlus size={20} />
                <span className="toolbar-btn-label">Photos{photos.length ? ` (${photos.length})` : ''}</span>
              </button>
            </>
          )}

          <button
            type="button"
            className={`toolbar-btn${showTags || tags.length ? ' has-value' : ''}`}
            onClick={() => setShowTags((v) => !v)}
            aria-expanded={showTags}
            aria-label="Tags"
          >
            <Tag size={20} />
            <span className="toolbar-btn-label">Tags{tags.length ? ` (${tags.length})` : ''}</span>
          </button>

          <button
            type="button"
            className="icon-btn icon-btn-danger"
            onClick={() => setConfirmDelete(true)}
            aria-label="Delete entry"
            title="Delete entry"
          >
            <Trash2 size={20} />
          </button>
        </div>
      </div>

      {showTags && (
        <div className="tags-bar">
          {tags.map((tag) => (
            <span key={tag} className="tag tag-removable">
              #{tag}
              <button type="button" onClick={() => setTags(tags.filter((t) => t !== tag))} aria-label={`Remove ${tag}`}>
                <X size={14} />
              </button>
            </span>
          ))}
          <input
            ref={tagInputRef}
            className="tag-input"
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={handleTagKeyDown}
            onBlur={() => tagInput.trim() && addTag()}
            placeholder={tags.length ? 'Add another…' : 'Type a tag and press Enter'}
            enterKeyHint="done"
            maxLength={30}
          />
        </div>
      )}

      <div className="editor-paper">
        <div className="editor-meta">
          {entry.journals && (
            <Link to={backTo} className="journal-pill" style={{ '--cover': entry.journals.cover_color }}>
              {entry.journals.cover_emoji} {entry.journals.title}
            </Link>
          )}
          <time dateTime={entry.created_at}>{format(new Date(entry.created_at), 'EEEE, MMMM d, yyyy')}</time>
        </div>

        <input
          className="editor-title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Title"
          aria-label="Entry title"
          maxLength={200}
        />

        {!showTags && tags.length > 0 && (
          <div className="entry-meta editor-tags-inline">
            {tags.map((tag) => (
              <span key={tag} className="tag">
                #{tag}
              </span>
            ))}
          </div>
        )}

        <PhotoGallery paths={photos} onRemove={handleRemovePhoto} uploading={uploading} />

        <textarea
          ref={textareaRef}
          className="editor-content"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Dear diary…"
          aria-label="Entry content"
          autoFocus={!title && !content}
        />

        <p className="editor-footer">
          {wordCount} {wordCount === 1 ? 'word' : 'words'}
        </p>
      </div>

      {confirmDelete && (
        <ConfirmDialog
          title="Delete entry?"
          message="This entry will be permanently deleted. This cannot be undone."
          confirmLabel="Delete entry"
          onConfirm={handleDelete}
          onClose={() => setConfirmDelete(false)}
        />
      )}
    </div>
  );
}
