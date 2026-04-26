import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { VitePWA } from "vite-plugin-pwa";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
  },
  plugins: [
    react(),
    mode === "development" && componentTagger(),
    VitePWA({
      registerType: "prompt",
      includeAssets: ["favicon.ico", "skaap-icon-192.png", "skaap-icon-512.png"],
      workbox: {
        navigateFallbackDenylist: [/^\/~oauth/],
        globPatterns: ["**/*.{js,css,html,ico,png,jpg,svg,woff2}"],
        cleanupOutdatedCaches: true,
        clientsClaim: true,
        skipWaiting: false,
      },
      manifest: {
        name: "SKAAP — Food Intelligence",
        short_name: "SKAAP",
        description: "Scan any product. Know what's really inside.",
        theme_color: "#b42318",
        background_color: "#ffffff",
        display: "standalone",
        orientation: "portrait",
        start_url: "/scan",
        scope: "/",
        icons: [
          { src: "/skaap-icon-192.png", sizes: "192x192", type: "image/png" },
          { src: "/skaap-icon-512.png", sizes: "512x512", type: "image/png" },
          { src: "/skaap-icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
        ],
      },
    }),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
