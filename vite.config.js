import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import monacoEditorPlugin from "vite-plugin-monaco-editor-esm";

const rootDir = new URL(".", import.meta.url).pathname;

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, rootDir, "");

  return {
    plugins: [
      react(),
      tailwindcss(),
      monacoEditorPlugin({
        languageWorkers: [
          "typescript",
          "json",
          "css",
          "html",
        ],
      }),
    ],

    define: {
      global: "window",
    },

    // ✅ Monaco는 chunk 분리만 하면 충분
    build: {
      rollupOptions: {
        output: {
          manualChunks: {
            monaco: ["monaco-editor"],
          },
        },
      },
    },

    server: {
      proxy: {
        "^/(api|analysis|users)": {
          target: env.VITE_PROXY_URL || "http://localhost:9443",
          changeOrigin: true,
          secure: false,
        },
      },
      host: true,
      port: 5173,
    },
  };
});
