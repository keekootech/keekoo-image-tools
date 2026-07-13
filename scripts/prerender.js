/* ============================================================
   Pre-render — runs after `vite build`.

   Vite ships a single index.html whose <title> and meta are set by React
   *after* the JS loads. Real browsers are fine with that; search crawlers
   frequently are not, and would index all five pages with the same generic
   title. That would defeat the entire point of the five landing pages.

   So for each tool slug we emit a real static file:
     dist/tools/image-compressor/index.html
   ...with the correct <title>, meta description, canonical, Open Graph tags,
   JSON-LD, an <h1>, and the page copy baked directly into the HTML.

   The copy is placed *inside* #root. React's createRoot().render() replaces
   the container's children on mount, so a real visitor never sees it — but a
   crawler that doesn't run JS reads it perfectly.

   Cloudflare Pages serves matching static files before falling back to the
   _redirects SPA rule, so these files win for their own URLs.
   ============================================================ */

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { TOOL_PAGES } from '../src/pages/toolConfig.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DIST = join(__dirname, '..', 'dist');
const ORIGIN = 'https://app.keekootech.in';

const esc = (s) =>
  String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

const template = readFileSync(join(DIST, 'index.html'), 'utf8');

let count = 0;

for (const [slug, page] of Object.entries(TOOL_PAGES)) {
  const url = `${ORIGIN}/tools/${slug}`;

  const head = `
    <title>${esc(page.title)}</title>
    <meta name="description" content="${esc(page.meta)}" />
    <link rel="canonical" href="${url}" />
    <meta property="og:type" content="website" />
    <meta property="og:url" content="${url}" />
    <meta property="og:title" content="${esc(page.title)}" />
    <meta property="og:description" content="${esc(page.meta)}" />
    <meta property="og:site_name" content="Kee Koo Tech" />
    <meta name="twitter:card" content="summary" />
    <meta name="twitter:title" content="${esc(page.title)}" />
    <meta name="twitter:description" content="${esc(page.meta)}" />
    <script type="application/ld+json">${JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'WebApplication',
      name: page.h1,
      url,
      description: page.meta,
      applicationCategory: 'MultimediaApplication',
      operatingSystem: 'Any (browser)',
      offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
      creator: { '@type': 'Organization', name: 'Kee Koo Tech', url: 'https://keekootech.in' },
    })}</script>`;

  // Crawler-visible content. React wipes this on mount.
  const otherLinks = Object.entries(TOOL_PAGES)
    .filter(([s]) => s !== slug)
    .map(([s, p]) => `<a href="/tools/${s}">${esc(p.h1)}</a>`)
    .join(' · ');

  const body = `<h1>${esc(page.h1)}</h1>
      <p>${esc(page.tagline)}</p>
      ${page.body.map((p) => `<p>${esc(p)}</p>`).join('\n      ')}
      <nav>${otherLinks}</nav>
      <p>Built by <a href="https://keekootech.in">Kee Koo Tech</a> — we build fast Shopify and WordPress stores.</p>`;

  let html = template;

  // Strip the generic title/description so they can't win over ours.
  html = html.replace(/<title>[\s\S]*?<\/title>\s*/i, '');
  html = html.replace(/<meta\s+name="description"[^>]*>\s*/i, '');

  // Inject our head tags just before </head>
  html = html.replace('</head>', `${head}\n  </head>`);

  // Seed #root with the crawlable copy
  html = html.replace('<div id="root"></div>', `<div id="root">${body}</div>`);

  const outDir = join(DIST, 'tools', slug);
  mkdirSync(outDir, { recursive: true });
  writeFileSync(join(outDir, 'index.html'), html, 'utf8');
  count++;
  console.log(`  ✓ /tools/${slug}`);
}

console.log(`\nPre-rendered ${count} pages with real titles, meta, and copy.`);
