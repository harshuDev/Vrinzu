const escapeHtml = (s) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

/** Turns an older plain-text entry into paragraphs so it opens in the rich editor. */
export const plainToHtml = (text) =>
  (text || '')
    .split('\n')
    .map((line) => `<p>${escapeHtml(line)}</p>`)
    .join('');
