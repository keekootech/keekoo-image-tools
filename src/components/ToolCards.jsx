import { Link } from 'react-router-dom';

/* Every tool, with the one-liner that goes on its card. */
export const ALL_TOOLS = [
  { slug: 'image-compressor',      group: 'Image', name: 'Compress Image',   blurb: 'Shrink JPG, PNG and WebP without visible quality loss.' },
  { slug: 'bulk-image-compressor', group: 'Image', name: 'Bulk Compress',    blurb: 'Dozens of images at once, downloaded as one zip.' },
  { slug: 'image-converter',       group: 'Image', name: 'Convert Image',    blurb: 'PNG, JPG, WebP and AVIF — any format to any format.' },
  { slug: 'image-resizer',         group: 'Image', name: 'Resize Image',     blurb: 'By exact pixels or by percentage, kept sharp.' },
  { slug: 'image-cropper',         group: 'Image', name: 'Crop Image',       blurb: 'Square, portrait, story and social-card sizes.' },
  { slug: 'merge-pdf',             group: 'PDF',   name: 'Merge PDF',        blurb: 'Combine several PDFs into one, in any order.' },
  { slug: 'split-pdf',             group: 'PDF',   name: 'Split PDF',        blurb: 'Pull out just the pages you need.' },
  { slug: 'compress-pdf',          group: 'PDF',   name: 'Compress PDF',     blurb: 'Shrink a heavy PDF so it fits in an email.' },
  { slug: 'pdf-to-jpg',            group: 'PDF',   name: 'PDF to JPG',       blurb: 'Turn every page into an image.' },
  { slug: 'jpg-to-pdf',            group: 'PDF',   name: 'JPG to PDF',       blurb: 'Turn a pile of photos into one tidy PDF.' },
];

export default function ToolCards({ currentSlug }) {
  const tools = ALL_TOOLS.filter((t) => t.slug !== currentSlug);

  return (
    <section style={{ marginTop: '56px' }}>
      <h2 style={{ fontSize: '20px', marginBottom: '6px' }}>More free tools</h2>
      <p style={{ fontSize: '14px', color: 'var(--muted)', margin: '0 0 20px' }}>
        All of them run in your browser. Nothing is ever uploaded.
      </p>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
        gap: '10px',
      }}>
        {tools.map((t) => (
          <ToolCard key={t.slug} tool={t} />
        ))}
      </div>
    </section>
  );
}

function ToolCard({ tool }) {
  return (
    <Link
      to={`/tools/${tool.slug}`}
      style={{
        display: 'block',
        textDecoration: 'none',
        background: 'var(--card)',
        border: '1px solid var(--line)',
        borderRadius: '14px',
        padding: '16px',
        transition: 'border-color 0.15s, transform 0.15s',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = 'var(--brand)';
        e.currentTarget.style.transform = 'translateY(-2px)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = 'var(--line)';
        e.currentTarget.style.transform = 'translateY(0)';
      }}
    >
      <span style={{
        display: 'inline-block',
        fontSize: '10px',
        fontWeight: 700,
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
        color: 'var(--brand)',
        marginBottom: '8px',
      }}>
        {tool.group}
      </span>

      <div style={{
        fontSize: '15px',
        fontWeight: 600,
        color: 'var(--ink)',
        marginBottom: '4px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '8px',
      }}>
        {tool.name}
        <span aria-hidden="true" style={{ color: 'var(--brand)', fontSize: '14px' }}>→</span>
      </div>

      <div style={{ fontSize: '13px', color: 'var(--muted)', lineHeight: 1.45 }}>
        {tool.blurb}
      </div>
    </Link>
  );
}
