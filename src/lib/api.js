import { supabase } from './supabase';

/** Creates an empty entry in a journal (optionally back-dated) and returns it. */
export async function createEntry(userId, journalId, createdAt, { mood = null, title = '' } = {}) {
  const row = { user_id: userId, journal_id: journalId, title, content: '', tags: [], mood };
  if (createdAt) row.created_at = createdAt.toISOString();
  const { data, error } = await supabase
    .from('entries')
    .insert(row)
    .select()
    .single();
  if (error) throw error;
  return data;
}

/** Returns the user's most recently updated journal, creating "My Journal" if they have none. */
export async function getOrCreateDefaultJournal(userId) {
  const { data, error } = await supabase
    .from('journals')
    .select('id')
    .order('updated_at', { ascending: false })
    .limit(1);
  if (error) throw error;
  if (data.length) return data[0];

  const { data: created, error: createError } = await supabase
    .from('journals')
    .insert({ user_id: userId, title: 'My Journal', description: 'Everyday thoughts', cover_emoji: '🌊', cover_color: '#0284c7' })
    .select('id')
    .single();
  if (createError) throw createError;
  return created;
}

/** First non-empty line of an entry, used when the entry has no title. */
export function entryDisplayTitle(entry) {
  if (entry.title?.trim()) return entry.title.trim();
  const firstLine = entry.content?.split('\n').find((l) => l.trim());
  return firstLine ? firstLine.trim().slice(0, 80) : 'Untitled entry';
}

export function isEntryEmpty(entry) {
  return (
    !entry.title?.trim() &&
    !entry.content?.trim() &&
    !entry.mood &&
    !(entry.tags && entry.tags.length) &&
    !(entry.photos && entry.photos.length)
  );
}

let schemaSupport;
/**
 * Detects which optional columns exist, so features light up only after their
 * migration has been run: { journalStyle, richText }. Cached per page load.
 */
export function getSchemaSupport() {
  if (!schemaSupport) {
    schemaSupport = Promise.all([
      supabase.from('journals').select('font, paper, is_locked').limit(1),
      supabase.from('entries').select('content_html').limit(1),
    ]).then(([journals, entries]) => ({ journalStyle: !journals.error, richText: !entries.error }));
  }
  return schemaSupport;
}
