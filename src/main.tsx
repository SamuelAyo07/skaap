import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

declare const __SKAAP_BUILD_ID__: string;

const isInIframe = (() => {
  try {
    return window.self !== window.top;
  } catch {
    return true;
  }
})();

const isPreviewHost =
  window.location.hostname.includes("id-preview--") ||
  window.location.hostname.includes("lovableproject.com") ||
  window.location.hostname.includes("localhost") ||
  window.location.hostname.includes("127.0.0.1");

if ("serviceWorker" in navigator) {
  if (!import.meta.env.PROD || isPreviewHost || isInIframe) {
    navigator.serviceWorker.getRegistrations().then((registrations) => {
      registrations.forEach((registration) => registration.unregister());
    });
  } else {
    window.addEventListener("load", () => {
      const buildQuery = encodeURIComponent(__SKAAP_BUILD_ID__);
      navigator.serviceWorker
        .register(`/sw.js?v=${buildQuery}`, { scope: "/", updateViaCache: "none" })
        .then((registration) => registration.update())
        .catch(() => {
          // Updating should never block the app.
        });
    });
  }
}

createRoot(document.getElementById("root")!).render(<App />);
