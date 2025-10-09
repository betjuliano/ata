import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

// Proxy/HMR-aware server config for Traefik
const PORT = Number(process.env.VITE_PORT || process.env.PORT || 3000)
const HMR_HOST = process.env.HMR_HOST || process.env.DOMAIN
const HMR_PROTOCOL = process.env.HMR_PROTOCOL || 'wss'
const HMR_CLIENT_PORT = process.env.HMR_CLIENT_PORT
  ? Number(process.env.HMR_CLIENT_PORT)
  : (HMR_PROTOCOL === 'wss' ? 443 : 80)

const server = {
  port: PORT,
  host: true,
}

if (HMR_HOST) {
  server.hmr = {
    host: HMR_HOST,
    protocol: HMR_PROTOCOL,
    clientPort: HMR_CLIENT_PORT,
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server,
})
