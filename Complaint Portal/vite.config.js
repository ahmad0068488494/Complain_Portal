import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        // Use IPv4 explicitly to match the verified local backend endpoint.
        target: 'http://127.0.0.1:5000',
        changeOrigin: true,
      },
    },
  },
})
