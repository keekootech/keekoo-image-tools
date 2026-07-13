/* ============================================================
   PDF operations. All client-side, using pdf-lib.
   Nothing here touches a network.
   ============================================================ */

import { PDFDocument, degrees } from 'pdf-lib';

/** Load a File/ArrayBuffer into a PDFDocument. */
export async function loadPdf(data) {
  return PDFDocument.load(data, { ignoreEncryption: true });
}

/** How many pages does this PDF have? */
export async function pageCount(data) {
  const doc = await loadPdf(data);
  return doc.getPageCount();
}

/** Merge several PDFs (given as ArrayBuffers) in order. */
export async function mergePdfs(buffers) {
  const out = await PDFDocument.create();
  for (const buf of buffers) {
    const src = await loadPdf(buf);
    const pages = await out.copyPages(src, src.getPageIndices());
    pages.forEach((p) => out.addPage(p));
  }
  return out.save();
}

/**
 * Extract a set of pages into a new PDF.
 * @param {ArrayBuffer} buffer
 * @param {number[]} indices zero-based page indices, in the order wanted
 */
export async function extractPages(buffer, indices) {
  const src = await loadPdf(buffer);
  const out = await PDFDocument.create();
  const valid = indices.filter((i) => i >= 0 && i < src.getPageCount());
  const pages = await out.copyPages(src, valid);
  pages.forEach((p) => out.addPage(p));
  return out.save();
}

/** Rotate every page (or a subset) by a multiple of 90°. */
export async function rotatePages(buffer, angle, indices = null) {
  const doc = await loadPdf(buffer);
  const pages = doc.getPages();
  pages.forEach((p, i) => {
    if (indices && !indices.includes(i)) return;
    const current = p.getRotation().angle;
    p.setRotation(degrees((current + angle) % 360));
  });
  return doc.save();
}

/** Delete pages, keeping the rest. */
export async function deletePages(buffer, indicesToRemove) {
  const src = await loadPdf(buffer);
  const keep = src.getPageIndices().filter((i) => !indicesToRemove.includes(i));
  return extractPages(buffer, keep);
}

/**
 * Build a PDF from images.
 * @param {Array<{buffer: ArrayBuffer, mime: string}>} images
 * @param {Object} opts { pageSize: 'fit'|'a4', margin: number }
 */
export async function imagesToPdf(images, opts = {}) {
  const { pageSize = 'fit', margin = 0 } = opts;
  const doc = await PDFDocument.create();
  const A4 = { w: 595.28, h: 841.89 };

  for (const img of images) {
    let embedded;
    if (img.mime === 'image/png') {
      embedded = await doc.embedPng(img.buffer);
    } else if (img.mime === 'image/jpeg') {
      embedded = await doc.embedJpg(img.buffer);
    } else {
      // pdf-lib only embeds PNG and JPEG. Anything else must be converted first.
      throw new Error('UNSUPPORTED_IMAGE');
    }

    if (pageSize === 'a4') {
      const page = doc.addPage([A4.w, A4.h]);
      const maxW = A4.w - margin * 2;
      const maxH = A4.h - margin * 2;
      const scale = Math.min(maxW / embedded.width, maxH / embedded.height, 1);
      const w = embedded.width * scale;
      const h = embedded.height * scale;
      page.drawImage(embedded, {
        x: (A4.w - w) / 2,
        y: (A4.h - h) / 2,
        width: w,
        height: h,
      });
    } else {
      // Page exactly the size of the image
      const page = doc.addPage([embedded.width + margin * 2, embedded.height + margin * 2]);
      page.drawImage(embedded, {
        x: margin, y: margin,
        width: embedded.width, height: embedded.height,
      });
    }
  }

  return doc.save();
}

/**
 * Rebuild a PDF from already-rendered page images.
 * This is how "compress" works — see compress.js for the honest caveat.
 */
export async function pagesToPdf(pageImages) {
  const doc = await PDFDocument.create();
  for (const p of pageImages) {
    const embedded = p.mime === 'image/png'
      ? await doc.embedPng(p.buffer)
      : await doc.embedJpg(p.buffer);
    const page = doc.addPage([p.width, p.height]);
    page.drawImage(embedded, { x: 0, y: 0, width: p.width, height: p.height });
  }
  return doc.save();
}

/** Parse "1-3, 5, 8-10" into zero-based indices, clamped to the doc. */
export function parseRanges(input, total) {
  const out = [];
  const parts = String(input).split(',');
  for (const part of parts) {
    const t = part.trim();
    if (!t) continue;
    const m = t.match(/^(\d+)\s*-\s*(\d+)$/);
    if (m) {
      let a = parseInt(m[1], 10);
      let b = parseInt(m[2], 10);
      if (a > b) [a, b] = [b, a];
      for (let i = a; i <= b; i++) {
        if (i >= 1 && i <= total) out.push(i - 1);
      }
    } else if (/^\d+$/.test(t)) {
      const n = parseInt(t, 10);
      if (n >= 1 && n <= total) out.push(n - 1);
    }
  }
  return [...new Set(out)];
}

export function formatBytes(bytes) {
  if (!bytes) return '0 KB';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}
