import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { viteSingleFile } from "vite-plugin-singlefile"
// import { fileURLToPath } from 'url';
import path from 'path';

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue(), viteSingleFile()],
  // plugins: [vue()],
  optimizeDeps: {
    // include: ['@/src/background.ts']
  },
  resolve: {
    alias: [
      // { find: '@', replacement: fileURLToPath(new URL('./src', import.meta.url)) },
      { find: '@', replacement: path.resolve(__dirname, './src') },
    ],
  },
})
