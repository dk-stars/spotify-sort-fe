import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
const nodeCrypto = require('crypto')

if (typeof nodeCrypto.getRandomValues !== 'function' && nodeCrypto.webcrypto?.getRandomValues) {
  nodeCrypto.getRandomValues = nodeCrypto.webcrypto.getRandomValues.bind(nodeCrypto.webcrypto)
}

if (!globalThis.crypto && nodeCrypto.webcrypto) {
  globalThis.crypto = nodeCrypto.webcrypto as Crypto
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const apiProxyTarget = env.VITE_API_PROXY_TARGET || 'http://127.0.0.1:8080'
  const devServerHost = env.VITE_DEV_SERVER_HOST || '0.0.0.0'
  const devServerPort = Number(env.VITE_DEV_SERVER_PORT || '3000')

  return {
    plugins: [react()],
    server: {
      host: devServerHost,
      port: devServerPort,
      proxy: {
        '/api': {
          target: apiProxyTarget,
          changeOrigin: true,
          secure: false,
        },
      },
    },
    build: {
      target: 'es2020',
      sourcemap: false,
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes('node_modules/react') || id.includes('node_modules/react-dom')) {
              return 'vendor-react'
            }
            if (id.includes('node_modules/react-router-dom') || id.includes('node_modules/react-router')) {
              return 'vendor-router'
            }
            if (id.includes('node_modules/@reduxjs') || id.includes('node_modules/react-redux') || id.includes('node_modules/redux')) {
              return 'vendor-redux'
            }
            if (id.includes('node_modules/axios')) {
              return 'vendor-http'
            }
          },
        },
      },
    },
  }
})
