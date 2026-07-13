/* Tool settings. Chunky tap-friendly controls, not sleepy dropdowns. */

const FORMATS = [
  ['webp', 'WebP'],
  ['avif', 'AVIF'],
  ['jpeg', 'JPEG'],
  ['png', 'PNG'],
];

const ASPECTS = [
  ['1:1', 'Square'],
  ['4:5', 'Portrait'],
  ['16:9', 'Wide'],
  ['9:16', 'Story'],
  ['1200x628', 'Social'],
];

function Label({ children, value }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '10px' }}>
      <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--ink)' }}>{children}</span>
      {value !== undefined && (
        <span className="mono" style={{ fontSize: '20px', fontWeight: 600, color: 'var(--brand)', lineHeight: 1 }}>
          {value}
        </span>
      )}
    </div>
  );
}

/** Grid of chunky selectable chips */
function ChipGrid({ options, value, onSelect, cols = 2 }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: '7px' }}>
      {options.map(([val, label]) => {
        const active = val === value;
        return (
          <button
            key={val}
            onClick={() => onSelect(val)}
            aria-pressed={active}
            style={{
              padding: '12px 4px',
              borderRadius: '11px',
              border: 'none',
              background: active ? 'var(--brand)' : 'var(--soft)',
              color: active ? '#fff' : 'var(--muted)',
              fontSize: '13px',
              fontWeight: 600,
              minHeight: 'var(--tap)',
              transition: 'background 0.15s, color 0.15s, transform 0.1s',
            }}
            onMouseDown={(e) => (e.currentTarget.style.transform = 'scale(0.97)')}
            onMouseUp={(e) => (e.currentTarget.style.transform = 'scale(1)')}
            onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}

export default function Settings({ tool, settings, onChange, children }) {
  const set = (patch) => onChange({ ...settings, ...patch });
  const showQuality = settings.format !== 'png' && (tool === 'compress' || tool === 'resize' || tool === 'crop' || tool === 'convert');

  return (
    <div style={{
      background: 'var(--card)',
      border: '0.5px solid var(--line)',
      borderRadius: '16px',
      padding: '18px',
    }}>
      {/* Output format — every tool writes a file, so every tool needs this */}
      <div style={{ marginBottom: '22px' }}>
        <Label>Output format</Label>
        <ChipGrid options={FORMATS} value={settings.format} onSelect={(v) => set({ format: v })} />
      </div>

      {tool === 'resize' && (
        <div style={{ marginBottom: '22px' }}>
          <Label>Resize by</Label>
          <ChipGrid
            options={[['percentage', 'Percent'], ['pixels', 'Pixels']]}
            value={settings.resize.mode}
            onSelect={(v) => set({ resize: { ...settings.resize, mode: v } })}
          />
          <div style={{ marginTop: '18px' }}>
            {settings.resize.mode === 'percentage' ? (
              <>
                <Label value={`${settings.resize.scale}%`}>Scale</Label>
                <input type="range" min="5" max="200" step="1" value={settings.resize.scale}
                  onChange={(e) => set({ resize: { ...settings.resize, scale: parseInt(e.target.value, 10) } })} />
              </>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <div>
                  <div style={{ fontSize: '12px', color: 'var(--muted)', marginBottom: '6px' }}>Width</div>
                  <input type="number" min="1" value={settings.resize.width}
                    onChange={(e) => set({ resize: { ...settings.resize, width: parseInt(e.target.value, 10) || 1 } })} />
                </div>
                <div>
                  <div style={{ fontSize: '12px', color: 'var(--muted)', marginBottom: '6px' }}>Height</div>
                  <input type="number" min="1" value={settings.resize.height}
                    onChange={(e) => set({ resize: { ...settings.resize, height: parseInt(e.target.value, 10) || 1 } })} />
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {tool === 'crop' && (
        <div style={{ marginBottom: '22px' }}>
          <Label>Crop to</Label>
          <ChipGrid options={ASPECTS} value={settings.crop.aspect}
            onSelect={(v) => set({ crop: { ...settings.crop, aspect: v } })} />
        </div>
      )}

      {showQuality && (
        <div style={{ marginBottom: '22px' }}>
          <Label value={settings.quality}>Quality</Label>
          <input type="range" min="20" max="100" step="1" value={settings.quality}
            onChange={(e) => set({ quality: parseInt(e.target.value, 10) })} />
        </div>
      )}

      {settings.format === 'png' && (
        <p style={{ fontSize: '12px', color: 'var(--muted)', margin: '-10px 0 20px', lineHeight: 1.5 }}>
          PNG is lossless — quality doesn’t apply.
        </p>
      )}

      {settings.format === 'avif' && (
        <p style={{ fontSize: '12px', color: 'var(--muted)', margin: '-10px 0 20px', lineHeight: 1.5 }}>
          AVIF makes the smallest files, but takes a few seconds per image.
        </p>
      )}

      {children}
    </div>
  );
}
