export default function AuthLayout({ children }) {
  return (
    <div style={styles.wrapper}>
      <div style={styles.brandPanel}>
        <div style={styles.brandTop}>
          <span style={styles.mark}>KH</span>
          <span style={styles.markLabel}>Knowledge&nbsp;Hub</span>
        </div>

        <div style={styles.brandMid}>
          <h1 style={styles.headline}>
            Every policy, contract,
            <br />
            and doc — one
            <br />
            question away.
          </h1>
          <p style={styles.sub}>
            Upload what your team already wrote.
            Ask it what it means.
          </p>
        </div>

        <Ledger />

        <div style={styles.brandFoot}>
          <span>Enterprise AI Knowledge Hub</span>
          <span style={styles.dot}>·</span>
          <span>Internal workspace</span>
        </div>
      </div>

      <div style={styles.formPanel}>
        <div style={styles.formInner}>{children}</div>
      </div>
    </div>
  );
}

function Ledger() {
  // Signature element: a stack of index-card lines, evoking a physical
  // document archive being indexed — the visual thesis of the product.
  const rows = [92, 64, 78, 45, 70];
  return (
    <div style={styles.ledger} aria-hidden="true">
      {rows.map((w, i) => (
        <div key={i} style={styles.ledgerRow}>
          <span style={styles.ledgerTick}>{String(i + 1).padStart(2, '0')}</span>
          <span style={{ ...styles.ledgerBar, width: `${w}%` }} />
        </div>
      ))}
    </div>
  );
}

const styles = {
  wrapper: {
    display: 'grid',
    gridTemplateColumns: 'minmax(0, 1.1fr) minmax(0, 1fr)',
    minHeight: '100vh',
    background: 'var(--paper)',
  },
  brandPanel: {
    background: 'linear-gradient(165deg, var(--ink) 0%, var(--ink-soft) 100%)',
    color: 'var(--paper)',
    padding: '3rem 3.5rem',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
  },
  brandTop: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.6rem',
  },
  mark: {
    fontFamily: 'var(--font-mono)',
    fontSize: '0.8rem',
    letterSpacing: '0.06em',
    background: 'var(--brass)',
    color: 'var(--ink)',
    padding: '0.3rem 0.5rem',
    borderRadius: '4px',
  },
  markLabel: {
    fontFamily: 'var(--font-mono)',
    fontSize: '0.8rem',
    letterSpacing: '0.06em',
    color: 'rgba(246,242,233,0.7)',
  },
  brandMid: {
    maxWidth: '30rem',
  },
  headline: {
    fontFamily: 'var(--font-display)',
    fontWeight: 500,
    fontSize: 'clamp(1.9rem, 3vw, 2.6rem)',
    lineHeight: 1.15,
    margin: '0 0 1rem 0',
  },
  sub: {
    fontFamily: 'var(--font-body)',
    fontSize: '1rem',
    lineHeight: 1.6,
    color: 'rgba(246,242,233,0.72)',
    margin: 0,
  },
  ledger: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.55rem',
    maxWidth: '22rem',
  },
  ledgerRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.7rem',
  },
  ledgerTick: {
    fontFamily: 'var(--font-mono)',
    fontSize: '0.7rem',
    color: 'rgba(246,242,233,0.4)',
    width: '1.2rem',
  },
  ledgerBar: {
    height: '6px',
    borderRadius: '3px',
    background:
      'linear-gradient(90deg, var(--brass) 0%, rgba(176,141,87,0.35) 100%)',
  },
  brandFoot: {
    fontFamily: 'var(--font-mono)',
    fontSize: '0.72rem',
    color: 'rgba(246,242,233,0.45)',
    display: 'flex',
    gap: '0.5rem',
  },
  dot: {
    color: 'rgba(246,242,233,0.3)',
  },
  formPanel: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '2rem',
  },
  formInner: {
    width: '100%',
    maxWidth: '23rem',
  },
};
