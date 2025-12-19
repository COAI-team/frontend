import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import monacoEditorPlugin from 'vite-plugin-monaco-editor-esm';

const rootDir = new URL(".", import.meta.url).pathname;

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, rootDir, "");

  return {
    plugins: [
      react(),
      tailwindcss(),
      monacoEditorPlugin({
        languageWorkers: [
          "editorWorkerService",
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

    // Add these sections to fix worker resolution
    optimizeDeps: {
      include: [
        'monaco-editor/esm/vs/editor/editor.worker',
        'monaco-editor/esm/vs/editor/editorWorkerService.js',
        'monaco-editor/esm/vs/language/typescript/ts.worker',
        'monaco-editor/esm/vs/language/json/json.worker',
        'monaco-editor/esm/vs/language/css/css.worker',
        'monaco-editor/esm/vs/language/html/html.worker',
      ]
    },

    build: {
      rollupOptions: {
        output: {
          manualChunks: {
            monaco: ['monaco-editor']
          }
        }
      }
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
