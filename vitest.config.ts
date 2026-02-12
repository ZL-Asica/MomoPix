import viteTsConfigPaths from 'vite-tsconfig-paths'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [
    viteTsConfigPaths({
      projects: ['./tsconfig.json'],
    }),
  ],
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
    exclude: [
      'node_modules/**',
      'dist/**',
      'docs/**',
      'src/routes/**',
      'src/functions/**',
      'src/middleware/**',
    ],
  },
})
