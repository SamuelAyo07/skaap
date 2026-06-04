import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { lovable } from "@/integrations/lovable";
import { toast } from "sonner";

interface AuthSheetProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function AuthSheet({ open, onClose }: AuthSheetProps) {
  const [loading, setLoading] = useState<"google" | "apple" | null>(null);

  const handleOAuth = async (provider: "google" | "apple") => {
    setLoading(provider);
    try {
      const result = await lovable.auth.signInWithOAuth(provider, {
        redirect_uri: window.location.origin + "/scan",
      });
      if (result?.error) {
        toast.error("Couldn't sign in. Try again.");
        setLoading(null);
      }
      // On success the browser redirects; nothing else to do.
    } catch {
      toast.error("Couldn't sign in. Try again.");
      setLoading(null);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-[90] flex items-end justify-center"
          onClick={onClose}
        >
          <div className="absolute inset-0" style={{
            background: "rgba(0,0,0,0.5)",
            backdropFilter: "blur(8px)",
            WebkitBackdropFilter: "blur(8px)",
          }} />

          <motion.div
            initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 26, stiffness: 200 }}
            className="relative w-full rounded-t-[28px] z-10 overflow-hidden"
            style={{
              maxWidth: 430,
              background: "rgba(10,15,30,0.95)",
              backdropFilter: "blur(40px) saturate(200%)",
              WebkitBackdropFilter: "blur(40px) saturate(200%)",
              borderTop: "1px solid rgba(255,255,255,0.15)",
            }}
            onClick={e => e.stopPropagation()}
          >
            <button onClick={onClose}
              className="absolute top-3 right-4 z-10 w-10 h-10 flex items-center justify-center rounded-full glass-pill"
              aria-label="Close">
              <X size={18} style={{ color: "rgba(255,255,255,0.6)" }} />
            </button>

            <div className="flex justify-center pt-3">
              <div style={{ width: 36, height: 4, borderRadius: 99, background: "rgba(255,255,255,0.2)" }} />
            </div>

            <div className="px-6 pt-6 pb-8">
              <h2 className="font-extrabold text-2xl text-white text-center">
                Sign in to SKAAP
              </h2>
              <p className="text-[14px] text-center mt-1" style={{ color: "rgba(255,255,255,0.55)" }}>
                One tap. No passwords. No email link.
              </p>

              <div className="mt-6 space-y-3">
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  disabled={!!loading}
                  onClick={() => handleOAuth("google")}
                  className="w-full font-bold text-[15px] flex items-center justify-center gap-2.5"
                  style={{
                    height: 54, borderRadius: 16, background: "#FFFFFF", color: "#0A1220",
                    opacity: loading === "google" ? 0.7 : 1,
                  }}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.99.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z"/></svg>
                  {loading === "google" ? "Opening Google…" : "Continue with Google"}
                </motion.button>

                <motion.button
                  whileTap={{ scale: 0.97 }}
                  disabled={!!loading}
                  onClick={() => handleOAuth("apple")}
                  className="w-full font-bold text-[15px] flex items-center justify-center gap-2.5 text-white"
                  style={{
                    height: 54, borderRadius: 16, background: "#000000",
                    opacity: loading === "apple" ? 0.7 : 1,
                  }}
                >
                  <svg width="16" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/></svg>
                  {loading === "apple" ? "Opening Apple…" : "Continue with Apple"}
                </motion.button>
              </div>

              <p className="mt-5 text-[11px] text-center" style={{ color: "rgba(255,255,255,0.35)" }}>
                We never share your details. No spam, ever.
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
