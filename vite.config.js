import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, import.meta.dirname, '');

    return {
        plugins: [react(), tailwindcss()],
        define: {
            global: 'window'
        },
        server: {
            proxy: {
                "^/(api|analysis|users)": {
                    target: env.VITE_PROXY_URL || 'http://localhost:9443',
                    changeOrigin: true,
                    secure: false
                }
            },
            host: true,
            port: 5173
        }
    };
})
