/* One entry per SEO landing page. Each maps a URL slug to a tool + copy. */

export const TOOL_PAGES = {
  'image-compressor': {
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
};

export const SLUGS = Object.keys(TOOL_PAGES);
