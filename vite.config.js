import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
    plugins: [react(), tailwindcss()],
    server: {
        proxy: {
            "^/(api|analysis|users)": {
                // target: "http://localhost:8090",
                target: "https://localhost:9443",
                changeOrigin: true,
                secure: false
            }
        },
        host: true,
        port: 5173
    }
})