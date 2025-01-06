import antfu from '@antfu/eslint-config'

export default antfu(
  {
    ignores: [
      'dist',
      'src/vite-env.d.ts',
      'eslint.config.mjs',
      'prettier.config.cjs',
      'src/**/*.d.ts',
      'vite.config.ts',
      'vitest.config.ts',
      'setup_firebase.mjs',
      'backend',
      'functions',
    ],
    react: true,
    typescript: {
      tsconfigPath: 'tsconfig.app.json',
    },
    formatters: {
      css: true,
      html: true,
    },
    lessOpinionated: true,
  }
)
