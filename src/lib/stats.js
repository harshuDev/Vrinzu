import { differenceInCalendarDays, format, startOfDay } from 'date-fns';

export const dayKey = (d) => format(new Date(d), 'yyyy-MM-dd');

export const wordCount = (text) => {
  const t = (text || '').trim();
  return t ? t.split(/\s+/).length : 0;
};

/**
 * Writing streaks from entry dates. The current streak counts back from today,
 * or from yesterday if nothing has been written yet today.
 */
export function computeStreaks(dates, today = new Date()) {
  const days = [...new Set(dates.map(dayKey))].sort();
  if (!days.length) return { current: 0, longest: 0, wroteToday: false };

  let longest = 1;
  let run = 1;
  for (let i = 1; i < days.length; i++) {
    run = differenceInCalendarDays(new Date(days[i]), new Date(days[i - 1])) === 1 ? run + 1 : 1;
    longest = Math.max(longest, run);
  }

  const set = new Set(days);
  const wroteToday = set.has(dayKey(today));
  let current = 0;
  const cursor = startOfDay(today);
  if (!wroteToday) cursor.setDate(cursor.getDate() - 1);
  while (set.has(dayKey(cursor))) {
    current += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return { current, longest, wroteToday };
}
