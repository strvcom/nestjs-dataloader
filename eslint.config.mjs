import { defineConfig } from 'eslint/config'
import node from '@strv/eslint-config-node'
import nodeoptional from '@strv/eslint-config-node/optional'
import nodestyle from '@strv/eslint-config-node/style'
import ts from '@strv/eslint-config-typescript'
import tsoptional from '@strv/eslint-config-typescript/optional'
import tsstyle from '@strv/eslint-config-typescript/style'

const globs = {
  js: '**/*.js',
  cjs: '**/*.cjs',
  mjs: '**/*.mjs',
  ts: '**/*.ts',
  dts: '**/*.d.ts',
}
const ignores = [
  globs.js,
  globs.dts,
  'node_modules',
]

export default defineConfig([
  { ignores },
  { files: [globs.ts, globs.mjs, globs.cjs, globs.js],
    extends: [
      node,
      nodeoptional,
      nodestyle,
    ] },
  { files: [globs.ts],
    extends: [
      ts,
      tsoptional,
      tsstyle,
    ] },
  { rules: {
    'import/no-unresolved': 'off',
  } },
  { files: ['**/*.test.ts'],
    rules: {
      'max-classes-per-file': 'off',
    } },
])
