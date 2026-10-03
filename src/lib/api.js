import { supabase } from './supabase';

/** Creates an empty entry in a journal and returns it. */
export async function createEntry(userId, journalId) {
  const { data, error } = await supabase
    .from('entries')
    .insert({ user_id: userId, journal_id: journalId, title: '', content: '', tags: [] })
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
  return !entry.title?.trim() && !entry.content?.trim() && !entry.mood && !(entry.tags && entry.tags.length);
}
