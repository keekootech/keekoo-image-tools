# Simple — Image Tools by Kee Koo Tech

A free, 100%-in-browser image tools suite: compress, convert, resize, crop, and bulk.
No backend, no uploads, no signup. Every image is processed on the visitor's device
using the Squoosh WASM codecs (jSquash). Built to pull SEO traffic and funnel visitors
to Kee Koo Tech's Shopify/WordPress dev services.

## What's inside

- **5 tools**, each on its own SEO landing page:
  - `/tools/image-compressor`
  - `/tools/image-converter`
  - `/tools/image-resizer`
  - `/tools/image-cropper`
  - `/tools/bulk-image-compressor`
- **Signature split-slider preview** — drag to compare original vs processed, live mono size readout.
- **Bulk mode** — drop many images, one setting, download all as a `.zip`. Auto-activates when you drop 2+ files.
- **Real codecs** — jSquash (`@jsquash/jpeg|png|webp|avif|resize`), lazy-loaded so the first paint stays light.
- **Monochrome "Simple" design**, light + dark (follows system), mobile-first, touch slider.
- **Footer lead-gen CTA** on every page.

## Run locally

    npm install
    npm run dev

Open the printed URL (usually http://localhost:5173). It redirects to the compressor.

## Build for production

    npm run build      # outputs to dist/
    npm run preview    # serve the built site locally to check it

## Deploy to Cloudflare Pages (free)

1. Push this folder to a GitHub repo.
2. In Cloudflare -> Pages -> Create -> connect the repo.
3. Build settings:
   - Build command:  npm run build
   - Build output directory:  dist
4. Deploy. Then under Custom domains, add  app.keekootech.in
   (Cloudflare gives you a CNAME to add on Hostinger's DNS).

public/_redirects already handles SPA routing so deep links like
/tools/bulk-image-compressor load correctly.

Prefer to skip GitHub? Run  npm run build  and drag the  dist/  folder
straight into Cloudflare Pages' direct-upload option.

## Customise

- Footer links -> src/components/Footer.jsx (currently point to keekootech.in).
- SEO copy / titles / meta -> src/pages/toolConfig.js.
- Colors / brand tokens -> src/styles.css (:root and the dark-mode block).

## Notes

- AVIF gives the smallest files but its encoder WASM is large (~1MB gzipped);
  it only downloads if a user actually selects AVIF. WebP is the sensible default.
- Persistence: the last-used format/quality is remembered via localStorage.
- No analytics are included. Cloudflare Web Analytics (cookieless) is a good free add-on.
