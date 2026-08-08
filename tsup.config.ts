import { defineConfig } from 'tsup'

    export default defineConfig({
      entry: ['src/server.ts'],
      format: ['cjs'],
      target: 'node20',
      platform: 'node',
      clean: true,
      splitting: false,
      noExternal: [/.*/],  // ← bundle all dependencies into the output file
    })
