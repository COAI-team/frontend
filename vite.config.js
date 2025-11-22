import {defineConfig} from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
    plugins: [react(), tailwindcss()],
    server: {
        proxy: {
            "/api": {
                baseURL: "/api", // "https://localhost:9443/api" 이거 잠깐 내비둬줘요.. 
                changeOrigin: true,
                secure: false,
                rewrite: (p) => p.replace(/^\/api/, "")
            }
        }
    }
})
