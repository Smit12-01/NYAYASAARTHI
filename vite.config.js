import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import os from 'os'

function getLocalIp() {
  const nets = os.networkInterfaces()
  for (const name of Object.keys(nets)) {
    for (const net of nets[name]) {
      if (net.family === 'IPv4' && !net.internal) return net.address
    }
  }
  return 'localhost'
}

const localIp = getLocalIp()
console.log(`\n[Vite] Local network IP: ${localIp}\n`)

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true,   // expose to LAN so phones can access it
  },
  define: {
    // Injected at build time so the frontend knows the real LAN IP
    __LOCAL_IP__: JSON.stringify(localIp),
  },
})
