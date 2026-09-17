import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'
import { viteSingleFile } from 'vite-plugin-singlefile'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(), viteSingleFile()],
  build: {
    // Everything is inlined into a single HTML file, so there is nothing
    // left to reference from outside it — safe to disable the warning.
    chunkSizeWarningLimit: 10000,
  },
})
