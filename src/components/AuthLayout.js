import Logo from './Logo';

export default function AuthLayout({ title, subtitle, children, footer }) {
  return (
    <div className="auth-page">
      <div className="hero-blobs" aria-hidden="true">
        <span className="blob blob-1" />
        <span className="blob blob-2" />
      </div>
      <div className="auth-card">
        <div className="auth-logo">
          <Logo />
        </div>
        <h1 className="auth-title">{title}</h1>
        <p className="auth-subtitle">{subtitle}</p>
        {children}
        <p className="auth-footer">{footer}</p>
      </div>
    </div>
  );
}
