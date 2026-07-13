import { Link } from 'react-router-dom';

const TOOLS = [
  ['image-compressor', 'Compress'],
  ['image-converter', 'Convert'],
  ['image-resizer', 'Resize'],
  ['image-cropper', 'Crop'],
  ['bulk-image-compressor', 'Compress in bulk'],
];

export default function Footer() {
  return (
    <footer style={{ marginTop: 0 }}>
      <div style={{ maxWidth: '1040px', margin: '0 auto', padding: '32px 20px' }}>
        {/* Cross-links */}
        <nav style={{ display: 'flex', flexWrap: 'wrap', gap: '8px 20px', marginBottom: '24px', fontSize: '13px' }}>
          <span style={{ color: 'var(--muted)' }}>More tools:</span>
          {TOOLS.map(([slug, label]) => (
            <Link key={slug} to={`/tools/${slug}`} style={{ color: 'var(--ink)', textDecoration: 'none' }}>
              {label}
            </Link>
          ))}
        </nav>

        {/* Lead-gen line — the point of the whole suite */}
        <div style={{
          display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center',
          justifyContent: 'space-between', paddingTop: '20px', borderTop: '1px solid var(--line)',
        }}>
          <p style={{ margin: 0, fontSize: '14px' }}>
            Built by <strong>Kee Koo Tech</strong> — we build fast Shopify &amp; WordPress stores.
          </p>
          <div style={{ display: 'flex', gap: '10px' }}>
            <a href="https://keekootech.in" style={cta('ghost')}>See our work →</a>
            <a href="https://keekootech.in/contact" style={cta('solid')}>Get a quote →</a>
          </div>
        </div>
      </div>
    </footer>
  );
}

function cta(kind) {
  const base = {
    fontSize: '14px', fontWeight: 600, textDecoration: 'none',
    padding: '10px 16px', borderRadius: '10px', whiteSpace: 'nowrap',
  };
  return kind === 'solid'
    ? { ...base, background: 'var(--brand)', color: '#fff' }
    : { ...base, border: '1px solid var(--line)', color: 'var(--ink)' };
}
