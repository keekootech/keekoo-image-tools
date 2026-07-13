import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// jSquash ships its own .wasm; exclude from pre-bundle so the WASM URLs resolve.
export default defineConfig({
  plugins: [react()],
  base: '/',
  optimizeDeps: {
    exclude: [
      '@jsquash/jpeg', '@jsquash/png', '@jsquash/webp',
      '@jsquash/avif', '@jsquash/resize',
    ],
  },
  build: {
    target: 'es2020',
  },
});
