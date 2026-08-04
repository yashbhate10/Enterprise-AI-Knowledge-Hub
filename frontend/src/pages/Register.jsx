import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AuthLayout from '../components/AuthLayout';
import FormField from '../components/FormField';
import { register, extractErrorMessage } from '../api/client';
import { useAuth } from '../context/AuthContext';

export default function Register() {
  const navigate = useNavigate();
  const { setSession } = useAuth();

  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const response = await register(form);
      setSession(response);
      navigate('/dashboard');
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout>
      <p style={styles.eyebrow}>Create account</p>
      <h2 style={styles.title}>Set up your workspace access.</h2>

      <form onSubmit={handleSubmit} noValidate>
        <div style={styles.row}>
          <FormField
            label="First name"
            name="firstName"
            autoComplete="given-name"
            value={form.firstName}
            onChange={handleChange}
            required
          />
          <FormField
            label="Last name"
            name="lastName"
            autoComplete="family-name"
            value={form.lastName}
            onChange={handleChange}
            required
          />
        </div>

        <FormField
          label="Email"
          name="email"
          type="email"
          autoComplete="email"
          value={form.email}
          onChange={handleChange}
          required
        />
        <FormField
          label="Password"
          name="password"
          type="password"
          autoComplete="new-password"
          value={form.password}
          onChange={handleChange}
          required
          minLength={8}
        />

        {error && <div style={styles.banner}>{error}</div>}

        <button type="submit" style={styles.submit} disabled={loading}>
          {loading ? 'Creating account…' : 'Create account'}
        </button>
      </form>

      <p style={styles.switch}>
        Already have access? <Link to="/login" style={styles.link}>Sign in</Link>
      </p>
    </AuthLayout>
  );
}

const styles = {
  eyebrow: {
    fontFamily: 'var(--font-mono)',
    fontSize: '0.75rem',
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    color: 'var(--brass)',
    margin: '0 0 0.4rem 0',
  },
  title: {
    fontFamily: 'var(--font-display)',
    fontWeight: 500,
    fontSize: '1.7rem',
    lineHeight: 1.25,
    margin: '0 0 2rem 0',
    color: 'var(--ink)',
  },
  row: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '1rem',
  },
  submit: {
    width: '100%',
    padding: '0.8rem',
    background: 'var(--ink)',
    color: 'var(--paper)',
    border: 'none',
    borderRadius: '6px',
    fontSize: '0.95rem',
    fontWeight: 500,
    cursor: 'pointer',
    marginTop: '0.4rem',
  },
  banner: {
    background: 'rgba(168, 67, 47, 0.1)',
    color: 'var(--rust)',
    padding: '0.7rem 0.9rem',
    borderRadius: '6px',
    fontSize: '0.85rem',
    marginBottom: '1rem',
  },
  switch: {
    marginTop: '1.6rem',
    fontSize: '0.88rem',
    color: 'var(--slate)',
  },
  link: {
    color: 'var(--ink)',
    fontWeight: 600,
    textDecoration: 'underline',
    textDecorationColor: 'var(--brass)',
  },
};
