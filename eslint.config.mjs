import node from '@strv/eslint-config-node'
import nodeopt from '@strv/eslint-config-node/optional'
import nodestyle from '@strv/eslint-config-node/style'
import ts from '@strv/eslint-config-typescript'
import tsopt from '@strv/eslint-config-typescript/optional'
import tsstyle from '@strv/eslint-config-typescript/style'

const globs = {
  js: '**/*.js',
  mjs: '**/*.mjs',
  ts: '**/*.ts',
  testts: '**/*.test.ts',
  dts: '**/*.d.ts',
}

/** @type {Array<import("eslint").Linter.FlatConfig>} */
const config = [
  { linterOptions: {
    reportUnusedDisableDirectives: true,
  },
  ignores: [
    globs.js,
    globs.dts,
    'node_modules',
  ] },

  { files: [globs.ts, globs.mjs], ...node },
  { files: [globs.ts, globs.mjs], ...nodeopt },
  { files: [globs.ts, globs.mjs], ...nodestyle },

  { files: [globs.ts], ...ts },
  { files: [globs.ts], ...tsopt },
  { files: [globs.ts], ...tsstyle },

  { files: [globs.ts],
    languageOptions: {
      parserOptions: { project: './tsconfig.json' },
    },
    rules: {} },

  { files: [globs.mjs, globs.ts],
    rules: {
      // We depend on TypeScript and tests to catch unresolved module paths
      'import/no-unresolved': 'off',
      'import/no-extraneous-dependencies': ['error', {
        devDependencies: [
          '*.config.{js,mjs}',
          'test/**',
        ],
      }],
    } },
  { files: [globs.testts],
    rules: {
      'id-length': 'off',
      'max-classes-per-file': 'off',
    } },
]

export default config
