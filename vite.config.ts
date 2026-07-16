import { cloudflare } from '@cloudflare/vite-plugin'
import tailwindcss from '@tailwindcss/vite'
import { devtools } from '@tanstack/devtools-vite'
import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import viteReact from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

const config = defineConfig({
  optimizeDeps: {
    // Worker-only codecs are invisible to Vite's initial application crawl.
    // Pre-discover them so first use in dev does not re-optimize and reload the
    // page, which would discard the user's in-memory transform queue.
    include: [
      '@jsquash/avif',
      '@jsquash/jpeg',
      '@jsquash/oxipng',
      '@jsquash/webp',
      'libheif-js/wasm-bundle',
      'raw-decoder',
      'utif2',
    ],
  },
  worker: {
    format: 'es',
  },
  resolve: {
    tsconfigPaths: true,
  },
  plugins: [
    devtools(),
    cloudflare({ viteEnvironment: { name: 'ssr' } }),
    tailwindcss(),
    tanstackStart(),
    viteReact(),
  ],
})

export default config
