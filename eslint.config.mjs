import antfu from '@antfu/eslint-config'

export default antfu({
  ignores: [
    'eslint.config.mjs',
    'src/routeTree.gen.ts',
    'src/components/ui/**.tsx',
  ],
  typescript: {
    tsconfigPath: 'tsconfig.json',
  },
  formatters: true,
  react: true,
  lessOpinionated: true,
  rules: {
    // For JSON-LD we need to allow the use of `dangerouslySetInnerHTML`
    'react-dom/no-dangerously-set-innerhtml': 'off',
  },
}, {
  files: ['src/routes/**/*.{ts,tsx}'],
  rules: {
    'react-refresh/only-export-components': 'off',
  },
})
