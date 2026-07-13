import { useState, useCallback, useRef, useEffect } from 'react';
import DropZone from './DropZone';
import { mergePdfs, extractPages, imagesToPdf, parseRanges, formatBytes } from '../lib/pdfOps';
import { renderThumbnails, pdfToImages, compressPdf } from '../lib/pdfRender';

const PRESETS = {
  low:    { label: 'Smaller file',  quality: 0.45, dpiScale: 1.2 },
  medium: { label: 'Balanced',      quality: 0.65, dpiScale: 1.5 },
  high:   { label: 'Better quality', quality: 0.82, dpiScale: 2.0 },
};

export default function PdfWorkspace({ tool }) {
  const [files, setFiles] = useState([]);   // {id, name, size, buffer, pages, thumbs}
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(null); // {done, total, label}
  const [result, setResult] = useState(null);     // {url, size, name, note}
  const [error, setError] = useState(null);

  // tool settings
  const [range, setRange] = useState('');
  const [preset, setPreset] = useState('medium');
  const [pageSize, setPageSize] = useState('fit');
  const [selected, setSelected] = useState([]); // page indices for split

  const isImageInput = tool === 'jpg-to-pdf';
  const multi = tool === 'merge-pdf' || isImageInput;
  const cancelled = useRef(false);

  useEffect(() => () => { cancelled.current = true; }, []);

  const reset = () => {
    files.forEach((f) => f.thumbs?.forEach((t) => URL.revokeObjectURL(t.url)));
    if (result?.url) URL.revokeObjectURL(result.url);
    setFiles([]); setResult(null); setError(null); setSelected([]); setRange('');
  };

  const addFiles = useCallback(async (incoming) => {
    setError(null);
    setResult(null);

    const accepted = incoming.filter((f) => isImageInput
      ? /^image\/(jpeg|png)$/.test(f.type)
      : f.type === 'application/pdf' || /\.pdf$/i.test(f.name));

    if (!accepted.length) {
      setError(isImageInput
        ? 'Please choose JPG or PNG images.'
        : 'Please choose PDF files.');
      return;
    }

    const staged = [];
    for (const file of accepted) {
      const buffer = await file.arrayBuffer();
      staged.push({
        id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
        name: file.name,
        size: file.size,
        type: file.type,
        buffer,
        pages: null,
        thumbs: null,
      });
    }

    setFiles((prev) => (multi ? [...prev, ...staged] : staged.slice(0, 1)));

    // For single-PDF tools, render thumbnails so the user can see the pages.
    if (!isImageInput && !multi && staged[0]) {
      setBusy(true);
      try {
        const { total, thumbs } = await renderThumbnails(staged[0].buffer);
        if (cancelled.current) return;
        setFiles((prev) => prev.map((f) =>
          f.id === staged[0].id ? { ...f, pages: total, thumbs } : f));
      } catch {
        setError('Could not read this PDF. It may be corrupted or password-protected.');
      } finally {
        setBusy(false);
      }
    }
  }, [isImageInput, multi]);

  const removeFile = (id) => setFiles((prev) => {
    const f = prev.find((x) => x.id === id);
    f?.thumbs?.forEach((t) => URL.revokeObjectURL(t.url));
    return prev.filter((x) => x.id !== id);
  });

  const move = (idx, dir) => setFiles((prev) => {
    const next = [...prev];
    const j = idx + dir;
    if (j < 0 || j >= next.length) return prev;
    [next[idx], next[j]] = [next[j], next[idx]];
    return next;
  });

  const togglePage = (i) => setSelected((prev) =>
    prev.includes(i) ? prev.filter((x) => x !== i) : [...prev, i].sort((a, b) => a - b));

  // ---- Run the tool ----
  const run = async () => {
    setBusy(true);
    setError(null);
    setResult(null);
    setProgress(null);

    try {
      const totalOriginal = files.reduce((s, f) => s + f.size, 0);
      let bytes, name, note = null;

      if (tool === 'merge-pdf') {
        if (files.length < 2) throw new Error('Add at least two PDFs to merge.');
        bytes = await mergePdfs(files.map((f) => f.buffer));
        name = 'merged.pdf';

      } else if (tool === 'split-pdf') {
        const f = files[0];
        const total = f.pages || 0;
        let indices = selected.length ? selected : parseRanges(range, total);
        if (!indices.length) throw new Error('Choose the pages you want to keep.');
        bytes = await extractPages(f.buffer, indices);
        name = f.name.replace(/\.pdf$/i, '') + '-pages.pdf';

      } else if (tool === 'compress-pdf') {
        const f = files[0];
        const p = PRESETS[preset];
        bytes = await compressPdf(f.buffer, {
          quality: p.quality,
          dpiScale: p.dpiScale,
          onProgress: (done, total) => setProgress({ done, total, label: 'Compressing page' }),
        });
        name = f.name.replace(/\.pdf$/i, '') + '-compressed.pdf';
        if (bytes.byteLength >= f.size) {
          note = 'This PDF got bigger, not smaller — it is probably text-based rather than scanned. Compression like this only helps image-heavy PDFs. Keep your original.';
        }

      } else if (tool === 'pdf-to-jpg') {
        const f = files[0];
        const images = await pdfToImages(f.buffer, {
          quality: 0.85, scale: 2,
          onProgress: (done, total) => setProgress({ done, total, label: 'Rendering page' }),
        });
        const [{ default: JSZip }, { saveAs }] = await Promise.all([
          import('jszip'), import('file-saver'),
        ]);
        const zip = new JSZip();
        const base = f.name.replace(/\.pdf$/i, '');
        for (const img of images) {
          zip.file(`${base}-page-${String(img.page).padStart(3, '0')}.jpg`, img.blob);
        }
        const blob = await zip.generateAsync({ type: 'blob' });
        saveAs(blob, `${base}-images.zip`);
        setResult({
          url: null, size: blob.size,
          name: `${base}-images.zip`,
          note: `${images.length} page${images.length === 1 ? '' : 's'} exported.`,
          downloaded: true,
        });
        setBusy(false);
        setProgress(null);
        return;

      } else if (tool === 'jpg-to-pdf') {
        if (!files.length) throw new Error('Add some images first.');
        bytes = await imagesToPdf(
          files.map((f) => ({ buffer: f.buffer, mime: f.type })),
          { pageSize },
        );
        name = 'images.pdf';
      }

      const blob = new Blob([bytes], { type: 'application/pdf' });
      setResult({
        url: URL.createObjectURL(blob),
        size: blob.size,
        name,
        note,
        originalSize: totalOriginal,
      });
    } catch (e) {
      setError(
        e.message === 'UNSUPPORTED_IMAGE'
          ? 'Only JPG and PNG images can go into a PDF. Convert other formats first with our Image Converter.'
          : e.message || 'Something went wrong with this file.'
      );
    } finally {
      setBusy(false);
      setProgress(null);
    }
  };

  const download = () => {
    if (!result?.url) return;
    const a = document.createElement('a');
    a.href = result.url;
    a.download = result.name;
    document.body.appendChild(a); a.click(); a.remove();
  };

  // ---- Empty state ----
  if (!files.length) {
    return (
      <>
        <DropZone onFiles={addFiles} accept={isImageInput ? 'image' : 'pdf'} />
        {error && <Notice tone="error">{error}</Notice>}
        <p style={{ textAlign: 'center', fontSize: '13px', color: 'var(--muted)', marginTop: '16px' }}>
          Everything runs in your browser. Your files never leave your device.
        </p>
      </>
    );
  }

  const f0 = files[0];
  const savedPct = result && result.originalSize && result.size < result.originalSize
    ? Math.round((1 - result.size / result.originalSize) * 100)
    : 0;

  return (
    <div>
      {/* Result headline */}
      {result && (
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: '14px', flexWrap: 'wrap', marginBottom: '22px' }}>
          <div>
            <div style={{ fontSize: '12px', color: 'var(--muted)', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: '6px', fontWeight: 600 }}>
              {savedPct > 0 ? 'You saved' : 'Done'}
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '12px', flexWrap: 'wrap' }}>
              <span className="mono" style={{ fontSize: 'clamp(36px, 8vw, 52px)', fontWeight: 700, color: 'var(--brand)', lineHeight: 0.9, letterSpacing: '-0.04em' }}>
                {savedPct > 0 ? `${savedPct}%` : formatBytes(result.size)}
              </span>
              {savedPct > 0 && (
                <span className="mono" style={{ fontSize: '15px', color: 'var(--muted)' }}>
                  {formatBytes(result.originalSize)} → {formatBytes(result.size)}
                </span>
              )}
            </div>
          </div>
          <span style={{ marginLeft: 'auto', background: 'var(--brand-soft)', color: 'var(--brand-ink)', fontSize: '12px', fontWeight: 600, padding: '7px 13px', borderRadius: '999px' }}>
            Never left your device
          </span>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(220px, 250px) 1fr', gap: '18px', alignItems: 'start' }} className="ws-grid">
        {/* Controls */}
        <div>
          <div style={{ background: 'var(--card)', border: '0.5px solid var(--line)', borderRadius: '16px', padding: '18px' }}>

            {tool === 'compress-pdf' && (
              <>
                <FieldLabel>Compression</FieldLabel>
                <div style={{ display: 'grid', gap: '7px', marginBottom: '14px' }}>
                  {Object.entries(PRESETS).map(([key, p]) => (
                    <Chip key={key} active={preset === key} onClick={() => setPreset(key)}>
                      {p.label}
                    </Chip>
                  ))}
                </div>
                <p style={{ fontSize: '12px', color: 'var(--muted)', lineHeight: 1.5, marginBottom: '18px' }}>
                  This works by re-rendering each page as an image. Great for scans
                  and image-heavy PDFs — but text will no longer be selectable.
                </p>
              </>
            )}

            {tool === 'split-pdf' && (
              <>
                <FieldLabel>Pages to keep</FieldLabel>
                <input
                  type="text"
                  placeholder="e.g. 1-3, 5, 8"
                  value={range}
                  onChange={(e) => { setRange(e.target.value); setSelected([]); }}
                  style={{ width: '100%', minHeight: 'var(--tap)', padding: '0 12px', borderRadius: '10px', border: '1px solid var(--line)', background: 'var(--paper)', color: 'var(--ink)', fontSize: '15px', marginBottom: '10px' }}
                />
                <p style={{ fontSize: '12px', color: 'var(--muted)', lineHeight: 1.5, marginBottom: '18px' }}>
                  {selected.length
                    ? `${selected.length} page${selected.length === 1 ? '' : 's'} selected below.`
                    : 'Type page numbers, or tap the pages on the right.'}
                </p>
              </>
            )}

            {tool === 'jpg-to-pdf' && (
              <>
                <FieldLabel>Page size</FieldLabel>
                <div style={{ display: 'grid', gap: '7px', marginBottom: '18px' }}>
                  <Chip active={pageSize === 'fit'} onClick={() => setPageSize('fit')}>Fit to image</Chip>
                  <Chip active={pageSize === 'a4'} onClick={() => setPageSize('a4')}>A4 page</Chip>
                </div>
              </>
            )}

            {tool === 'merge-pdf' && (
              <p style={{ fontSize: '12px', color: 'var(--muted)', lineHeight: 1.5, marginBottom: '18px' }}>
                They'll be merged top to bottom. Use the arrows to reorder.
              </p>
            )}

            {tool === 'pdf-to-jpg' && (
              <p style={{ fontSize: '12px', color: 'var(--muted)', lineHeight: 1.5, marginBottom: '18px' }}>
                Every page becomes a JPG. They'll download together as a zip.
              </p>
            )}

            {result && result.url ? (
              <button onClick={download} style={btn('solid')}>Download</button>
            ) : (
              <button onClick={run} disabled={busy} style={btn('solid')}>
                {busy ? 'Working…' : actionLabel(tool)}
              </button>
            )}
            <button onClick={reset} style={{ ...btn('ghost'), marginTop: '8px' }}>Start over</button>
          </div>

          <div style={{ marginTop: '14px' }}>
            <DropZone onFiles={addFiles} accept={isImageInput ? 'image' : 'pdf'} compact />
          </div>
        </div>

        {/* Preview area */}
        <div>
          {error && <Notice tone="error">{error}</Notice>}
          {result?.note && <Notice tone="warn">{result.note}</Notice>}
          {result?.downloaded && <Notice tone="ok">Saved to your downloads.</Notice>}

          {progress && (
            <Notice tone="info">
              {progress.label} {progress.done} of {progress.total}…
            </Notice>
          )}

          {multi ? (
            <FileList files={files} onRemove={removeFile} onMove={move} />
          ) : (
            <PageGrid
              file={f0}
              busy={busy && !progress}
              selectable={tool === 'split-pdf'}
              selected={selected}
              onToggle={togglePage}
            />
          )}
        </div>
      </div>
    </div>
  );
}

function actionLabel(tool) {
  return {
    'merge-pdf': 'Merge PDFs',
    'split-pdf': 'Extract pages',
    'compress-pdf': 'Compress PDF',
    'pdf-to-jpg': 'Convert to JPG',
    'jpg-to-pdf': 'Create PDF',
  }[tool] || 'Run';
}

function FieldLabel({ children }) {
  return (
    <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--ink)', marginBottom: '10px' }}>
      {children}
    </div>
  );
}

function Chip({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      aria-pressed={active}
      style={{
        padding: '12px', borderRadius: '11px', border: 'none',
        background: active ? 'var(--brand)' : 'var(--soft)',
        color: active ? '#fff' : 'var(--muted)',
        fontSize: '13px', fontWeight: 600, minHeight: 'var(--tap)',
        transition: 'background 0.15s, color 0.15s',
      }}
    >
      {children}
    </button>
  );
}

function Notice({ tone, children }) {
  const tones = {
    error: { bg: 'var(--brand-soft)', fg: 'var(--brand-ink)' },
    warn:  { bg: '#FFF4E5', fg: '#8A5300' },
    ok:    { bg: '#E8F5E9', fg: '#1B5E20' },
    info:  { bg: 'var(--soft)', fg: 'var(--muted)' },
  };
  const t = tones[tone] || tones.info;
  return (
    <div style={{
      background: t.bg, color: t.fg, borderRadius: '12px',
      padding: '12px 14px', fontSize: '13px', lineHeight: 1.5,
      marginBottom: '14px', fontWeight: 500,
    }}>
      {children}
    </div>
  );
}

function FileList({ files, onRemove, onMove }) {
  return (
    <div style={{ display: 'grid', gap: '8px' }}>
      {files.map((f, i) => (
        <div key={f.id} style={{
          display: 'flex', alignItems: 'center', gap: '12px',
          background: 'var(--card)', border: '0.5px solid var(--line)',
          borderRadius: '12px', padding: '12px 14px',
        }}>
          <span className="mono" style={{ color: 'var(--muted)', fontSize: '13px', width: '22px' }}>
            {i + 1}
          </span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: '14px', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {f.name}
            </div>
            <div className="mono" style={{ fontSize: '12px', color: 'var(--muted)' }}>
              {formatBytes(f.size)}
            </div>
          </div>
          <button onClick={() => onMove(i, -1)} disabled={i === 0} aria-label="Move up" style={iconBtn}>↑</button>
          <button onClick={() => onMove(i, 1)} disabled={i === files.length - 1} aria-label="Move down" style={iconBtn}>↓</button>
          <button onClick={() => onRemove(f.id)} aria-label="Remove" style={iconBtn}>✕</button>
        </div>
      ))}
    </div>
  );
}

function PageGrid({ file, busy, selectable, selected, onToggle }) {
  if (busy || !file.thumbs) {
    return (
      <div style={{
        background: 'var(--soft)', borderRadius: '16px', padding: '60px 20px',
        textAlign: 'center', color: 'var(--muted)', fontSize: '14px',
      }}>
        Reading your PDF…
      </div>
    );
  }

  return (
    <>
      <div className="mono" style={{ fontSize: '13px', color: 'var(--muted)', marginBottom: '12px' }}>
        {file.name} · {file.pages} page{file.pages === 1 ? '' : 's'} · {formatBytes(file.size)}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))', gap: '10px' }}>
        {file.thumbs.map((t) => {
          const idx = t.page - 1;
          const on = selected.includes(idx);
          return (
            <button
              key={t.page}
              onClick={() => selectable && onToggle(idx)}
              disabled={!selectable}
              aria-pressed={selectable ? on : undefined}
              style={{
                position: 'relative', padding: 0, border: 'none',
                borderRadius: '10px', overflow: 'hidden',
                cursor: selectable ? 'pointer' : 'default',
                outline: on ? '3px solid var(--brand)' : '1px solid var(--line)',
                outlineOffset: on ? '-3px' : '-1px',
                background: 'var(--card)',
              }}
            >
              <img src={t.url} alt={`Page ${t.page}`} style={{ width: '100%', display: 'block', opacity: selectable && !on ? 0.55 : 1 }} />
              <span className="mono" style={{
                position: 'absolute', bottom: '5px', left: '5px',
                background: on ? 'var(--brand)' : 'rgba(0,0,0,0.6)',
                color: '#fff', fontSize: '11px', fontWeight: 600,
                padding: '2px 7px', borderRadius: '999px',
              }}>
                {t.page}
              </span>
            </button>
          );
        })}
      </div>
      {file.pages > file.thumbs.length && (
        <p style={{ fontSize: '12px', color: 'var(--muted)', marginTop: '12px' }}>
          Showing the first {file.thumbs.length} pages. All {file.pages} will still be processed.
        </p>
      )}
    </>
  );
}

const iconBtn = {
  width: '34px', height: '34px', borderRadius: '9px',
  border: '1px solid var(--line)', background: 'transparent',
  color: 'var(--ink)', fontSize: '14px', flexShrink: 0,
};

function btn(kind) {
  const base = {
    width: '100%', fontSize: '14px', fontWeight: 600, padding: '14px',
    borderRadius: '12px', minHeight: 'var(--tap)',
  };
  return kind === 'solid'
    ? { ...base, background: 'var(--brand)', color: '#fff', border: 'none' }
    : { ...base, background: 'transparent', color: 'var(--muted)', border: '1px solid var(--line)' };
}
