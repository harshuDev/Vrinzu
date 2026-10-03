import { supabase } from './supabase';

export const PHOTO_BUCKET = 'entry-photos';
const MAX_DIMENSION = 1800;
const SIGNED_URL_TTL = 60 * 60; // 1 hour

const randomId = () =>
  typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;

/** Shrinks large photos to at most 1800px and re-encodes them as JPEG to keep uploads small. */
async function compressImage(file) {
  if (file.type === 'image/gif') return { blob: file, ext: 'gif', type: file.type };
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, MAX_DIMENSION / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    canvas.getContext('2d').drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close?.();
    const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.85));
    if (blob && blob.size < file.size) return { blob, ext: 'jpg', type: 'image/jpeg' };
  } catch {
    // Fall through and upload the original file.
  }
  const ext = (file.name.split('.').pop() || 'jpg').toLowerCase();
  return { blob: file, ext, type: file.type || 'image/jpeg' };
}

/** Uploads one photo to `<userId>/<entryId>/<random>.<ext>` and returns its storage path. */
export async function uploadPhoto(userId, entryId, file) {
  const { blob, ext, type } = await compressImage(file);
  const path = `${userId}/${entryId}/${randomId()}.${ext}`;
  const { error } = await supabase.storage.from(PHOTO_BUCKET).upload(path, blob, { contentType: type, upsert: false });
  if (error) throw error;
  return path;
}

/** Returns { [path]: signedUrl } for private photos. */
export async function getPhotoUrls(paths) {
  if (!paths?.length) return {};
  const { data, error } = await supabase.storage.from(PHOTO_BUCKET).createSignedUrls(paths, SIGNED_URL_TTL);
  if (error) throw error;
  return Object.fromEntries(data.filter((d) => d.signedUrl).map((d) => [d.path, d.signedUrl]));
}

export async function removePhotos(paths) {
  if (!paths?.length) return;
  const { error } = await supabase.storage.from(PHOTO_BUCKET).remove(paths);
  if (error) throw error;
}

/** Removes the stored photos of every entry in a journal (call before deleting the journal). */
export async function removeJournalPhotos(journalId) {
  const { data, error } = await supabase.from('entries').select('*').eq('journal_id', journalId);
  if (error) throw error;
  await removePhotos(data.flatMap((e) => e.photos ?? []));
}

// Cards ask for one thumbnail each; requests made in the same moment are sent
// to Supabase as a single batch, and results are cached for the session.
const urlCache = new Map(); // path -> Promise<string|null>
let pending = [];
let flushTimer = null;

function flushPending() {
  const batch = pending;
  pending = [];
  flushTimer = null;
  getPhotoUrls(batch.map((p) => p.path))
    .then((urls) => batch.forEach((p) => p.resolve(urls[p.path] ?? null)))
    .catch(() => batch.forEach((p) => p.resolve(null)));
}

export function getPhotoUrlBatched(path) {
  if (!urlCache.has(path)) {
    urlCache.set(
      path,
      new Promise((resolve) => {
        pending.push({ path, resolve });
        if (!flushTimer) flushTimer = setTimeout(flushPending, 30);
      })
    );
  }
  return urlCache.get(path);
}
