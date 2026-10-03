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

// Each mood belongs to one of three feelings. Charts and card tints colour by
// feeling (3 validated colours) rather than by all 12 moods.
export const MOOD_GROUPS = [
  { key: 'bright', label: 'Bright' },
  { key: 'calm', label: 'Calm' },
  { key: 'heavy', label: 'Heavy' },
];

export const MOODS = [
  { emoji: '😊', label: 'Happy', group: 'bright' },
  { emoji: '😔', label: 'Sad', group: 'heavy' },
  { emoji: '😤', label: 'Frustrated', group: 'heavy' },
  { emoji: '😴', label: 'Tired', group: 'heavy' },
  { emoji: '🤔', label: 'Thoughtful', group: 'calm' },
  { emoji: '🥰', label: 'Loved', group: 'bright' },
  { emoji: '😰', label: 'Anxious', group: 'heavy' },
  { emoji: '🎉', label: 'Celebrating', group: 'bright' },
  { emoji: '😌', label: 'Calm', group: 'calm' },
  { emoji: '🤩', label: 'Excited', group: 'bright' },
  { emoji: '😶', label: 'Speechless', group: 'calm' },
  { emoji: '😅', label: 'Relieved', group: 'bright' },
];

export const moodGroup = (emoji) => MOODS.find((m) => m.emoji === emoji)?.group ?? null;

export const moodLabel = (emoji) => MOODS.find((m) => m.emoji === emoji)?.label ?? '';

export const AUTOSAVE_DELAY = 1500;

// Writing fonts a journal can use (CSS classes live in app.css as .font-<value>).
export const JOURNAL_FONTS = [
  { value: 'sans', label: 'Modern', sample: 'Aa' },
  { value: 'serif', label: 'Classic', sample: 'Aa' },
  { value: 'hand', label: 'Handwritten', sample: 'Aa' },
  { value: 'typewriter', label: 'Typewriter', sample: 'Aa' },
];

// Page styles for the writing area (CSS classes live in app.css as .paper-<value>).
export const JOURNAL_PAPERS = [
  { value: 'plain', label: 'Plain' },
  { value: 'lined', label: 'Lined' },
  { value: 'warm', label: 'Warm paper' },
  { value: 'dotted', label: 'Dotted' },
];

// One prompt per day (picked by day of the year), with a shuffle for another.
export const PROMPTS = [
  'What made you smile today?',
  'What is something you are looking forward to?',
  'Describe a small moment you want to remember.',
  'What is on your mind right now?',
  'Who made a difference to your day, and how?',
  'What did you learn this week?',
  'What would make tomorrow a good day?',
  'Write about a place where you feel at peace.',
  'What are three things you are grateful for?',
  'What is something you have been putting off, and why?',
  'Describe today in three words, then explain them.',
  'What is a recent win, however small?',
  'What is draining your energy lately?',
  'What would you tell yourself a year ago?',
  'What song, book or film has stayed with you recently?',
  'What does a perfect ordinary day look like for you?',
  'What are you proud of this month?',
  'Write a letter to someone you miss.',
  'What is a habit you want to build?',
  'What surprised you today?',
  'Where do you want to be a year from now?',
  'What is something kind someone did for you?',
  'What is worrying you, and what is one step you can take?',
  'Describe the view from where you are sitting.',
  'What made you laugh recently?',
  'What is a memory from childhood that still feels close?',
  'What do you need more of right now?',
  'What did you do today just for yourself?',
  'What is a question you keep coming back to?',
  'Who are you becoming?',
];
