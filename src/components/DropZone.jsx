import { useRef, useState, useEffect } from 'react';

/**
 * Drop zone. In "hero" mode it shows the signature living red blob with
 * drifting particles behind it (Squoosh-style, in brand red).
 * In "compact" mode it's a small dashed strip for adding more files.
 */
export default function DropZone({ onFiles, compact }) {
  const inputRef = useRef(null);
  const [over, setOver] = useState(false);

  const pick = (files) => {
    const arr = Array.from(files).filter(
      (f) => f.type.startsWith('image/') || /\.(jpe?g|png|webp|avif|heic)$/i.test(f.name)
    );
    if (arr.length) onFiles(arr);
  };

  const openPicker = () => inputRef.current?.click();

  const commonInput = (
    <input
      ref={inputRef}
      type="file"
      accept="image/*"
      multiple
      hidden
      onChange={(e) => { pick(e.target.files); e.target.value = ''; }}
    />
  );

  if (compact) {
    return (
      <div
        onClick={openPicker}
        onDragOver={(e) => { e.preventDefault(); setOver(true); }}
        onDragLeave={() => setOver(false)}
        onDrop={(e) => { e.preventDefault(); setOver(false); pick(e.dataTransfer.files); }}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && openPicker()}
        style={{
          border: `1.5px dashed ${over ? 'var(--brand)' : 'var(--line)'}`,
          borderRadius: 'var(--radius)',
          background: over ? 'var(--brand-soft)' : 'transparent',
          padding: '18px',
          textAlign: 'center',
          cursor: 'pointer',
          transition: 'border-color 0.15s, background 0.15s',
        }}
      >
        {commonInput}
        <p style={{ margin: 0, fontSize: '14px', fontWeight: 600 }}>Add more images</p>
      </div>
    );
  }

  return <HeroDrop onOpen={openPicker} onFiles={pick} over={over} setOver={setOver}>{commonInput}</HeroDrop>;
}

function HeroDrop({ onOpen, onFiles, over, setOver, children }) {
  const canvasRef = useRef(null);
  const blobRef = useRef(null);
  const wrapRef = useRef(null);

  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const canvas = canvasRef.current;
    const stage = canvas?.parentElement;
    if (!canvas || !stage) return;
    const ctx = canvas.getContext('2d');
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let W = 0, H = 0, raf;

    const resize = () => {
      W = stage.clientWidth; H = stage.clientHeight;
      canvas.width = W * dpr; canvas.height = H * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener('resize', resize);

    const parts = Array.from({ length: 24 }, () => ({
      x: Math.random() * W, y: Math.random() * H,
      r: 4 + Math.random() * 15,
      vx: (Math.random() - 0.5) * 0.32, vy: (Math.random() - 0.5) * 0.32,
      a: 0.05 + Math.random() * 0.15,
    }));

    let t = 0;
    const tick = () => {
      ctx.clearRect(0, 0, W, H);
      for (const p of parts) {
        p.x += p.vx; p.y += p.vy;
        if (p.x < -30) p.x = W + 30; if (p.x > W + 30) p.x = -30;
        if (p.y < -30) p.y = H + 30; if (p.y > H + 30) p.y = -30;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(204,7,30,${p.a})`;
        ctx.fill();
      }

      const blob = blobRef.current;
      if (blob) {
        t += 0.015;
        const cx = 150, cy = 150, base = 112, pts = 8, path = [];
        for (let i = 0; i < pts; i++) {
          const ang = (i / pts) * Math.PI * 2;
          const rad = base + Math.sin(t * 1.3 + i * 1.7) * 10 + Math.cos(t * 0.9 + i) * 6;
          path.push([cx + Math.cos(ang) * rad, cy + Math.sin(ang) * rad]);
        }
        let d = `M${path[0][0].toFixed(1)},${path[0][1].toFixed(1)} `;
        for (let i = 0; i < pts; i++) {
          const cur = path[i], nxt = path[(i + 1) % pts];
          const mx = (cur[0] + nxt[0]) / 2, my = (cur[1] + nxt[1]) / 2;
          d += `Q${cur[0].toFixed(1)},${cur[1].toFixed(1)} ${mx.toFixed(1)},${my.toFixed(1)} `;
        }
        blob.setAttribute('d', d + 'Z');
      }
      raf = requestAnimationFrame(tick);
    };

    if (reduce) {
      // draw one static frame
      for (const p of parts) {
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(204,7,30,${p.a})`; ctx.fill();
      }
    } else {
      tick();
    }

    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', resize); };
  }, []);

  return (
    <div
      onClick={onOpen}
      onDragOver={(e) => { e.preventDefault(); setOver(true); }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => { e.preventDefault(); setOver(false); onFiles(e.dataTransfer.files); }}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onOpen()}
      style={{
        position: 'relative', width: '100%', height: '440px',
        borderRadius: '16px', overflow: 'hidden', cursor: 'pointer',
        background: 'var(--soft)',
        outline: over ? '2px solid var(--brand)' : 'none', outlineOffset: '-2px',
      }}
    >
      {children}
      <canvas ref={canvasRef} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }} />

      <div
        ref={wrapRef}
        style={{
          position: 'absolute', top: '50%', left: '50%',
          transform: `translate(-50%,-50%) scale(${over ? 1.06 : 1})`,
          transition: 'transform 0.25s ease', textAlign: 'center',
        }}
      >
        <svg width="300" height="300" viewBox="0 0 300 300" style={{ display: 'block' }} aria-hidden="true">
          <path ref={blobRef} fill="var(--brand)" d="M150,40 C210,40 260,90 260,150 C260,210 210,260 150,260 C90,260 40,210 40,150 C40,90 90,40 150,40 Z" />
        </svg>
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', color: '#fff' }}>
          <div style={{ fontSize: '30px', lineHeight: 1, marginBottom: '10px' }} aria-hidden="true">＋</div>
          <div style={{ fontSize: '17px', fontWeight: 600 }}>Drop images here</div>
          <div style={{ fontSize: '13px', opacity: 0.9, marginTop: '2px' }}>or tap to choose</div>
        </div>
      </div>
    </div>
  );
}
