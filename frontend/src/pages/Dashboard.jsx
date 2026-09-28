import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Dashboard() {
  const { user, clearSession } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    clearSession();
    navigate('/login');
  }

  return (
    <div style={styles.wrapper}>
      <header style={styles.header}>
        <span style={styles.mark}>KH</span>
        <button onClick={handleLogout} style={styles.logout}>
          Sign out
        </button>
      </header>

      <main style={styles.main}>
        <p style={styles.eyebrow}>Signed in as</p>
        <h1 style={styles.title}>
          {user?.firstName} {user?.lastName}
        </h1>
        <p style={styles.meta}>{user?.email}</p>
        <p style={styles.meta}>
          Role{user?.roles?.length > 1 ? 's' : ''}: {user?.roles?.join(', ')}
        </p>

        <div style={styles.card}>
          <p style={styles.cardText}>
            Workspace and document upload land here in Phase 2.
            You're now hitting a protected area of the app using a
            real JWT issued by the backend.
          </p>
        </div>
      </main>
    </div>
  );
}

const styles = {
  wrapper: {
    minHeight: '100vh',
    background: 'var(--paper)',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '1.2rem 2rem',
    borderBottom: '1px solid var(--line)',
  },
  mark: {
    fontFamily: 'var(--font-mono)',
    fontSize: '0.8rem',
    letterSpacing: '0.06em',
    background: 'var(--ink)',
    color: 'var(--paper)',
    padding: '0.3rem 0.5rem',
    borderRadius: '4px',
  },
  logout: {
    background: 'transparent',
    border: '1px solid var(--line)',
    borderRadius: '6px',
    padding: '0.5rem 0.9rem',
    fontSize: '0.85rem',
    cursor: 'pointer',
    color: 'var(--ink)',
  },
  main: {
    maxWidth: '38rem',
    margin: '0 auto',
    padding: '4rem 2rem',
  },
  eyebrow: {
    fontFamily: 'var(--font-mono)',
    fontSize: '0.75rem',
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    color: 'var(--brass)',
    margin: '0 0 0.5rem 0',
  },
  title: {
    fontFamily: 'var(--font-display)',
    fontWeight: 500,
    fontSize: '2.2rem',
    margin: '0 0 0.3rem 0',
  },
  meta: {
    color: 'var(--slate)',
    fontSize: '0.95rem',
    margin: '0.2rem 0',
  },
  card: {
    marginTop: '2.5rem',
    background: '#FFFFFF',
    border: '1px solid var(--line)',
    borderRadius: '10px',
    padding: '1.5rem',
  },
  cardText: {
    margin: 0,
    color: 'var(--slate)',
    lineHeight: 1.6,
  },
};
