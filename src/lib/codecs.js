/* ============================================================
   Pure image codec logic. No DOM, no React — this runs inside a Web Worker.
   Uses jSquash (Squoosh's WASM codecs). Codecs are lazy-imported so we only
   download the ones actually used.
   ============================================================ */

const MIME = { jpeg: 'image/jpeg', png: 'image/png', webp: 'image/webp', avif: 'image/avif' };
const EXT = { jpeg: 'jpg', png: 'png', webp: 'webp', avif: 'avif' };

export async function decodeBuffer(mime, buffer) {
  switch (mime) {
    case 'image/jpeg': return (await import('@jsquash/jpeg')).decode(buffer);
    case 'image/png': return (await import('@jsquash/png')).decode(buffer);
    case 'image/webp': return (await import('@jsquash/webp')).decode(buffer);
    case 'image/avif': return (await import('@jsquash/avif')).decode(buffer);
    default: {
      // Let the browser try (HEIC on Safari, etc). createImageBitmap works in workers.
      const blob = new Blob([buffer], { type: mime });
      const bitmap = await createImageBitmap(blob).catch(() => null);
      if (!bitmap) throw new Error('DECODE_UNSUPPORTED');
      const canvas = new OffscreenCanvas(bitmap.width, bitmap.height);
      const ctx = canvas.getContext('2d');
      ctx.drawImage(bitmap, 0, 0);
      return ctx.getImageData(0, 0, bitmap.width, bitmap.height);
    }
  }
}

async function encodeImageData(format, imageData, quality) {
  switch (format) {
    case 'jpeg': return (await import('@jsquash/jpeg')).encode(imageData, { quality });
    case 'png': return (await import('@jsquash/png')).encode(imageData);
    case 'webp': return (await import('@jsquash/webp')).encode(imageData, { quality });
    case 'avif': return (await import('@jsquash/avif')).encode(imageData, { quality });
    default: throw new Error(`Unsupported format: ${format}`);
  }
}

async function applyResize(imageData, r) {
  let w, h;
  if (r.mode === 'percentage') {
    w = Math.max(1, Math.round(imageData.width * r.scale / 100));
    h = Math.max(1, Math.round(imageData.height * r.scale / 100));
  } else {
    w = Math.max(1, Math.round(r.width));
    h = Math.max(1, Math.round(r.height));
  }
  if (w === imageData.width && h === imageData.height) return imageData;
  const resize = (await import('@jsquash/resize')).default;
  return resize(imageData, { width: w, height: h });
}

function applyCrop(imageData, aspectKey) {
  const ratios = { '1:1': 1, '4:5': 4 / 5, '16:9': 16 / 9, '9:16': 9 / 16, '1200x628': 1200 / 628 };
  const aspect = ratios[aspectKey] || 1;
  const { width: w, height: h, data } = imageData;

  let cw, ch;
  if (w / h > aspect) { ch = h; cw = Math.round(h * aspect); }
  else { cw = w; ch = Math.round(w / aspect); }

  const ox = Math.floor((w - cw) / 2);
  const oy = Math.floor((h - ch) / 2);
  const out = new Uint8ClampedArray(cw * ch * 4);
  for (let y = 0; y < ch; y++) {
    const src = ((y + oy) * w + ox) * 4;
    out.set(data.subarray(src, src + cw * 4), y * cw * 4);
  }
  return new ImageData(out, cw, ch);
}

/** Run the requested operation and encode. Returns { buffer, ext, mime, width, height }. */
export async function runPipeline(sourceImageData, opts) {
  const { tool, format = 'webp', quality = 80 } = opts;
  let imageData = sourceImageData;

  if (tool === 'resize' && opts.resize) imageData = await applyResize(imageData, opts.resize);
  if (tool === 'crop' && opts.crop) imageData = applyCrop(imageData, opts.crop.aspect);

  const buffer = await encodeImageData(format, imageData, quality);
  return {
    buffer,
    ext: EXT[format],
    mime: MIME[format],
    width: imageData.width,
    height: imageData.height,
  };
}

export function mimeForFile(name, type) {
  const t = (type || '').toLowerCase();
  if (t && t !== 'image/*') return t;
  const ext = String(name).split('.').pop().toLowerCase();
  return { jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', webp: 'image/webp', avif: 'image/avif' }[ext] || 'image/*';
}

export { MIME, EXT };
