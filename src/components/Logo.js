import { Link } from 'react-router-dom';

export const LOGO_SRC = `${process.env.PUBLIC_URL}/logo.png`;

export default function Logo({ to = '/', size = 'md', light = false }) {
  return (
    <Link to={to} className={`logo logo-${size}${light ? ' logo-light' : ''}`} aria-label="Vrinzu home">
      <img className="logo-mark" src={LOGO_SRC} alt="" />
      <span className="logo-text">Vrinzu</span>
    </Link>
  );
}
