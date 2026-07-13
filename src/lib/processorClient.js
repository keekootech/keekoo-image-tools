/* ============================================================
   Main-thread client for the image workers.

   Runs a small pool (one worker per core, capped) so a batch of 20 images
   uses several cores instead of crawling through them one at a time.

   Each image is pinned to one worker, because that worker holds its decoded
   pixels in memory. Re-encoding on a settings change then costs nothing extra.
   ============================================================ */

const POOL_SIZE = Math.max(2, Math.min(4, (navigator.hardwareConcurrency || 4) - 1));

let workers = [];
let nextWorker = 0;
const owner = new Map();   // imageId -> worker index
const pending = new Map(); // callId  -> { resolve, reject }
let callSeq = 0;

function spawn() {
  if (workers.length) return;
  for (let i = 0; i < POOL_SIZE; i++) {
    const w = new Worker(new URL('./imageWorker.js', import.meta.url), { type: 'module' });
    w.onmessage = handleMessage;
    w.onerror = () => {
      // A worker died — fail everything waiting on it rather than hanging.
      for (const [key, p] of pending) {
        p.reject(new Error('Image worker failed.'));
        pending.delete(key);
      }
    };
    workers.push(w);
  }
}

function handleMessage(e) {
  const m = e.data;
  const key = m.type === 'decoded' ? `d:${m.id}` : `p:${m.id}:${m.job}`;
  const errKey = m.job !== undefined ? `p:${m.id}:${m.job}` : `d:${m.id}`;

  if (m.type === 'error') {
    const p = pending.get(errKey);
    if (p) { p.reject(new Error(m.message)); pending.delete(errKey); }
    return;
  }

  const p = pending.get(key);
  if (!p) return;
  pending.delete(key);
  p.resolve(m);
}

/** Decode a File once. Pixels stay in the worker. */
export function decodeFile(id, file) {
  spawn();
  const idx = nextWorker % workers.length;
  nextWorker++;
  owner.set(id, idx);

  return file.arrayBuffer().then((buffer) => new Promise((resolve, reject) => {
    pending.set(`d:${id}`, { resolve, reject });
    workers[idx].postMessage(
      { type: 'decode', id, name: file.name, fileType: file.type, buffer },
      [buffer]
    );
  }));
}

/** Re-encode an already-decoded image with new settings. */
export function processImage(id, opts) {
  spawn();
  const idx = owner.get(id);
  if (idx === undefined) return Promise.reject(new Error('Image not loaded.'));

  const job = ++callSeq;
  return new Promise((resolve, reject) => {
    pending.set(`p:${id}:${job}`, { resolve, reject });
    workers[idx].postMessage({ type: 'process', id, job, opts });
  }).then((m) => {
    const blob = new Blob([m.buffer], { type: m.mime });
    return {
      blob,
      size: blob.size,
      url: URL.createObjectURL(blob),
      ext: m.ext,
      width: m.width,
      height: m.height,
    };
  });
}

/** Free an image's pixels in the worker. */
export function dropImage(id) {
  const idx = owner.get(id);
  if (idx === undefined) return;
  workers[idx]?.postMessage({ type: 'drop', id });
  owner.delete(id);
}

export function formatBytes(bytes) {
  if (!bytes) return '0 KB';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}
