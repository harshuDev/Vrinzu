import { Link } from 'react-router-dom';
import { Waves } from 'lucide-react';

export default function Logo({ to = '/', size = 'md', light = false }) {
  return (
    <Link to={to} className={`logo logo-${size}${light ? ' logo-light' : ''}`} aria-label="Vrinzu home">
      <span className="logo-mark">
        <Waves strokeWidth={2.5} />
      </span>
      <span className="logo-text">Vrinzu</span>
    </Link>
  );
}
