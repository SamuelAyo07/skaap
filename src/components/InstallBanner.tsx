import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Download, X } from "lucide-react";
import skaapIcon from "@/assets/skaap-icon.png";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const DISMISS_KEY = "skaap_install_dismissed";

const InstallBanner = () => {
  const [show, setShow] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // Don't show if already installed as PWA
    if (window.matchMedia("(display-mode: standalone)").matches) return;
    // Don't show if dismissed recently (7 days)
    const dismissed = localStorage.getItem(DISMISS_KEY);
    if (dismissed && Date.now() - Number(dismissed) < 7 * 24 * 60 * 60 * 1000) return;

    // Detect iOS Safari
    const ua = navigator.userAgent;
    const isiOS = /iPad|iPhone|iPod/.test(ua) && !(window as any).MSStream;
    setIsIOS(isiOS);

    if (isiOS) {
      // Show after a short delay on iOS
      const t = setTimeout(() => setShow(true), 3000);
      return () => clearTimeout(t);
    }

    // Android/Chrome: listen for beforeinstallprompt
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setTimeout(() => setShow(true), 2000);
    };
    window.addEventListener("beforeinstallprompt", handler);
    // Fallback: show generic instructions after 5s if no prompt fired
    const fallback = setTimeout(() => setShow(true), 5000);
    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
      clearTimeout(fallback);
    };
  }, []);


  const handleInstall = async () => {
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === "accepted") setShow(false);
      setDeferredPrompt(null);
    }
  };

  const handleDismiss = () => {
    setShow(false);
    localStorage.setItem(DISMISS_KEY, String(Date.now()));
  };

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: "spring", stiffness: 260, damping: 25 }}
          className="fixed bottom-4 left-3 right-3 z-[9999] rounded-2xl p-4 shadow-xl"
          data-install-banner
          style={{ background: "#0A1220", border: "1px solid rgba(255,255,255,0.08)" }}
        >
          <button onClick={handleDismiss} className="absolute top-3 right-3 p-1 rounded-full" style={{ color: "rgba(255,255,255,0.4)" }}>
            <X size={16} />
          </button>

          <div className="flex items-center gap-3">
            <img src={skaapIcon} alt="SKAAP" className="w-12 h-12 rounded-xl flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-white text-sm tracking-tight">Install SKAAP</h3>
              <p className="text-[11px] mt-0.5" style={{ color: "rgba(255,255,255,0.5)" }}>
                {isIOS
                  ? "Tap Share (📤) then \"Add to Home Screen\""
                  : "Add to your home screen for the full experience"}
              </p>
            </div>

            {!isIOS && deferredPrompt && (
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={handleInstall}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold flex-shrink-0"
                style={{ background: "#E8314A", color: "#fff" }}
              >
                <Download size={14} /> Install
              </motion.button>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default InstallBanner;
