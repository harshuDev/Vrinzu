import { LOGO_SRC } from './Logo';

export default function SetupNotice() {
  return (
    <div className="setup-notice">
      <div className="setup-card">
        <img className="logo-mark logo-mark-lg" src={LOGO_SRC} alt="Vrinzu" />
        <h1>Connect Vrinzu to Supabase</h1>
        <p>
          The environment variables <code>REACT_APP_SUPABASE_URL</code> and <code>REACT_APP_SUPABASE_ANON_KEY</code> are
          missing.
        </p>
        <ol>
          <li>
            Copy <code>.env.example</code> to <code>.env.local</code> and fill in your Supabase project URL and anon key.
          </li>
          <li>
            Run <code>supabase-schema.sql</code> in the Supabase SQL editor.
          </li>
          <li>
            Restart <code>npm start</code> (or redeploy on Vercel after adding the variables).
          </li>
        </ol>
      </div>
    </div>
  );
}
