import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { visualizer } from "rollup-plugin-visualizer";
import { createHtmlPlugin } from "vite-plugin-html";
import checker from "vite-plugin-checker";
import { componentTagger } from "lovable-tagger";
import { networkInterfaces } from "os";
import os from 'os';

// Fonction pour obtenir l'IP locale avec vérification de sécurité
const getLocalIP = (): string => {
  const interfaces = networkInterfaces();

  for (const name of Object.keys(interfaces)) {
    const ifaceList = interfaces[name];
    if (!ifaceList) continue;

    for (const iface of ifaceList) {
      if (iface.family === "IPv4" && !iface.internal) {
        return iface.address;
      }
    }
  }
  return "localhost";
};

function getLocalExternalIP() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]!) {
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  return 'localhost';
}

const localIP = getLocalExternalIP();

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const apiBaseUrl = env.VITE_API_BASE_URL || `http://${getLocalIP()}:5000/api`;

  return {
    server: {
      host: "0.0.0.0",
      port: parseInt(env.VITE_PORT || "8080"),
      strictPort: true,
      open: false,
      hmr: {
        protocol: "ws",
        host: "localhost",
      },
      proxy: {
        "/api": {
          target: apiBaseUrl,
          changeOrigin: true,
          secure: false,
          rewrite: (path) => path.replace(/^\/api/, ""),
        },
      },
    },
    preview: {
      port: 8080,
      host: "0.0.0.0",
    },
    plugins: [
      react(),
      mode === "development" && componentTagger(),
      createHtmlPlugin({
        minify: true,
        inject: {
          data: {
            title: env.VITE_APP_TITLE || "My React App",
            description: env.VITE_APP_DESCRIPTION || "React Application",
          },
        },
      }),
      //checker({
      //typescript: true,
      //eslint: {
      //lintCommand: 'eslint "./src/**/*.{ts,tsx}"',

      //},
      //}),
      mode === "analyze" &&
        visualizer({
          open: true,
          filename: "bundle-analysis.html",
          gzipSize: true,
          brotliSize: true,
        }),
    ].filter(Boolean),
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
        "@components": path.resolve(__dirname, "./src/components"),
        "@pages": path.resolve(__dirname, "./src/pages"),
      },
    },
    build: {
      outDir: "dist",
      assetsDir: "assets",
      emptyOutDir: true,
      sourcemap: mode !== "production",
      minify: mode === "production" ? "terser" : false,
      rollupOptions: {
        output: {
          manualChunks: {
            react: ["react", "react-dom"],
            router: ["react-router-dom"],
            vendor: ["lodash", "axios"],
          },
        },
      },
      chunkSizeWarningLimit: 1600,
    },
    optimizeDeps: {
      include: ["react", "react-dom", "react-router-dom"],
      exclude: ["js-big-decimal"],
    },
    css: {
      devSourcemap: true,
      modules: {
        localsConvention: "camelCaseOnly",
      },
    },
    define: {
      'import.meta.env.VITE_API_URL': JSON.stringify(`http://${localIP}:5000/api`),
    },
  };
});
