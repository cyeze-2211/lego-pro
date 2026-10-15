import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { execSync } from 'child_process'

// Build belgisi: UI da (profil menyusi) va konsolda ko‘rinadi — prodda qaysi sborka turganini aniqlash uchun
const gitHash = (() => {
  try { return execSync('git rev-parse --short HEAD', { stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim(); } catch { return 'nogit'; }
})();
const buildTime = new Date().toISOString();

export default defineConfig({
  plugins: [react()],
  define: {
    __APP_BUILD__: JSON.stringify({ hash: gitHash, time: buildTime }),
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
})
