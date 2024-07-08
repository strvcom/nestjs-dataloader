import * as vitest from 'vitest/config'

export default vitest.defineConfig({
  test: {
    env: {
      NODE_ENV: 'test',
    },
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'json'],
      enabled: true,
    },
    fileParallelism: false,
    include: ['**/*.test.ts'],
    isolate: false,
  },
})
