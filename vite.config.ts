import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { VitePWA } from "vite-plugin-pwa";

const buildId = new Date().toISOString();

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
  },
  define: {
    __SKAAP_BUILD_ID__: JSON.stringify(buildId),
  },
  plugins: [
    react(),
    mode === "development" && componentTagger(),
    VitePWA({
      injectRegister: false,
      registerType: "autoUpdate",
      devOptions: { enabled: false },
      includeAssets: ["favicon.ico", "skaap-icon-192.png", "skaap-icon-512.png"],
      workbox: {
        navigateFallback: "/index.html",
        navigateFallbackDenylist: [/^\/~oauth/, /^\/api\//, /\/functions\/v1\//],
        globPatterns: ["**/*.{js,css,ico,png,jpg,svg,woff2}"],
        cleanupOutdatedCaches: true,
        clientsClaim: true,
        skipWaiting: true,
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
        runtimeCaching: [
          // Open Food Facts / Beauty Facts / USDA product JSON — stale-while-revalidate
          {
            urlPattern: /^https:\/\/(world\.openfoodfacts|world\.openbeautyfacts|api\.nal\.usda)\.(org|gov)\/.*/i,
            handler: "StaleWhileRevalidate",
            options: {
              cacheName: "skaap-product-api",
              expiration: { maxEntries: 500, maxAgeSeconds: 60 * 60 * 24 * 30 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          // Product images — long cache
          {
            urlPattern: /^https:\/\/(images\.openfoodfacts|static\.openfoodfacts|images\.openbeautyfacts)\.(org|net)\/.*\.(?:png|jpg|jpeg|webp|avif)$/i,
            handler: "CacheFirst",
            options: {
              cacheName: "skaap-product-images",
              expiration: { maxEntries: 800, maxAgeSeconds: 60 * 60 * 24 * 60 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          // Supabase REST (scan history, stores, profile) — network-first w/ fallback
          {
            urlPattern: /^https:\/\/[a-z0-9-]+\.supabase\.co\/rest\/v1\/(scan_history|stores|nearby_stores|deals|community_scans)/i,
            handler: "NetworkFirst",
            options: {
              cacheName: "skaap-supabase-data",
              networkTimeoutSeconds: 4,
              expiration: { maxEntries: 200, maxAgeSeconds: 60 * 60 * 24 * 7 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          // Google Fonts / CDN fonts
          {
            urlPattern: /^https:\/\/fonts\.(gstatic|googleapis)\.com\/.*/i,
            handler: "CacheFirst",
            options: {
              cacheName: "skaap-fonts",
              expiration: { maxEntries: 30, maxAgeSeconds: 60 * 60 * 24 * 365 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
      manifest: {
        name: "SKAAP — Know what's in your food",
        short_name: "SKAAP",
        description: "Scan any food or beauty product and get an instant health score, additive breakdown, and healthier alternatives.",
        theme_color: "#0A0F1E",
        background_color: "#0A0F1E",
        display: "standalone",
        display_override: ["standalone", "minimal-ui"],
        orientation: "portrait",
        start_url: "/scan?source=pwa",
        id: "/scan",
        scope: "/",
        lang: "en",
        dir: "ltr",
        categories: ["health", "food", "lifestyle", "shopping"],
        icons: [
          { src: "/skaap-icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
          { src: "/skaap-icon-192.png", sizes: "192x192", type: "image/png", purpose: "maskable" },
          { src: "/skaap-icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
          { src: "/skaap-icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
        ],
        shortcuts: [
          { name: "Scan a product", short_name: "Scan", url: "/scan?action=scan", icons: [{ src: "/skaap-icon-192.png", sizes: "192x192" }] },
          { name: "My history", short_name: "History", url: "/scan?tab=history", icons: [{ src: "/skaap-icon-192.png", sizes: "192x192" }] },
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
