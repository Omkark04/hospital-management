import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 20, textAlign: 'center', padding: 40 }}>
      <div style={{ fontSize: '6rem', lineHeight: 1 }}>🏥</div>
      <h1 style={{ fontSize: '5rem', fontWeight: 800, color: 'var(--primary)', lineHeight: 1 }}>404</h1>
      <h2>Page Not Found</h2>
      <p style={{ maxWidth: 360 }}>The page you're looking for doesn't exist or has been moved.</p>
      <div style={{ display: 'flex', gap: 12 }}>
        <Link to="/" className="btn btn-primary">Go Home</Link>
        <Link to="/dashboard" className="btn btn-ghost">Dashboard</Link>
      </div>
    </div>
  );
}
