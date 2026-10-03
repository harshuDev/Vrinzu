import { format } from 'date-fns';
import { supabase } from './supabase';
import { entryDisplayTitle } from './api';
import { moodLabel } from './constants';
import { getPhotoUrls } from './photos';

export async function fetchEntriesForExport(journalId) {
  let query = supabase
    .from('entries')
    .select('*, journals(title, cover_emoji)')
    .order('created_at', { ascending: true });
  if (journalId) query = query.eq('journal_id', journalId);
  const { data, error } = await query;
  if (error) throw error;
  return data;
}

const fileStamp = () => format(new Date(), 'yyyy-MM-dd');
const slug = (s) => (s || 'journal').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'journal';

function download(filename, blob) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

export function exportAsText(entries, title) {
  const lines = [`${title}`, `Exported from Vrinzu on ${format(new Date(), 'MMMM d, yyyy')}`, `${entries.length} entries`, ''];
  for (const e of entries) {
    lines.push('='.repeat(60));
    lines.push(format(new Date(e.created_at), "EEEE, MMMM d, yyyy 'at' h:mm a"));
    if (e.journals) lines.push(`Journal: ${e.journals.title}`);
    if (e.mood) lines.push(`Mood: ${e.mood} ${moodLabel(e.mood)}`);
    if (e.tags?.length) lines.push(`Tags: ${e.tags.map((t) => `#${t}`).join(' ')}`);
    if (e.photos?.length) lines.push(`Photos: ${e.photos.length}`);
    lines.push('', entryDisplayTitle(e), '', e.content?.trim() || '(no text)', '');
  }
  download(`vrinzu-${slug(title)}-${fileStamp()}.txt`, new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' }));
}

const escapeHtml = (s) =>
  String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

function buildPrintDocument(entries, title, photoUrls) {
  const items = entries
    .map((e) => {
      const meta = [
        format(new Date(e.created_at), "EEEE, MMMM d, yyyy 'at' h:mm a"),
        e.journals ? `${e.journals.cover_emoji} ${e.journals.title}` : '',
        e.mood ? `${e.mood} ${moodLabel(e.mood)}` : '',
      ]
        .filter(Boolean)
        .map(escapeHtml)
        .join(' · ');
      const photos = (e.photos ?? [])
        .map((p) => photoUrls[p])
        .filter(Boolean)
        .map((url) => `<img src="${escapeHtml(url)}" alt="">`)
        .join('');
      const tags = e.tags?.length ? `<p class="tags">${e.tags.map((t) => `#${escapeHtml(t)}`).join(' ')}</p>` : '';
      return `<article>
        <p class="meta">${meta}</p>
        <h2>${escapeHtml(entryDisplayTitle(e))}</h2>
        ${tags}
        ${photos ? `<div class="photos">${photos}</div>` : ''}
        <div class="content">${escapeHtml(e.content?.trim() || '')}</div>
      </article>`;
    })
    .join('');

  return `<!doctype html><html><head><meta charset="utf-8"><title>${escapeHtml(title)}</title>
<link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;600&family=Playfair+Display:wght@600;700&display=swap" rel="stylesheet">
<style>
  @page { margin: 18mm 16mm; }
  body { font-family: 'DM Sans', sans-serif; color: #0f172a; line-height: 1.65; margin: 0; }
  header { border-bottom: 2px solid #0284c7; padding-bottom: 12px; margin-bottom: 24px; }
  header h1 { font-family: 'Playfair Display', Georgia, serif; font-size: 28pt; margin: 0; color: #075985; }
  header p { margin: 4px 0 0; color: #475569; font-size: 10pt; }
  article { break-inside: avoid-page; padding: 0 0 22px; margin: 0 0 22px; border-bottom: 1px solid #e2e8f0; }
  .meta { color: #475569; font-size: 9.5pt; margin: 0 0 4px; }
  h2 { font-family: 'Playfair Display', Georgia, serif; font-size: 17pt; margin: 0 0 6px; }
  .tags { color: #0369a1; font-size: 9.5pt; margin: 0 0 8px; }
  .content { white-space: pre-wrap; font-size: 11pt; }
  .photos { display: flex; flex-wrap: wrap; gap: 8px; margin: 8px 0 12px; }
  .photos img { max-width: 48%; max-height: 260px; object-fit: cover; border-radius: 6px; }
</style></head><body>
<header><h1>${escapeHtml(title)}</h1><p>${entries.length} entries · exported from Vrinzu on ${escapeHtml(
    format(new Date(), 'MMMM d, yyyy')
  )}</p></header>
${items || '<p>No entries yet.</p>'}
</body></html>`;
}

/**
 * Opens the system print dialog with a nicely formatted copy of the journal.
 * Choosing "Save as PDF" there produces the PDF file (supports every language and emoji).
 */
export async function exportAsPdf(entries, title) {
  const photoUrls = await getPhotoUrls(entries.flatMap((e) => e.photos ?? [])).catch(() => ({}));
  const iframe = document.createElement('iframe');
  iframe.setAttribute('aria-hidden', 'true');
  iframe.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:0;visibility:hidden;';
  document.body.appendChild(iframe);

  await new Promise((resolve) => {
    iframe.onload = resolve;
    iframe.srcdoc = buildPrintDocument(entries, title, photoUrls);
  });

  const doc = iframe.contentDocument;
  // Wait (max 10s) for fonts and photos so they appear in the PDF.
  await Promise.race([
    Promise.all([
      doc.fonts?.ready,
      ...Array.from(doc.images).map((img) =>
        img.complete
          ? null
          : new Promise((r) => {
              img.addEventListener('load', r, { once: true });
              img.addEventListener('error', r, { once: true });
            })
      ),
    ]),
    new Promise((r) => setTimeout(r, 10000)),
  ]);

  iframe.contentWindow.focus();
  iframe.contentWindow.print();
  setTimeout(() => iframe.remove(), 60000);
}

export const exportTitle = (journal) => (journal ? journal.title : 'My Vrinzu Journal');
