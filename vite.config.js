import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // server: {
  //   host: '0.0.0.0',        // <‑‑ listen on every network interface
  //   port: 5173,             // keep the default port (or change if you wish)
  //   strictPort: true,       // fail if the port is already taken
  //   // optional: open browser on start (won’t affect mobile)
  //   open: false,
  // },
})
