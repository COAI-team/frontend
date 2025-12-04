import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

<<<<<<< HEAD
export default defineConfig({
    plugins: [react(), tailwindcss()],
    server: {
        proxy: {
            "^/(api|analysis|users)": {
                target: "https://localhost:9443",
                changeOrigin: true,
                secure: false
            }
        },
        host: true,
        port: 5173
    }
})
=======
export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, import.meta.dirname, '');

    return {
        plugins: [react(), tailwindcss()],
        server: {
            proxy: {
                "^/(api|analysis|users)": {
                    target: env.VITE_PROXY_URL,
                    changeOrigin: true,
                    secure: false
                }
            },
            host: true,
            port: 5173
        }
    };
})
>>>>>>> 6004fe58f8911b7916882a46699f208877a9175b
