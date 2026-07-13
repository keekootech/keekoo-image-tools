/* One entry per SEO landing page. Each maps a URL slug to a tool + copy. */

export const TOOL_PAGES = {
  'image-compressor': {
    kind: 'image',
    tool: 'compress',
    title: 'Image Compressor — compress JPG, PNG & WebP free, in your browser',
    meta: 'Compress images without losing quality. No upload, no signup — everything runs in your browser. Free image compressor by Kee Koo Tech.',
    h1: 'Image Compressor',
    tagline: 'Shrink JPG, PNG, WebP and AVIF in your browser — one image or a hundred.',
    body: [
      'Drop an image and drag the slider to see the before and after side by side. Pick your format and quality, watch the file size drop in real time, and download when it looks right.',
      'Drop several images at once and they are all compressed with the same settings, then downloaded together as a single zip. There is no separate bulk mode to switch to — it just works either way.',
      'Smaller images make pages load faster, and faster pages rank better and convert more. A typical photo can drop by 60–80% with no visible loss — especially in WebP or AVIF.',
      'Everything happens on your device. Your images are never uploaded to a server, so nothing leaves your browser.',
    ],
  },
  'image-converter': {
    kind: 'image',
    tool: 'convert',
    title: 'Image Converter — PNG to JPG, WebP & AVIF free, in your browser',
    meta: 'Convert PNG, JPG, WebP and AVIF any-to-any, right in your browser. No upload, no signup. Free image converter by Kee Koo Tech.',
    h1: 'Image Converter',
    tagline: 'Convert PNG, JPG, WebP and AVIF — any format to any format.',
    body: [
      'Choose your output format and download instantly. PNG for lossless graphics, JPEG for photos, WebP and AVIF for the smallest modern files that still look great.',
      'AVIF and WebP usually produce far smaller files than JPEG or PNG at the same quality, which is why most fast websites now serve them.',
      'The conversion runs entirely in your browser. Nothing is uploaded — your images stay on your device.',
    ],
  },
  'image-resizer': {
    kind: 'image',
    tool: 'resize',
    title: 'Image Resizer — resize images by pixels or percent, free in-browser',
    meta: 'Resize images by exact pixels or by percentage, in your browser. No upload, no signup. Free image resizer by Kee Koo Tech.',
    h1: 'Image Resizer',
    tagline: 'Resize by exact pixels or by percentage — high quality, in your browser.',
    body: [
      'Set an exact width and height, or scale by percentage. The resize uses a high-quality method so downscaled images stay crisp instead of blocky.',
      'Resizing to the dimensions you actually display is one of the easiest ways to cut page weight — a 4000px photo shown at 800px is wasting most of its bytes.',
      'It all runs on your device. Your images are never uploaded anywhere.',
    ],
  },
  'image-cropper': {
    kind: 'image',
    tool: 'crop',
    title: 'Image Cropper — crop to 1:1, 4:5, 16:9 & social sizes, free in-browser',
    meta: 'Crop images to square, portrait, story and social sizes in your browser. No upload, no signup. Free image cropper by Kee Koo Tech.',
    h1: 'Image Cropper',
    tagline: 'Crop to square, portrait, story and social sizes — in your browser.',
    body: [
      'Pick a preset ratio — 1:1 square, 4:5 portrait, 16:9 widescreen, 9:16 story, or 1200×628 for social cards — and the image is centre-cropped to fit.',
      'Consistent crops keep product grids and social feeds looking tidy, and the right ratio stops platforms from awkwardly cutting your image for you.',
      'Cropping happens in your browser. Nothing is uploaded — your images stay with you.',
    ],
  },
  'bulk-image-compressor': {
    kind: 'image',
    tool: 'compress',
    bulkHint: true,
    title: 'Bulk Image Compressor — compress many images at once, free, in-browser',
    meta: 'Compress dozens of images at once and download them as a zip. No upload, no signup — all in your browser. Free bulk image compressor by Kee Koo Tech.',
    h1: 'Bulk Image Compressor',
    tagline: 'Compress dozens of images at once — one setting, one zip, in your browser.',
    body: [
      'Drop a whole folder of images, apply the same format and quality to all of them, and download the lot as a single zip. No doing them one at a time.',
      'This is the part most free tools can’t match: because everything runs locally, there’s no upload queue and no per-file limit — the batch is only as slow as your own machine.',
      'And because it’s all in your browser, none of those images are ever uploaded to a server. They never leave your device.',
    ],
  },

  // ---------- PDF tools ----------
  'merge-pdf': {
    tool: 'merge-pdf', kind: 'pdf',
    title: 'Merge PDF — combine PDF files free, in your browser',
    meta: 'Combine several PDFs into one, in any order. No upload, no signup — everything runs in your browser. Free PDF merger by Kee Koo Tech.',
    h1: 'Merge PDF',
    tagline: 'Combine several PDFs into one — in your browser, nothing uploaded.',
    body: [
      'Drop in two or more PDFs, drag them into the order you want, and download a single combined file.',
      'Most free PDF mergers upload your document to their server. Contracts, invoices, ID scans — all sitting on someone else\u2019s machine. This one never sends your file anywhere; the merging happens inside your browser.',
      'There is no page limit and no file-size cap, because there is no upload queue to wait in.',
    ],
  },
  'split-pdf': {
    tool: 'split-pdf', kind: 'pdf',
    title: 'Split PDF — extract pages from a PDF free, in your browser',
    meta: 'Pull selected pages out of a PDF into a new file. No upload, no signup — runs entirely in your browser. Free PDF splitter by Kee Koo Tech.',
    h1: 'Split PDF',
    tagline: 'Pull out the pages you need — tap them, or type a range.',
    body: [
      'Drop a PDF and you will see every page as a thumbnail. Tap the ones you want, or type a range like 1-3, 7, 10-12, and download just those pages as a new PDF.',
      'Useful for pulling one invoice out of a batch, sending a single chapter, or removing pages you would rather not share.',
      'Your document never leaves your device. The whole thing runs in your browser.',
    ],
  },
  'compress-pdf': {
    tool: 'compress-pdf', kind: 'pdf',
    title: 'Compress PDF — reduce PDF file size free, in your browser',
    meta: 'Shrink large PDFs so they fit email and upload limits. No upload, no signup — everything runs in your browser. Free PDF compressor by Kee Koo Tech.',
    h1: 'Compress PDF',
    tagline: 'Shrink a heavy PDF so it actually fits in an email.',
    body: [
      'Choose how hard to compress, and download a lighter file. Scanned documents and image-heavy PDFs often drop by 70\u201390%.',
      'Here is the honest bit, which most tools will not tell you: compression works by re-rendering each page as an image. That is why it is so effective on scans \u2014 but it also means text stops being selectable or searchable. On a pure text PDF the file can even end up larger, and we will tell you if that happens rather than quietly handing you a worse file.',
      'As with everything here, your document stays on your device.',
    ],
  },
  'pdf-to-jpg': {
    tool: 'pdf-to-jpg', kind: 'pdf',
    title: 'PDF to JPG — convert PDF pages to images free, in your browser',
    meta: 'Turn every page of a PDF into a JPG image and download them as a zip. No upload, no signup. Free PDF to JPG converter by Kee Koo Tech.',
    h1: 'PDF to JPG',
    tagline: 'Turn every page of a PDF into an image.',
    body: [
      'Each page becomes a high-resolution JPG, and they all download together as a single zip.',
      'Handy when you need a page as a picture \u2014 for a slide, a social post, or anywhere a PDF will not embed.',
      'The rendering happens in your browser. Nothing is uploaded.',
    ],
  },
  'jpg-to-pdf': {
    tool: 'jpg-to-pdf', kind: 'pdf',
    title: 'JPG to PDF — convert images to PDF free, in your browser',
    meta: 'Combine JPG and PNG images into a single PDF, in page order. No upload, no signup. Free image to PDF converter by Kee Koo Tech.',
    h1: 'JPG to PDF',
    tagline: 'Turn a pile of photos into one tidy PDF.',
    body: [
      'Drop in your JPGs or PNGs, drag them into order, and get a single PDF. Fit each page to the image, or put everything on A4.',
      'Good for turning phone photos of documents into something you can actually email.',
      'It all runs in your browser \u2014 your photos never get uploaded.',
    ],
  },
};

export const SLUGS = Object.keys(TOOL_PAGES);

export const IMAGE_SLUGS = SLUGS.filter((s) => TOOL_PAGES[s].kind !== 'pdf');
export const PDF_SLUGS = SLUGS.filter((s) => TOOL_PAGES[s].kind === 'pdf');
