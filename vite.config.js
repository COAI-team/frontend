import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
    plugins: [react(), tailwindcss()],
    server: {
        proxy: {
            "^/(api|analysis|users)": {
<<<<<<< HEAD
                target: "https://localhost:8090",
=======
                target: "https://localhost:9443",
>>>>>>> ceff4224a7edc64ae9459240f2dd064542b9a955
                changeOrigin: true,
                secure: false
            }
        },
        host: true,
        port: 5173
    }
})