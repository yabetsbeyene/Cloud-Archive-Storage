import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

const requiredProductionVariables = [
  'VITE_API_BASE_URL',
  'VITE_KEYCLOAK_URL',
  'VITE_KEYCLOAK_REALM',
  'VITE_KEYCLOAK_CLIENT_ID',
] as const

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  if (mode === 'production') {
    const env = loadEnv(mode, process.cwd(), '')
    const missing = requiredProductionVariables.filter((key) => !env[key]?.trim())

    if (missing.length > 0) {
      throw new Error(`Missing required production environment variables: ${missing.join(', ')}`)
    }
  }

  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    server: {
      port: 5173,
    },
  }
})
