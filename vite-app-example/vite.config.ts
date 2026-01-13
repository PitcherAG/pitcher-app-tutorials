import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import path from 'path'
import appJson from './public/app.json'

export default defineConfig((config) => {
  const isDev = config.mode !== 'production'

  return {
    define: {
      VITE_APP_NAME: JSON.stringify(appJson.name),
      VITE_APP_VERSION: JSON.stringify(appJson.version),
    },
    base: isDev ? '/' + appJson.name : '',
    server: {
      port: 6020,
      hmr: { port: 6021 },
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    plugins: [react()],
    build: {
      outDir: 'dist',
      sourcemap: isDev,
    },
  }
})
