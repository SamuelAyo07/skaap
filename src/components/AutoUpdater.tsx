import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { RefreshCw } from "lucide-react";

/**
 * AutoUpdater
 * - Polls the service worker for updates every 60s and on tab focus
 * - When a new SW is installed and waiting, asks it to skipWaiting
 * - On controllerchange, reloads the page so the user sees the newest build
 * - Shows a tiny "Updating to the latest version…" toast for transparency
 *
 * Production-only: service workers are not registered in preview/iframe.
 */
const AutoUpdater = () => {
  const [showToast, setShowToast] = useState(false);
  const reloadingRef = useRef(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("serviceWorker" in navigator)) return;

    // Skip in iframes / Lovable preview hosts
    const isInIframe = (() => {
      try {
        return window.self !== window.top;
      } catch {
        return true;
      }
    })();
    const isPreviewHost =
      window.location.hostname.includes("id-preview--") ||
      window.location.hostname.includes("lovableproject.com");
    if (isInIframe || isPreviewHost) return;

    let pollTimer: number | undefined;

    const promote = (reg: ServiceWorkerRegistration) => {
      const waiting = reg.waiting;
      if (waiting) {
        setShowToast(true);
        waiting.postMessage({ type: "SKIP_WAITING" });
      }
    };

    const watch = (reg: ServiceWorkerRegistration) => {
      // If a worker is already waiting on first load, activate it
      promote(reg);

      reg.addEventListener("updatefound", () => {
        const installing = reg.installing;
        if (!installing) return;
        installing.addEventListener("statechange", () => {
          if (installing.state === "installed" && navigator.serviceWorker.controller) {
            promote(reg);
          }
        });
      });

      // Poll for updates every 60s
      pollTimer = window.setInterval(() => {
        reg.update().catch(() => {});
      }, 60_000);

      // Check on tab focus / visibility
      const onFocus = () => reg.update().catch(() => {});
      window.addEventListener("focus", onFocus);
      document.addEventListener("visibilitychange", () => {
        if (document.visibilityState === "visible") onFocus();
      });
    };

    navigator.serviceWorker.getRegistration().then((reg) => {
      if (reg) watch(reg);
    });
    navigator.serviceWorker.ready.then(watch).catch(() => {});

    // When the new SW takes control, reload exactly once
    const onControllerChange = () => {
      if (reloadingRef.current) return;
      reloadingRef.current = true;
      window.location.reload();
    };
    navigator.serviceWorker.addEventListener("controllerchange", onControllerChange);

    return () => {
      if (pollTimer) clearInterval(pollTimer);
      navigator.serviceWorker.removeEventListener("controllerchange", onControllerChange);
    };
  }, []);

  return (
    <AnimatePresence>
      {showToast && (
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
          className="fixed top-3 left-1/2 -translate-x-1/2 z-[10000] pointer-events-none"
        >
          <div
            className="flex items-center gap-2 px-3.5 py-2 rounded-full text-[12px] font-semibold text-white shadow-lg"
            style={{
              background: "rgba(10, 18, 32, 0.92)",
              backdropFilter: "blur(20px)",
              WebkitBackdropFilter: "blur(20px)",
            }}
          >
            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            Updating to the latest version…
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default AutoUpdater;
