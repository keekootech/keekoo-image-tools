/* ============================================================
   Image processing engine — 100% client-side.
   Uses jSquash (Squoosh's WASM codecs) for encode/decode/resize.
   Codecs are lazy-loaded (dynamic import) to keep first paint light.
   Nothing here ever touches the network with image data.
   ============================================================ */

// --- Lazy codec loaders (only fetched when first needed) ---
const codecs = {
  async decode(format, buffer) {
    switch (format) {
      case 'image/jpeg': {
        const { decode } = await import('@jsquash/jpeg');
        return decode(buffer);
      }
      case 'image/png': {
        const { decode } = await import('@jsquash/png');
        return decode(buffer);
      }
      case 'image/webp': {
        const { decode } = await import('@jsquash/webp');
        return decode(buffer);
      }
      case 'image/avif': {
        const { decode } = await import('@jsquash/avif');
        return decode(buffer);
      }
      default:
        // Fallback: decode via the browser's own canvas for exotic types
        return decodeViaCanvas(buffer, format);
    }
  },

  async encode(format, imageData, quality) {
    switch (format) {
      case 'jpeg': {
        const { encode } = await import('@jsquash/jpeg');
        return encode(imageData, { quality });
      }
      case 'png': {
        const { encode } = await import('@jsquash/png');
        return encode(imageData); // PNG is lossless; quality ignored
      }
      case 'webp': {
        const { encode } = await import('@jsquash/webp');
        return encode(imageData, { quality });
      }
      case 'avif': {
        const { encode } = await import('@jsquash/avif');
        return encode(imageData, { quality });
      }
      default:
        throw new Error(`Unsupported output format: ${format}`);
    }
  },

  async resize(imageData, width, height) {
    const { default: resize } = await import('@jsquash/resize');
    return resize(imageData, { width, height });
  },
};

// Browser-native decode fallback (for HEIC etc. the browser can read)
async function decodeViaCanvas(buffer, mime) {
  const blob = new Blob([buffer], { type: mime });
  const bitmap = await createImageBitmap(blob).catch(() => null);
  if (!bitmap) {
    throw new Error('DECODE_UNSUPPORTED');
  }
  const canvas = document.createElement('canvas');
  canvas.width = bitmap.width;
  canvas.height = bitmap.height;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(bitmap, 0, 0);
  return ctx.getImageData(0, 0, bitmap.width, bitmap.height);
}

// Map a File's type to a decode key jSquash understands
function mimeFor(file) {
  const t = (file.type || '').toLowerCase();
  if (t) return t;
  const ext = file.name.split('.').pop().toLowerCase();
  const map = {
    jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png',
    webp: 'image/webp', avif: 'image/avif',
  };
  return map[ext] || 'image/*';
}

const EXT = { jpeg: 'jpg', png: 'png', webp: 'webp', avif: 'avif' };
const MIME = { jpeg: 'image/jpeg', png: 'image/png', webp: 'image/webp', avif: 'image/avif' };

/**
 * Decode a File to ImageData once. Reused across live preview updates.
 * @returns {Promise<{imageData: ImageData, width, height}>}
 */
export async function decodeFile(file) {
  const buffer = await file.arrayBuffer();
  const imageData = await codecs.decode(mimeFor(file), buffer);
  return { imageData, width: imageData.width, height: imageData.height };
}

/**
 * Process one already-decoded image with the given operation + settings.
 * @param {ImageData} sourceImageData
 * @param {Object} opts
 *   { tool, format, quality, resize:{mode,width,height,lockAspect},
 *     crop:{aspect} }
 * @returns {Promise<{blob, size, url, width, height}>}
 */
export async function processImage(sourceImageData, opts) {
  const { tool, format = 'webp', quality = 80 } = opts;
  let imageData = sourceImageData;

  if (tool === 'resize' && opts.resize) {
    imageData = await applyResize(imageData, opts.resize);
  }

  if (tool === 'crop' && opts.crop) {
    imageData = applyCrop(imageData, opts.crop.aspect);
  }

  const encoded = await codecs.encode(format, imageData, quality);
  const blob = new Blob([encoded], { type: MIME[format] });
  return {
    blob,
    size: blob.size,
    url: URL.createObjectURL(blob),
    width: imageData.width,
    height: imageData.height,
    ext: EXT[format],
  };
}

async function applyResize(imageData, resize) {
  let { mode, width, height, scale } = resize;
  let targetW, targetH;
  if (mode === 'percentage') {
    targetW = Math.max(1, Math.round(imageData.width * scale / 100));
    targetH = Math.max(1, Math.round(imageData.height * scale / 100));
  } else {
    targetW = Math.max(1, Math.round(width));
    targetH = Math.max(1, Math.round(height));
  }
  if (targetW === imageData.width && targetH === imageData.height) return imageData;
  return codecs.resize(imageData, targetW, targetH);
}

function applyCrop(imageData, aspectKey) {
  const ratios = {
    '1:1': 1, '4:5': 4 / 5, '16:9': 16 / 9, '9:16': 9 / 16, '1200x628': 1200 / 628,
  };
  const aspect = ratios[aspectKey] || 1;
  const { width: w, height: h, data } = imageData;

  let cropW, cropH;
  if (w / h > aspect) {
    cropH = h;
    cropW = Math.round(h * aspect);
  } else {
    cropW = w;
    cropH = Math.round(w / aspect);
  }
  const offX = Math.floor((w - cropW) / 2);
  const offY = Math.floor((h - cropH) / 2);

  const out = new Uint8ClampedArray(cropW * cropH * 4);
  for (let y = 0; y < cropH; y++) {
    const srcStart = ((y + offY) * w + offX) * 4;
    const dstStart = y * cropW * 4;
    out.set(data.subarray(srcStart, srcStart + cropW * 4), dstStart);
  }
  return new ImageData(out, cropW, cropH);
}

/** Human-readable file size */
export function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

export { EXT, MIME };
