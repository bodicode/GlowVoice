import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    {
      name: 'force-exit-on-build-complete',
      apply: 'build',
      closeBundle() {
        // Force the process to exit after the bundle is generated
        setTimeout(() => process.exit(0), 0);
      }
    }
  ],
})
