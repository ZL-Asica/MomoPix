import globals from 'globals';

import { zlAsicaTsReactConfig } from 'eslint-config-zl-asica';

export default [
  ...zlAsicaTsReactConfig,
  {
    ignores: [
      'dist',
      'src/vite-env.d.ts',
      'eslint.config.mjs',
      'prettier.config.cjs',
    ],
  },
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
      parserOptions: {
        project: './tsconfig.app.json',
        projectService: true,
      },
    },
    rules: {
      'unicorn/filename-case': 'off',
    },
  },
];
