import { defineConfig } from 'tsup'

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    stream: 'src/stream.ts',
    state: 'src/state.ts',
  },
  format: ['esm'],
  dts: true,
  sourcemap: true,
  clean: true,
  target: 'es2022',
  external: [
    '@tangle-network/agent-app',
    '@tangle-network/agent-app/runtime',
    'react',
    'react-native',
  ],
})
