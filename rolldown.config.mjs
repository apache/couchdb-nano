import { defineConfig } from 'rolldown';

export default defineConfig([
  {
    input: 'lib/nano.mjs',
    platform: 'node',
    output: { format: 'esm', file: 'dist/nano-esm.mjs' },
  },
  {
    input: 'lib/nano.mjs',
    platform: 'node',
    output: { format: 'cjs', file: 'dist/nano-cjs.js' },
  }
]);
