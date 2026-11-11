import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
    plugins: [vue()],
    build: {
        outDir: path.resolve(__dirname, '../server/public'),
        emptyOutDir: true // Limpa a pasta antes de cada build
    }
});
