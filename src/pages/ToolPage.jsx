import { useEffect } from 'react';
import { useParams, Navigate, Link, useLocation } from 'react-router-dom';
import { TOOL_PAGES, SLUGS } from './toolConfig';
import Workspace from '../components/Workspace';
import Footer from '../components/Footer';

const NAV = [
  ['image-compressor', 'Compress'],
  ['image-converter', 'Convert'],
  ['image-resizer', 'Resize'],
  ['image-cropper', 'Crop'],
];

// Cross-links at the foot of the copy — includes the bulk page so it stays
// internally linked and crawlable even though it's not in the top nav.
const CROSSLINKS = [
  ...NAV,
  ['bulk-image-compressor', 'Compress in bulk'],
];

export default function ToolPage() {
  const { slug } = useParams();
  const { pathname } = useLocation();
  const page = TOOL_PAGES[slug];

  useEffect(() => {
    if (!page) return;
    document.title = page.title;
    setMeta('description', page.meta);
    setCanonical(`https://app.keekootech.in${pathname}`);
  }, [page, pathname]);

  if (!page) return <Navigate to="/tools/image-compressor" replace />;

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Top bar */}
      <header style={{ borderBottom: '1px solid var(--line)', position: 'sticky', top: 0, background: 'var(--paper)', zIndex: 10 }}>
        <div style={{ maxWidth: '1040px', margin: '0 auto', padding: '14px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px' }}>
          <Link to="/tools/image-compressor" style={{ textDecoration: 'none', fontWeight: 600, fontSize: '16px', letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: '9px' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '30px', height: '30px', borderRadius: '8px', background: 'var(--brand)', color: '#fff', fontSize: '15px', fontWeight: 600, letterSpacing: '-0.03em' }}>KK</span>
            Simple <span style={{ color: 'var(--muted)', fontWeight: 400 }}>Image Tools</span>
          </Link>
          <nav style={{
            display: 'flex', gap: '4px', overflowX: 'auto',
            background: 'var(--chip)', padding: '4px', borderRadius: '999px',
          }}>
            {NAV.map(([s, label]) => (
              <Link key={s} to={`/tools/${s}`} style={{
                textDecoration: 'none', fontSize: '13px', fontWeight: 600,
                padding: '8px 16px', borderRadius: '999px', whiteSpace: 'nowrap',
                transition: 'background 0.15s, color 0.15s',
                color: s === slug ? '#fff' : 'var(--muted)',
                background: s === slug ? 'var(--brand)' : 'transparent',
              }}>{label}</Link>
            ))}
          </nav>
        </div>
      </header>

      {/* Hero + workspace */}
      <main style={{ flex: 1, maxWidth: '1040px', width: '100%', margin: '0 auto', padding: '40px 20px 0' }}>
        <div style={{ marginBottom: '32px' }}>
          <h1 style={{ fontSize: 'clamp(28px, 5vw, 40px)', marginBottom: '10px' }}>{page.h1}</h1>
          <p style={{ margin: 0, fontSize: '17px', color: 'var(--muted)', maxWidth: '620px' }}>{page.tagline}</p>
        </div>

        <Workspace tool={page.tool} key={slug} />

        {/* SEO copy */}
        <section style={{ maxWidth: '680px', margin: '56px 0 0' }}>
          {page.body.map((para, i) => (
            <p key={i} style={{ fontSize: '16px', lineHeight: 1.7, color: 'var(--muted)', marginBottom: '16px' }}>
              {para}
            </p>
          ))}
          <div style={{ marginTop: '24px', fontSize: '14px' }}>
            <span style={{ color: 'var(--muted)' }}>Also try: </span>
            {CROSSLINKS.filter(([s]) => s !== slug).map(([s, label], i, arr) => (
              <span key={s}>
                <Link to={`/tools/${s}`} style={{ color: 'var(--ink)' }}>{label}</Link>
                {i < arr.length - 1 ? ' · ' : ''}
              </span>
            ))}
          </div>
        </section>
      </main>

      <Wave />
      <Footer />
    </div>
  );
}

/** The red wave — echoes the blob, ties the page together. */
function Wave() {
  return (
    <svg viewBox="0 0 800 60" preserveAspectRatio="none" aria-hidden="true"
      style={{ display: 'block', width: '100%', height: '64px', marginTop: '56px' }}>
      <path d="M0,30 C150,5 250,50 400,28 C550,6 650,48 800,24 L800,60 L0,60 Z"
        fill="var(--brand)" opacity="0.12" />
      <path d="M0,42 C150,20 260,58 400,40 C560,20 660,56 800,38 L800,60 L0,60 Z"
        fill="var(--brand)" opacity="0.9" />
    </svg>
  );
}

function setMeta(name, content) {
  let el = document.querySelector(`meta[name="${name}"]`);
  if (!el) { el = document.createElement('meta'); el.setAttribute('name', name); document.head.appendChild(el); }
  el.setAttribute('content', content);
}
function setCanonical(href) {
  let el = document.querySelector('link[rel="canonical"]');
  if (!el) { el = document.createElement('link'); el.setAttribute('rel', 'canonical'); document.head.appendChild(el); }
  el.setAttribute('href', href);
}

export { SLUGS };
