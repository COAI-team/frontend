/* eslint-env node */
/* global process */

import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import monacoPkg from "vite-plugin-monaco-editor";
import fs from "node:fs";
import path from "node:path";

// 🔑 CJS → ESM 안전 변환
const monacoEditorPlugin =
  monacoPkg?.monacoEditorPlugin ??
  monacoPkg?.default ??
  monacoPkg;

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");

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
