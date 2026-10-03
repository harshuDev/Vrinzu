import { useCallback, useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, ImageOff, Trash2, X } from 'lucide-react';
import { getPhotoUrls } from '../lib/photos';

export default function PhotoGallery({ paths, onRemove, uploading = 0 }) {
  const [urls, setUrls] = useState({});
  const [open, setOpen] = useState(null); // index of the photo shown full-screen

  useEffect(() => {
    const missing = paths.filter((p) => !urls[p]);
    if (!missing.length) return;
    let cancelled = false;
    getPhotoUrls(missing)
      .then((fresh) => !cancelled && setUrls((u) => ({ ...u, ...fresh })))
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [paths, urls]);

  const close = useCallback(() => setOpen(null), []);
  const step = useCallback((dir) => setOpen((i) => (i + dir + paths.length) % paths.length), [paths.length]);

  useEffect(() => {
    if (open === null) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') close();
      if (e.key === 'ArrowRight') step(1);
      if (e.key === 'ArrowLeft') step(-1);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, close, step]);

  if (!paths.length && !uploading) return null;

  return (
    <>
      <div className="photo-grid">
        {paths.map((path, i) => (
          <button type="button" key={path} className="photo-thumb" onClick={() => setOpen(i)} aria-label={`Open photo ${i + 1}`}>
            {urls[path] ? <img src={urls[path]} alt="" loading="lazy" /> : <ImageOff size={20} />}
          </button>
        ))}
        {Array.from({ length: uploading }, (_, i) => (
          <div key={`up-${i}`} className="photo-thumb photo-uploading" aria-label="Uploading photo">
            <span className="spinner" />
          </div>
        ))}
      </div>

      {open !== null && paths[open] && (
        <div className="lightbox" role="dialog" aria-modal="true" aria-label="Photo" onClick={close}>
          <div className="lightbox-bar" onClick={(e) => e.stopPropagation()}>
            <span>
              {open + 1} / {paths.length}
            </span>
            <div className="lightbox-actions">
              {onRemove && (
                <button
                  type="button"
                  className="icon-btn lightbox-btn"
                  onClick={() => {
                    const path = paths[open];
                    setOpen(paths.length > 1 ? Math.min(open, paths.length - 2) : null);
                    onRemove(path);
                  }}
                  aria-label="Delete photo"
                >
                  <Trash2 size={20} />
                </button>
              )}
              <button type="button" className="icon-btn lightbox-btn" onClick={close} aria-label="Close">
                <X size={22} />
              </button>
            </div>
          </div>
          {paths.length > 1 && (
            <button
              type="button"
              className="icon-btn lightbox-btn lightbox-prev"
              onClick={(e) => {
                e.stopPropagation();
                step(-1);
              }}
              aria-label="Previous photo"
            >
              <ChevronLeft size={28} />
            </button>
          )}
          {urls[paths[open]] && <img className="lightbox-img" src={urls[paths[open]]} alt="" onClick={(e) => e.stopPropagation()} />}
          {paths.length > 1 && (
            <button
              type="button"
              className="icon-btn lightbox-btn lightbox-next"
              onClick={(e) => {
                e.stopPropagation();
                step(1);
              }}
              aria-label="Next photo"
            >
              <ChevronRight size={28} />
            </button>
          )}
        </div>
      )}
    </>
  );
}
