export default function Spinner({ fullscreen = false, label = 'Loading' }) {
  const spinner = <span className="spinner" role="status" aria-label={label} />;
  if (!fullscreen) return <div className="spinner-wrap">{spinner}</div>;
  return <div className="spinner-fullscreen">{spinner}</div>;
}
