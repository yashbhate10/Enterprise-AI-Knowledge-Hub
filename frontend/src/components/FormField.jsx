export default function FormField({ label, error, ...inputProps }) {
  return (
    <label style={styles.label}>
      <span style={styles.labelText}>{label}</span>
      <input
        style={{
          ...styles.input,
          ...(error ? styles.inputError : {}),
        }}
        {...inputProps}
      />
      {error && <span style={styles.errorText}>{error}</span>}
    </label>
  );
}

const styles = {
  label: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.4rem',
    marginBottom: '1.1rem',
  },
  labelText: {
    fontFamily: 'var(--font-mono)',
    fontSize: '0.7rem',
    letterSpacing: '0.06em',
    textTransform: 'uppercase',
    color: 'var(--slate)',
  },
  input: {
    fontFamily: 'var(--font-body)',
    fontSize: '0.95rem',
    padding: '0.7rem 0.8rem',
    borderRadius: '6px',
    border: '1px solid var(--line)',
    background: '#FFFFFF',
    color: 'var(--ink)',
  },
  inputError: {
    borderColor: 'var(--rust)',
  },
  errorText: {
    fontSize: '0.78rem',
    color: 'var(--rust)',
  },
};
