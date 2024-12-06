import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import tsconfigPaths from 'vite-tsconfig-paths';
import checker from 'vite-plugin-checker';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tsconfigPaths(), checker({ typescript: true })],
  server: {
    open: true,
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          react: ['react', 'react-dom', 'react-router-dom'],

          mui: ['@mui/material', '@emotion/react', '@emotion/styled'],

          icons: ['@mui/icons-material'],

          dropzone: ['react-dropzone'],

          notifications: ['sonner'],

          misc: ['@zl-asica/react'],
        },
      },
    },
  },
});
