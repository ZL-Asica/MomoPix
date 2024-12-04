import { zlAsicaTsReactConfig } from 'eslint-config-zl-asica';

export default [
  ...zlAsicaTsReactConfig,
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
    ],
  },
  {
    files: ['src/**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2020,
      parserOptions: {
        project: './tsconfig.app.json',
        projectService: true,
      },
    },
    rules: {
      'unicorn/filename-case': 'off',
      'unicorn/no-array-for-each': 'off',
    },
  },
];
