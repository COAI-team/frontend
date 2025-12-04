import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

const PROXY_URL = import.meta.env.VITE_PROXY_URL;

export default defineConfig({
    plugins: [react(), tailwindcss()],
    server: {
        proxy: {
            "^/(api|analysis|users)": {
                target: PROXY_URL,
                changeOrigin: true,
                secure: false
            }
        },
        host: true,
        port: 5173
    }
})
