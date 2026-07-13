import { useRef, useState, useCallback, useEffect } from 'react';
import { formatBytes } from '../lib/imageProcessor';

/**
 * The signature element. Original on the left, processed on the right,
 * a draggable vertical handle between them. Works on mouse + touch.
 */
export default function SplitSlider({ beforeUrl, afterUrl, beforeSize, afterSize }) {
  const [pos, setPos] = useState(50);
  const ref = useRef(null);
  const dragging = useRef(false);

  const setFromClientX = useCallback((clientX) => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const p = ((clientX - rect.left) / rect.width) * 100;
    setPos(Math.max(0, Math.min(100, p)));
  }, []);

  useEffect(() => {
    const onMove = (e) => {
      if (!dragging.current) return;
      const x = e.touches ? e.touches[0].clientX : e.clientX;
      setFromClientX(x);
    };
    const onUp = () => { dragging.current = false; };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    window.addEventListener('touchmove', onMove, { passive: false });
    window.addEventListener('touchend', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
      window.removeEventListener('touchmove', onMove);
      window.removeEventListener('touchend', onUp);
    };
  }, [setFromClientX]);

  const startDrag = (e) => {
    dragging.current = true;
    const x = e.touches ? e.touches[0].clientX : e.clientX;
    setFromClientX(x);
  };

  const onKey = (e) => {
    if (e.key === 'ArrowLeft') setPos((p) => Math.max(0, p - 2));
    if (e.key === 'ArrowRight') setPos((p) => Math.min(100, p + 2));
  };

  const saved = beforeSize - afterSize;
  const pct = beforeSize > 0 ? Math.round((saved / beforeSize) * 100) : 0;

  return (
    <div
      ref={ref}
      onMouseDown={startDrag}
      onTouchStart={startDrag}
      style={{
        position: 'relative',
        width: '100%',
        aspectRatio: '4 / 3',
        maxHeight: '520px',
        overflow: 'hidden',
        cursor: 'col-resize',
        userSelect: 'none',
        touchAction: 'none',
        background: 'var(--soft)',
        borderRadius: '16px',
      }}
    >
      {/* Original (full, underneath) */}
      <img
        src={beforeUrl}
        alt="Original"
        draggable={false}
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'contain' }}
      />

      {/* Processed (clipped from the left edge to the handle) */}
      <div style={{ position: 'absolute', inset: 0, clipPath: `inset(0 ${100 - pos}% 0 0)` }}>
        <img
          src={afterUrl}
          alt="Processed"
          draggable={false}
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'contain' }}
        />
      </div>

      {/* Labels */}
      <span style={badge('left')}>After</span>
      <span style={badge('right')}>Before</span>

      {/* Handle */}
      <div
        role="slider"
        aria-label="Comparison slider"
        aria-valuenow={Math.round(pos)}
        aria-valuemin={0}
        aria-valuemax={100}
        tabIndex={0}
        onKeyDown={onKey}
        style={{
          position: 'absolute', top: 0, left: `${pos}%`, transform: 'translateX(-50%)',
          height: '100%', width: '3px', background: 'var(--brand)', cursor: 'col-resize',
        }}
      >
        <div style={{
          position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
          width: '44px', height: '44px', borderRadius: '50%', background: 'var(--brand)',
          color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '18px', boxShadow: '0 1px 6px rgba(0,0,0,0.25)',
        }}>⇄</div>
      </div>

      {/* Live size readout — mono */}
      <div className="mono" style={{
        position: 'absolute', bottom: '12px', left: '12px',
        background: 'rgba(0,0,0,0.72)', color: '#fff', padding: '8px 12px',
        borderRadius: '8px', fontSize: '13px', fontWeight: 600, lineHeight: 1.4,
      }}>
        <div style={{ opacity: 0.7 }}>{formatBytes(beforeSize)}</div>
        <div>→ {formatBytes(afterSize)}</div>
        {pct > 0 && <div style={{ color: 'var(--savings)', marginTop: '2px' }}>−{pct}%</div>}
      </div>
    </div>
  );
}

function badge(side) {
  const isAfter = side === 'left';
  return {
    position: 'absolute', top: '12px', [side]: '12px',
    background: isAfter ? 'rgba(255,255,255,0.92)' : 'rgba(0,0,0,0.55)',
    color: isAfter ? '#111' : '#fff',
    fontSize: '11px', fontWeight: 600, letterSpacing: '0.02em',
    padding: '5px 11px', borderRadius: '999px', pointerEvents: 'none',
  };
}
