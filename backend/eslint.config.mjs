import { zlAsicaTsConfig } from 'eslint-config-zl-asica'

export default [
  ...zlAsicaTsConfig,
  {
    ignores: [
      'dist',
      'src/vite-env.d.ts',
      'eslint.config.mjs',
      'prettier.config.cjs',
    ],
  },
  {
    files: ['src/**/*.{ts}'],
    languageOptions: {
      ecmaVersion: 2020,
      parserOptions: {
        project: './tsconfig.json',
        projectService: true,
      },
    },
    rules: {
      'unicorn/filename-case': 'off',
      'unicorn/no-array-for-each': 'off',
    },
  },
]
