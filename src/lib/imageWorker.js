/* ============================================================
   Image worker. Runs every codec off the main thread so the UI never freezes.

   Decoded pixel data (which is large — a 3000x2000 photo is ~24 MB of RGBA)
   is CACHED HERE and never sent back to the main thread. Only the small
   encoded result crosses the boundary. That's the whole point: decode once,
   re-encode cheaply on every settings change.
   ============================================================ */

import { decodeBuffer, runPipeline, mimeForFile } from './codecs.js';

/** id -> ImageData */
const cache = new Map();

self.onmessage = async (e) => {
  const msg = e.data;

  try {
    switch (msg.type) {
      case 'decode': {
        const { id, name, fileType, buffer } = msg;
        const imageData = await decodeBuffer(mimeForFile(name, fileType), buffer);
        cache.set(id, imageData);
        self.postMessage({
          type: 'decoded', id,
          width: imageData.width, height: imageData.height,
        });
        break;
      }

      case 'process': {
        const { id, job, opts } = msg;
        const imageData = cache.get(id);
        if (!imageData) {
          self.postMessage({ type: 'error', id, job, message: 'Image not loaded.' });
          return;
        }
        const r = await runPipeline(imageData, opts);
        // Transfer the encoded buffer rather than copying it.
        self.postMessage(
          { type: 'processed', id, job, buffer: r.buffer, mime: r.mime, ext: r.ext, width: r.width, height: r.height },
          [r.buffer]
        );
        break;
      }

      case 'drop': {
        cache.delete(msg.id);
        break;
      }

      default:
        break;
    }
  } catch (err) {
    self.postMessage({
      type: 'error',
      id: msg.id,
      job: msg.job,
      message: err && err.message === 'DECODE_UNSUPPORTED'
        ? "This format can't be read in-browser. Try a JPG or PNG."
        : 'Could not process this image.',
    });
  }
};
