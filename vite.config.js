/* eslint-env node */
/* global process */

import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import MonacoEditorPlugin from "vite-plugin-monaco-editor";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");

  return {
    plugins: [
      react(),
      tailwindcss(),
      MonacoEditorPlugin({
        languageWorkers: [
          "json",
          "typescript",
          "javascript",
          "css",
          "html"
        ]
      })
    ],
    define: {
      global: "window"
    },
    server: {
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
