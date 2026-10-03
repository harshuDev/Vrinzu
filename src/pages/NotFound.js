import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import Logo from '../components/Logo';

export default function NotFound() {
  return (
    <div className="not-found">
      <Helmet>
        <title>Page not found · Vrinzu</title>
      </Helmet>
      <Logo />
      <h1>Lost at sea</h1>
      <p>The page you are looking for drifted away.</p>
      <Link to="/" className="btn btn-primary">
        Back to shore
      </Link>
    </div>
  );
}
