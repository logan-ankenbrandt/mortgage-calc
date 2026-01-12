import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    proxy: {
      '/api/fred': {
        target: 'https://api.stlouisfed.org',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/fred/, '/fred'),
      },
      '/api/rss/mortgagenews': {
        target: 'https://www.mortgagenewsdaily.com',
        changeOrigin: true,
        rewrite: () => '/mortgage-rates-feed',
      },
      '/api/rss/housingwire': {
        target: 'https://www.housingwire.com',
        changeOrigin: true,
        rewrite: () => '/feed/',
      },
      '/api/rss/calculatedrisk': {
        target: 'https://www.calculatedriskblog.com',
        changeOrigin: true,
        rewrite: () => '/feeds/posts/default?alt=rss',
      },
    },
  },
})
