import antfu from '@antfu/eslint-config'

export default antfu({
  formatters: true,
  react: true,
  nextjs: true,
  ignores: ['cloudflare-env.d.ts', 'src/components/ui/**.tsx'],
  typescript: {
    tsconfigPath: 'tsconfig.json',
  },
  lessOpinionated: true,
  rules: {
    // For Next.js JSON-LD we need to allow the use of `dangerouslySetInnerHTML`
    'react-dom/no-dangerously-set-innerhtml': 'off',
  },
})
