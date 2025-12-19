import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import monacoEditorPlugin from "vite-plugin-monaco-editor";
import fs from "node:fs";
import path from "node:path";
import process from "next/dist/build/webpack/loaders/resolve-url-loader/lib/postcss.d.ts";

/* eslint-env node */
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
      // https: {
      //   key: fs.readFileSync(
      //     path.resolve(process.cwd(), "localhost-key.pem")
      //   ),
      //   cert: fs.readFileSync(
      //     path.resolve(process.cwd(), "localhost-cert.pem")
      //   )
      // },
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
