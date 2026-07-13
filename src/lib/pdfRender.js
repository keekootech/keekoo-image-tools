/* ============================================================
   PDF rendering with pdf.js. Used for thumbnails, PDF→JPG, and compression.

   pdf.js parses in its own worker; page rasterisation happens here. We yield
   to the event loop between pages so a 100-page document doesn't freeze the UI.
   ============================================================ */

import * as pdfjsLib from 'pdfjs-dist';
import workerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

pdfjsLib.GlobalWorkerOptions.workerSrc = workerUrl;

const yieldToUI = () => new Promise((r) => setTimeout(r, 0));

/** Open a PDF for rendering. Returns a pdf.js document proxy. */
export async function openPdf(buffer) {
  // pdf.js takes ownership of the buffer, so hand it a copy.
  const data = buffer.slice(0);
  return pdfjsLib.getDocument({ data }).promise;
}

/**
 * Render one page to a canvas.
 * @param scale 1 = 72dpi. 2 ≈ 144dpi. Higher = sharper and heavier.
 */
async function renderPageToCanvas(pdf, pageNum, scale) {
  const page = await pdf.getPage(pageNum);
  const viewport = page.getViewport({ scale });
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.floor(viewport.width));
  canvas.height = Math.max(1, Math.floor(viewport.height));
  const ctx = canvas.getContext('2d');

  // White background — PDFs are transparent by default, and JPEG has no alpha,
  // so without this every page comes out with a black background.
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  await page.render({ canvasContext: ctx, viewport }).promise;
  return canvas;
}

const toBlob = (canvas, mime, quality) =>
  new Promise((resolve) => canvas.toBlob(resolve, mime, quality));

/** Small preview thumbnails for the page grid. */
export async function renderThumbnails(buffer, { maxPages = 60, width = 160 } = {}) {
  const pdf = await openPdf(buffer);
  const total = pdf.numPages;
  const out = [];

  for (let i = 1; i <= Math.min(total, maxPages); i++) {
    const page = await pdf.getPage(i);
    const base = page.getViewport({ scale: 1 });
    const scale = width / base.width;
    const canvas = await renderPageToCanvas(pdf, i, scale);
    const blob = await toBlob(canvas, 'image/jpeg', 0.7);
    out.push({ page: i, url: URL.createObjectURL(blob) });
    await yieldToUI();
  }

  return { total, thumbs: out };
}

/**
 * Render every page to a full-size image. Used by PDF→JPG.
 * @param onProgress (done, total)
 */
export async function pdfToImages(buffer, { format = 'image/jpeg', quality = 0.85, scale = 2, onProgress } = {}) {
  const pdf = await openPdf(buffer);
  const total = pdf.numPages;
  const out = [];

  for (let i = 1; i <= total; i++) {
    const canvas = await renderPageToCanvas(pdf, i, scale);
    const blob = await toBlob(canvas, format, quality);
    out.push({ page: i, blob, width: canvas.width, height: canvas.height });
    onProgress?.(i, total);
    await yieldToUI();
  }

  return out;
}

/**
 * Compress a PDF by rasterising each page and re-encoding it as JPEG.
 *
 * BE HONEST ABOUT WHAT THIS DOES:
 *  - It works very well on scans and image-heavy PDFs (often 70–90% smaller).
 *  - It converts text into pixels. Text is no longer selectable or searchable,
 *    and on a text-only PDF the result can end up LARGER than the original.
 *  The UI must say so, and must tell the user when the file grew.
 *
 * @param onProgress (done, total)
 */
export async function compressPdf(buffer, { quality = 0.6, dpiScale = 1.5, onProgress } = {}) {
  const pdf = await openPdf(buffer);
  const total = pdf.numPages;
  const pages = [];

  for (let i = 1; i <= total; i++) {
    const canvas = await renderPageToCanvas(pdf, i, dpiScale);
    const blob = await toBlob(canvas, 'image/jpeg', quality);
    const buf = await blob.arrayBuffer();
    pages.push({
      buffer: buf,
      mime: 'image/jpeg',
      // Keep the original page dimensions (72dpi points) so the PDF is the
      // same physical size — we've only changed the pixel density inside.
      width: canvas.width / dpiScale,
      height: canvas.height / dpiScale,
    });
    onProgress?.(i, total);
    await yieldToUI();
  }

  const { pagesToPdf } = await import('./pdfOps.js');
  return pagesToPdf(pages);
}
