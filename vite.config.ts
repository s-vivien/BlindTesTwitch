import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import basicSsl from '@vitejs/plugin-basic-ssl';

export default defineConfig(({ command }) => ({
  plugins: [react(), command === 'serve' && basicSsl()],
  base: '/BlindTesTwitch/',
  server: {
    port: 3000,
    host: '127.0.0.1',
  },
  css: {
    preprocessorOptions: {
      scss: {
        silenceDeprecations: [
          'import',
          'global-builtin',
          'color-functions',
          'if-function',
        ],
      },
    },
  },
  resolve: {
    alias: {
      components: '/src/components',
      services: '/src/services',
      helpers: '/src/helpers',
      pkce: '/src/pkce',
    },
  },
  build: {
    outDir: 'build',
  },
}));
