import { useState, useEffect, useRef, useCallback } from 'react';
import DropZone from './DropZone';
import Settings from './Settings';
import SplitSlider from './SplitSlider';
import { decodeFile, processImage, dropImage, formatBytes } from '../lib/processorClient';

const DEFAULT_SETTINGS = {
  format: 'webp',
  quality: 80,
  resize: { mode: 'percentage', scale: 50, width: 800, height: 600 },
  crop: { aspect: '1:1' },
};

// Load saved settings (optional persistence)
function loadSettings() {
  try {
    const raw = localStorage.getItem('keekoo:settings');
    if (raw) return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch { /* ignore */ }
  return DEFAULT_SETTINGS;
}

export default function Workspace({ tool }) {
  const [items, setItems] = useState([]); // {id, file, name, srcUrl, srcData, originalSize, out, outSize, status, error}
  const [settings, setSettings] = useState(loadSettings);
  const [zipping, setZipping] = useState(false);
  const jobId = useRef(0);

  const bulk = items.length > 1;

  // Persist settings
  useEffect(() => {
    try { localStorage.setItem('keekoo:settings', JSON.stringify(settings)); } catch { /* ignore */ }
  }, [settings]);

  // Add files. Decoding happens in a worker; the pixel data stays there.
  const addFiles = useCallback((files) => {
    const staged = files.map((file) => ({
      id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      name: file.name,
      srcUrl: URL.createObjectURL(file),
      decoded: false,
      originalSize: file.size,
      out: null, outSize: 0, status: 'decoding', error: null,
    }));
    setItems((prev) => [...prev, ...staged]);

    // Kick them all off at once — the pool spreads them across cores.
    staged.forEach((it, i) => {
      decodeFile(it.id, files[i])
        .then(() => setItems((prev) => prev.map((p) =>
          p.id === it.id ? { ...p, decoded: true, status: 'ready' } : p)))
        .catch((e) => setItems((prev) => prev.map((p) =>
          p.id === it.id ? { ...p, status: 'error', error: e.message } : p)));
    });
  }, []);

  // A fingerprint of the current output settings. If an item was processed
  // under a different fingerprint, it's stale and needs redoing.
  const settingsKey = JSON.stringify({
    tool,
    format: settings.format,
    quality: settings.quality,
    resize: settings.resize,
    crop: settings.crop,
  });

  // Changes whenever a new image finishes decoding (or one is removed), which
  // is what kicks off processing for freshly-dropped files.
  const decodedKey = items.filter((it) => it.decoded).map((it) => it.id).join('|');

  // Process anything that is decoded but not yet rendered under these settings.
  useEffect(() => {
    const myJob = ++jobId.current;
    const stale = items.filter((it) => it.decoded && it.doneKey !== settingsKey);
    if (!stale.length) return;

    const opts = {
      tool, format: settings.format, quality: settings.quality,
      resize: settings.resize, crop: settings.crop,
    };

    // Fire them all at the pool. Results land as they finish, so the first
    // image appears without waiting for the twentieth.
    stale.forEach((it) => {
      processImage(it.id, opts)
        .then((result) => {
          if (jobId.current !== myJob) { URL.revokeObjectURL(result.url); return; }
          setItems((prev) => prev.map((p) => {
            if (p.id !== it.id) return p;
            if (p.out) URL.revokeObjectURL(p.out);
            return {
              ...p,
              out: result.url, outSize: result.size, outExt: result.ext,
              status: 'done', doneKey: settingsKey,
            };
          }));
        })
        .catch((e) => {
          if (jobId.current !== myJob) return;
          setItems((prev) => prev.map((p) => p.id === it.id
            ? { ...p, status: 'error', error: e.message || 'Could not process this image.' }
            : p));
        });
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settingsKey, decodedKey]);

  const removeItem = (id) => setItems((prev) => {
    const it = prev.find((p) => p.id === id);
    if (it) { URL.revokeObjectURL(it.srcUrl); if (it.out) URL.revokeObjectURL(it.out); }
    dropImage(id);
    return prev.filter((p) => p.id !== id);
  });

  const clearAll = () => {
    items.forEach((it) => {
      URL.revokeObjectURL(it.srcUrl);
      if (it.out) URL.revokeObjectURL(it.out);
      dropImage(it.id);
    });
    setItems([]);
  };

  const baseName = (name) => name.replace(/\.[^.]+$/, '');

  const downloadOne = (it) => {
    if (!it.out) return;
    const a = document.createElement('a');
    a.href = it.out;
    a.download = `${baseName(it.name)}.${it.outExt}`;
    document.body.appendChild(a); a.click(); a.remove();
  };

  const downloadZip = async () => {
    setZipping(true);
    try {
      const [{ default: JSZip }, { saveAs }] = await Promise.all([
        import('jszip'),
        import('file-saver'),
      ]);
      const zip = new JSZip();
      const done = items.filter((it) => it.out);
      const used = {};
      for (const it of done) {
        const blob = await fetch(it.out).then((r) => r.blob());
        let fname = `${baseName(it.name)}.${it.outExt}`;
        if (used[fname]) fname = `${baseName(it.name)}-${used[fname]++}.${it.outExt}`;
        else used[fname] = 1;
        zip.file(fname, blob);
      }
      const content = await zip.generateAsync({ type: 'blob' });
      saveAs(content, 'keekoo-images.zip');
    } finally {
      setZipping(false);
    }
  };

  // Totals
  const totalOrig = items.reduce((s, it) => s + it.originalSize, 0);
  const totalOut = items.reduce((s, it) => s + (it.outSize || 0), 0);
  const savedPct = totalOrig > 0 && totalOut > 0 ? Math.round(((totalOrig - totalOut) / totalOrig) * 100) : 0;
  const anyDone = items.some((it) => it.out);

  if (items.length === 0) {
    return (
      <>
        <DropZone onFiles={addFiles} />
        <p style={{ textAlign: 'center', fontSize: '13px', color: 'var(--muted)', marginTop: '16px' }}>
          Everything runs in your browser. Your images never leave your device.
        </p>
      </>
    );
  }

  return (
    <div>
      {/* Hero savings stat — the payoff, made loud */}
      <div style={{
        display: 'flex', alignItems: 'flex-end', gap: '14px',
        flexWrap: 'wrap', marginBottom: '22px',
      }}>
        <div>
          <div style={{
            fontSize: '12px', color: 'var(--muted)', letterSpacing: '0.06em',
            textTransform: 'uppercase', marginBottom: '6px', fontWeight: 600,
          }}>
            {savedPct > 0 ? 'You saved' : 'Processing'}
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '12px', flexWrap: 'wrap' }}>
            <span className="mono" style={{
              fontSize: 'clamp(40px, 9vw, 56px)', fontWeight: 700, color: 'var(--brand)',
              lineHeight: 0.9, letterSpacing: '-0.04em',
            }}>
              {savedPct > 0 ? `${savedPct}%` : '—'}
            </span>
            <span className="mono" style={{ fontSize: '15px', color: 'var(--muted)' }}>
              {formatBytes(totalOrig)} → {totalOut ? formatBytes(totalOut) : '…'}
              {bulk && ` · ${items.length} images`}
            </span>
          </div>
        </div>
        <span style={{
          marginLeft: 'auto', background: 'var(--brand-soft)', color: 'var(--brand-ink)',
          fontSize: '12px', fontWeight: 600, padding: '7px 13px', borderRadius: '999px',
        }}>
          Never left your device
        </span>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(220px, 250px) 1fr',
        gap: '18px',
        alignItems: 'start',
      }} className="ws-grid">
        <div>
          <Settings tool={tool} settings={settings} onChange={setSettings}>
            {bulk ? (
              <button onClick={downloadZip} disabled={!anyDone || zipping} style={btn('solid')}>
                {zipping ? 'Zipping…' : 'Download all (.zip)'}
              </button>
            ) : (
              <button onClick={() => downloadOne(items[0])} disabled={!anyDone} style={btn('solid')}>
                Download
              </button>
            )}
            <button onClick={clearAll} style={{ ...btn('ghost'), marginTop: '8px' }}>Clear</button>
          </Settings>

          <div style={{ marginTop: '14px' }}>
            <DropZone onFiles={addFiles} compact />
          </div>
        </div>

        <div>
          {bulk ? (
            <BulkGrid items={items} onRemove={removeItem} onDownload={downloadOne} />
          ) : (
            <SingleView item={items[0]} />
          )}
        </div>
      </div>
    </div>
  );
}

function SingleView({ item }) {
  if (item.status === 'error') return <ErrorCard message={item.error} />;

  // Nothing to compare against yet — show the original right away with a quiet
  // working note, rather than an empty box. The first run is slower because the
  // WASM codec has to download; the user should still see their image instantly.
  if (!item.out) {
    return (
      <div style={{
        position: 'relative', width: '100%', aspectRatio: '4/3', maxHeight: '520px',
        borderRadius: '16px', overflow: 'hidden', background: 'var(--soft)',
      }}>
        <img
          src={item.srcUrl}
          alt=""
          style={{ width: '100%', height: '100%', objectFit: 'contain' }}
        />
        <div style={{
          position: 'absolute', bottom: '12px', left: '12px',
          background: 'rgba(0,0,0,0.72)', color: '#fff',
          padding: '8px 14px', borderRadius: '999px',
          fontSize: '13px', fontWeight: 600,
          display: 'flex', alignItems: 'center', gap: '8px',
        }}>
          <Spinner /> Compressing…
        </div>
      </div>
    );
  }

  return (
    <SplitSlider
      beforeUrl={item.srcUrl}
      afterUrl={item.out}
      beforeSize={item.originalSize}
      afterSize={item.outSize}
    />
  );
}

function Spinner() {
  return (
    <span
      aria-hidden="true"
      style={{
        width: '12px', height: '12px', borderRadius: '50%',
        border: '2px solid rgba(255,255,255,0.35)',
        borderTopColor: '#fff',
        display: 'inline-block',
        animation: 'kk-spin 0.7s linear infinite',
      }}
    />
  );
}

function BulkGrid({ items, onRemove, onDownload }) {
  return (
    <div style={{
      display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '12px',
    }}>
      {items.map((it) => (
        <div key={it.id} style={{
          position: 'relative', borderRadius: '14px', overflow: 'hidden',
          border: '0.5px solid var(--line)', background: 'var(--card)',
        }}>
          {it.status === 'error' ? (
            <div style={{ height: '130px', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '10px', fontSize: '11px', color: 'var(--muted)', textAlign: 'center' }}>
              {it.error}
            </div>
          ) : (
            <img src={it.out || it.srcUrl} alt={it.name} style={{ width: '100%', height: '130px', objectFit: 'cover', display: 'block', opacity: it.out ? 1 : 0.5 }} />
          )}

          <button onClick={() => onRemove(it.id)} aria-label="Remove" style={{
            position: 'absolute', top: '6px', right: '6px', width: '26px', height: '26px',
            border: 'none', borderRadius: '6px', background: 'rgba(0,0,0,0.6)', color: '#fff',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px',
          }}>✕</button>

          {it.out && (
            <div style={{ padding: '8px 10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span className="mono" style={{ fontSize: '11px' }}>
                {formatBytes(it.outSize)}
                {it.originalSize > it.outSize && (
                  <span style={{ color: 'var(--savings)' }}> −{Math.round((1 - it.outSize / it.originalSize) * 100)}%</span>
                )}
              </span>
              <button onClick={() => onDownload(it)} aria-label="Download" style={{
                border: 'none', background: 'none', color: 'var(--ink)', fontSize: '14px', padding: 0,
              }}>⬇</button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function ErrorCard({ message }) {
  return <div style={{ width: '100%', aspectRatio: '4/3', maxHeight: '520px', background: 'var(--card)', border: '0.5px solid var(--line)', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--muted)', fontSize: '14px', padding: '24px', textAlign: 'center' }}>{message}</div>;
}

function btn(kind) {
  const base = {
    width: '100%', fontSize: '14px', fontWeight: 600, padding: '14px',
    borderRadius: '12px', minHeight: 'var(--tap)',
  };
  return kind === 'solid'
    ? { ...base, background: 'var(--brand)', color: '#fff', border: 'none' }
    : { ...base, background: 'transparent', color: 'var(--muted)', border: '1px solid var(--line)' };
}
