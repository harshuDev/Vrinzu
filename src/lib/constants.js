export const JOURNAL_EMOJIS = ['📔', '📓', '📒', '📗', '📘', '📙', '📝', '✍️', '🌊', '🌙', '🌸', '⭐', '🔥', '💙', '🌿', '🎯'];

// Journal cover colours are user data (stored in the database), so they live here as hex values.
export const JOURNAL_COLORS = [
  { name: 'Ocean', value: '#0284c7' },
  { name: 'Sky', value: '#0ea5e9' },
  { name: 'Deep Sea', value: '#0369a1' },
  { name: 'Abyss', value: '#075985' },
  { name: 'Lagoon', value: '#06b6d4' },
  { name: 'Reef', value: '#0891b2' },
  { name: 'Teal', value: '#14b8a6' },
  { name: 'Seaweed', value: '#10b981' },
  { name: 'Indigo', value: '#6366f1' },
  { name: 'Violet', value: '#8b5cf6' },
  { name: 'Coral', value: '#ec4899' },
  { name: 'Rose', value: '#f43f5e' },
  { name: 'Sand', value: '#f59e0b' },
  { name: 'Slate', value: '#64748b' },
];

export const MOODS = [
  { emoji: '😊', label: 'Happy' },
  { emoji: '😔', label: 'Sad' },
  { emoji: '😤', label: 'Frustrated' },
  { emoji: '😴', label: 'Tired' },
  { emoji: '🤔', label: 'Thoughtful' },
  { emoji: '🥰', label: 'Loved' },
  { emoji: '😰', label: 'Anxious' },
  { emoji: '🎉', label: 'Celebrating' },
  { emoji: '😌', label: 'Calm' },
  { emoji: '🤩', label: 'Excited' },
  { emoji: '😶', label: 'Speechless' },
  { emoji: '😅', label: 'Relieved' },
];

export const moodLabel = (emoji) => MOODS.find((m) => m.emoji === emoji)?.label ?? '';

export const AUTOSAVE_DELAY = 1500;
