import { zlAsicaTs } from 'eslint-config-zl-asica';

export default [
  ...zlAsicaTs,
  {
    ignores: ['dist'],
  },
  {
    files: ['api/**/*.{ts,tsx}'],
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
];
