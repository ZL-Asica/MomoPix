/// <reference types="vitest" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import tsconfigPaths from 'vite-tsconfig-paths';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tsconfigPaths()],
  server: {
    open: true,
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          react: ['react', 'react-dom', 'react-router-dom'],

          mui: [
            '@mui/material',
            '@mui/system',
            '@emotion/react',
            '@emotion/styled',
          ],

          icons: ['@mui/icons-material'],

          font: ['@fontsource/roboto'],

          firebase: ['firebase/app', 'firebase/auth', 'firebase/firestore'],

          dropzone: ['react-dropzone'],

          notifications: ['sonner'],

          misc: ['@zl-asica/react'],
        },
      },
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    include: ['src/**/*.test.{ts,tsx}'], // Include test files
    reporters: process.env.GITHUB_ACTIONS ? ['dot', 'github-actions'] : ['dot'],
  },
});
