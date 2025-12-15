import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import fs from "node:fs";
import path from "node:path";

/* eslint-env node */
export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, import.meta.dirname, '');

    return {
        plugins: [react(), tailwindcss()],
        define: {
            global: 'window'
        },
        server: {
            https: {
                key: fs.readFileSync(path.resolve(import.meta.dirname, "localhost-key.pem")),
                cert: fs.readFileSync(path.resolve(import.meta.dirname, "localhost-cert.pem")),
            },
            proxy: {
                "^/(api|analysis|users)": {
                    target: env.VITE_PROXY_URL || "http://localhost:9443",
                    changeOrigin: true,
                    secure: false
                }
            },
            host: true,
            port: 5173
        }
    };
});