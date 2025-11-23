import {defineConfig} from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
    plugins: [react(), tailwindcss()],
    server: {
        proxy: {
            "/api": {
                target: "https://114.204.9.108:10443",
                changeOrigin: true,
                secure: false,
                rewrite: (p) => p.replace(/^\/api/, "")
            }
        }
    }
})
