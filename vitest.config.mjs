import * as vitest from 'vitest/config'
import swc from 'unplugin-swc'

export default vitest.defineConfig({
  plugins: [swc.vite()],
  test: {
    env: {
      NODE_ENV: 'test',
    },
    coverage: {
      provider: 'v8',
      reporter: ['html', 'json'],
      enabled: true,
    },
    fileParallelism: false,
    include: ['**/*.test.ts'],
    isolate: false,
  },
})
