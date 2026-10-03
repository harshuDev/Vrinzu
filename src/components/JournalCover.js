export default function JournalCover({ color, emoji, size = 'md' }) {
  return (
    <div className={`journal-cover journal-cover-${size}`} style={{ '--cover': color }}>
      <span className="journal-cover-spine" />
      <span className="journal-cover-emoji">{emoji}</span>
    </div>
  );
}
