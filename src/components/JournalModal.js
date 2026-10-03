import { useState } from 'react';
import toast from 'react-hot-toast';
import { Check } from 'lucide-react';
import Modal from './Modal';
import JournalCover from './JournalCover';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { JOURNAL_COLORS, JOURNAL_EMOJIS } from '../lib/constants';

export default function JournalModal({ journal, onClose, onSaved }) {
  const { user } = useAuth();
  const isEdit = Boolean(journal);
  const [title, setTitle] = useState(journal?.title ?? '');
  const [description, setDescription] = useState(journal?.description ?? '');
  const [emoji, setEmoji] = useState(journal?.cover_emoji ?? JOURNAL_EMOJIS[0]);
  const [color, setColor] = useState(journal?.cover_color ?? JOURNAL_COLORS[0].value);
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const trimmed = title.trim();
    if (!trimmed) {
      toast.error('Give your journal a title');
      return;
    }
    setSaving(true);
    const fields = { title: trimmed, description: description.trim(), cover_emoji: emoji, cover_color: color };
    const query = isEdit
      ? supabase.from('journals').update(fields).eq('id', journal.id)
      : supabase.from('journals').insert({ ...fields, user_id: user.id });
    const { data, error } = await query.select().single();
    setSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(isEdit ? 'Journal updated' : 'Journal created');
    onSaved(data);
    onClose();
  };

  return (
    <Modal
      title={isEdit ? 'Edit journal' : 'New journal'}
      onClose={onClose}
      footer={
        <>
          <button type="button" className="btn btn-ghost" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" form="journal-form" className="btn btn-primary" disabled={saving}>
            {saving ? 'Saving…' : isEdit ? 'Save changes' : 'Create journal'}
          </button>
        </>
      }
    >
      <form id="journal-form" className="journal-form" onSubmit={handleSubmit}>
        <div className="journal-form-preview">
          <JournalCover color={color} emoji={emoji} size="sm" />
        </div>

        <label className="field">
          <span className="field-label">Title</span>
          <input
            className="input"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Morning Pages"
            maxLength={120}
            autoFocus
          />
        </label>

        <label className="field">
          <span className="field-label">Description</span>
          <input
            className="input"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="What is this journal about?"
            maxLength={200}
          />
        </label>

        <fieldset className="field">
          <legend className="field-label">Cover emoji</legend>
          <div className="emoji-grid">
            {JOURNAL_EMOJIS.map((em) => (
              <button
                type="button"
                key={em}
                className={`emoji-option${em === emoji ? ' is-selected' : ''}`}
                onClick={() => setEmoji(em)}
                aria-label={`Emoji ${em}`}
                aria-pressed={em === emoji}
              >
                {em}
              </button>
            ))}
          </div>
        </fieldset>

        <fieldset className="field">
          <legend className="field-label">Cover colour</legend>
          <div className="color-grid">
            {JOURNAL_COLORS.map((c) => (
              <button
                type="button"
                key={c.value}
                className={`color-option${c.value === color ? ' is-selected' : ''}`}
                style={{ '--swatch': c.value }}
                onClick={() => setColor(c.value)}
                aria-label={c.name}
                aria-pressed={c.value === color}
                title={c.name}
              >
                {c.value === color && <Check size={16} strokeWidth={3} />}
              </button>
            ))}
          </div>
        </fieldset>
      </form>
    </Modal>
  );
}
