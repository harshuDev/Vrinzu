export default function JournalCover({ color, emoji, pattern = 'plain', size = 'md' }) {
  return (
    <div className={`journal-cover journal-cover-${size} cover-${pattern || 'plain'}`} style={{ '--cover': color }}>
      <span className="journal-cover-spine" />
      <span className="journal-cover-emoji">{emoji}</span>
    </div>
  );
}
