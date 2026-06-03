import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Download, X, Share, Plus, MoreVertical } from "lucide-react";
import skaapIcon from "@/assets/skaap-icon.png";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const DISMISS_KEY = "skaap_install_dismissed";

type Platform = "ios" | "android" | "desktop";

const InstallBanner = () => {
  const [show, setShow] = useState(false);
  const [showSheet, setShowSheet] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [platform, setPlatform] = useState<Platform>("desktop");

  useEffect(() => {
    if (window.matchMedia("(display-mode: standalone)").matches) return;
    const dismissed = localStorage.getItem(DISMISS_KEY);
    if (dismissed && Date.now() - Number(dismissed) < 7 * 24 * 60 * 60 * 1000) return;

    const ua = navigator.userAgent;
    const isiOS = /iPad|iPhone|iPod/.test(ua) && !(window as any).MSStream;
    const isAndroid = /Android/i.test(ua);
    setPlatform(isiOS ? "ios" : isAndroid ? "android" : "desktop");

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", handler);

    const t = setTimeout(() => setShow(true), isiOS ? 3000 : 2500);
    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
      clearTimeout(t);
    };
  }, []);

  const handleTap = async () => {
    // Native prompt (Chrome/Edge/Android) — use it
    if (deferredPrompt) {
      try {
        await deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === "accepted") setShow(false);
        setDeferredPrompt(null);
        return;
      } catch {
        // fall through to instructions sheet
      }
    }
    // Otherwise show instructions sheet so the tap always does something
    setShowSheet(true);
  };

  const handleDismiss = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setShow(false);
    localStorage.setItem(DISMISS_KEY, String(Date.now()));
  };

  const instructions = (() => {
    if (platform === "ios") {
      return {
        title: "Add SKAAP to your Home Screen",
        steps: [
          { icon: Share, text: "Tap the Share button in Safari's toolbar (bottom of the screen)." },
          { icon: Plus, text: "Scroll and tap \"Add to Home Screen\"." },
          { icon: Download, text: "Tap \"Add\" — SKAAP will appear like a real app." },
        ],
        note: "Only works in Safari, not Chrome on iPhone.",
      };
    }
    if (platform === "android") {
      return {
        title: "Install SKAAP",
        steps: [
          { icon: MoreVertical, text: "Tap the ⋮ menu in Chrome (top right)." },
          { icon: Download, text: "Tap \"Install app\" or \"Add to Home screen\"." },
          { icon: Plus, text: "Confirm — SKAAP opens like a native app." },
        ],
        note: "Works best in Chrome, Edge or Brave on Android.",
      };
    }
    return {
      title: "Install SKAAP on desktop",
      steps: [
        { icon: Download, text: "Look for the install icon in your browser's address bar." },
        { icon: MoreVertical, text: "Or open the browser menu and choose \"Install SKAAP…\"." },
        { icon: Plus, text: "It launches in its own window, no tabs." },
      ],
      note: "Available in Chrome, Edge, Brave and Arc.",
    };
  })();

  return (
    <>
      <AnimatePresence>
        {show && (
          <motion.button
            type="button"
            onClick={handleTap}
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            transition={{ type: "spring", stiffness: 260, damping: 25 }}
            className="fixed bottom-4 left-3 right-3 z-[9999] rounded-2xl p-4 shadow-xl text-left w-auto"
            data-install-banner
            style={{ background: "#0A1220", border: "1px solid rgba(255,255,255,0.08)" }}
          >
            <span
              onClick={handleDismiss}
              role="button"
              tabIndex={0}
              className="absolute top-3 right-3 p-1 rounded-full cursor-pointer"
              style={{ color: "rgba(255,255,255,0.4)" }}
            >
              <X size={16} />
            </span>

            <div className="flex items-center gap-3">
              <img src={skaapIcon} alt="SKAAP" className="w-12 h-12 rounded-xl flex-shrink-0" />
              <div className="flex-1 min-w-0 pr-6">
                <h3 className="font-bold text-white text-sm tracking-tight">Install SKAAP</h3>
                <p className="text-[11px] mt-0.5 leading-snug" style={{ color: "rgba(255,255,255,0.6)" }}>
                  Tap to see how to add it to your {platform === "desktop" ? "browser" : "home screen"}.
                </p>
              </div>

              <span
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold flex-shrink-0"
                style={{ background: "#E8314A", color: "#fff" }}
              >
                <Download size={14} /> Install
              </span>
            </div>
          </motion.button>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showSheet && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[10000] flex items-end sm:items-center justify-center"
            style={{ background: "rgba(6,10,20,0.65)", backdropFilter: "blur(8px)" }}
            onClick={() => setShowSheet(false)}
          >
            <motion.div
              initial={{ y: 60, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 60, opacity: 0 }}
              transition={{ type: "spring", stiffness: 280, damping: 28 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full sm:max-w-sm sm:rounded-3xl rounded-t-3xl p-6 pb-8 relative"
              style={{ background: "#0A1220", border: "1px solid rgba(255,255,255,0.08)" }}
            >
              <button
                onClick={() => setShowSheet(false)}
                className="absolute top-4 right-4 p-1 rounded-full"
                style={{ color: "rgba(255,255,255,0.5)" }}
              >
                <X size={18} />
              </button>

              <div className="flex items-center gap-3 mb-5">
                <img src={skaapIcon} alt="SKAAP" className="w-12 h-12 rounded-xl" />
                <div>
                  <h3 className="font-bold text-white text-base tracking-tight">{instructions.title}</h3>
                  <p className="text-[11px]" style={{ color: "rgba(255,255,255,0.5)" }}>
                    Works offline. No app store needed.
                  </p>
                </div>
              </div>

              <ol className="space-y-3">
                {instructions.steps.map((s, i) => {
                  const Icon = s.icon;
                  return (
                    <li key={i} className="flex items-start gap-3">
                      <span
                        className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-[11px] font-bold"
                        style={{ background: "rgba(232,49,74,0.18)", color: "#FF7A8E" }}
                      >
                        {i + 1}
                      </span>
                      <div className="flex-1 flex items-center gap-2">
                        <Icon size={14} style={{ color: "rgba(255,255,255,0.5)" }} />
                        <p className="text-[13px] leading-snug text-white">{s.text}</p>
                      </div>
                    </li>
                  );
                })}
              </ol>

              <p className="text-[11px] mt-4 pt-4 leading-relaxed" style={{ color: "rgba(255,255,255,0.45)", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                {instructions.note}
              </p>

              <button
                onClick={() => { setShowSheet(false); handleDismiss(); }}
                className="w-full mt-5 py-3 rounded-2xl text-[13px] font-bold"
                style={{ background: "#E8314A", color: "#fff" }}
              >
                Got it
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default InstallBanner;
