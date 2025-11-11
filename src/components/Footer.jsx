// src/components/Footer.jsx
export default function Footer({ text, version }) {
  return (
    <footer
      style={{
        borderTop: '1px solid var(--border)',
        background: 'var(--panel)',
        color: 'var(--muted)',
        padding: '12px 16px',
        fontSize: 14,
        textAlign:"center"
      }}
      aria-label="Application footer"
    >
      {text} ({version})
    </footer>
  );
}
