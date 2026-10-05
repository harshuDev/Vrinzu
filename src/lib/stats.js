import { format } from 'date-fns';

export const dayKey = (d) => format(new Date(d), 'yyyy-MM-dd');

export const wordCount = (text) => {
  const t = (text || '').trim();
  return t ? t.split(/\s+/).length : 0;
};
