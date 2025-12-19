import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { monacoEditorPlugin } from "vite-plugin-monaco-editor";

// ✅ process 없이 cwd 계산
const rootDir = new URL(".", import.meta.url).pathname;

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, rootDir, "");

  return {
    plugins: [
      react(),
      tailwindcss(),
      monacoEditorPlugin({
        languageWorkers: [
          "json",
          "typescript",
          "javascript",
          "css",
          "html",
        ],
      }),
    ],

    // ✅ Node global 참조 방지
    define: {
      global: "window",
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
