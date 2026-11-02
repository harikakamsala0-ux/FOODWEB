import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // Proxy /api/* requests to the Java Tomcat backend during development.
    // This avoids CORS issues without changing the Java backend.
    // Confirmed context path from Restaurants.jsx: http://localhost:8080/FOODWEB
    proxy: {
      '/api': {
        target: 'http://localhost:8080/FOODWEB',
        changeOrigin: true,
        // /api/menu → http://localhost:8080/FOODWEB/api/menu
      },
    },
  },
})

