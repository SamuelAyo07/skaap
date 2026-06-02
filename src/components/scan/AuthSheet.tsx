import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Mail } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface AuthSheetProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function AuthSheet({ open, onClose, onSuccess }: AuthSheetProps) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async () => {
    const trimmed = email.trim();
    if (!trimmed || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(trimmed)) {
      toast.error("Enter a valid email");
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: trimmed,
        options: { emailRedirectTo: window.location.origin + "/scan" },
      });
      if (error) {
        toast.error(error.message || "Couldn't send link. Try again.");
      } else {
        setSent(true);
        toast.success("Check your email for a sign-in link");
        onSuccess?.();
      }
    } catch {
      toast.error("Something went wrong. Try again.");
    }
    setLoading(false);
  };

  const close = () => {
    setSent(false);
    setEmail("");
    onClose();
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-[90] flex items-end justify-center"
          onClick={close}
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
            <button onClick={close}
              className="absolute top-3 right-4 z-10 w-10 h-10 flex items-center justify-center rounded-full glass-pill"
              aria-label="Close">
              <X size={18} style={{ color: "rgba(255,255,255,0.6)" }} />
            </button>

            <div className="flex justify-center pt-3">
              <div style={{ width: 36, height: 4, borderRadius: 99, background: "rgba(255,255,255,0.2)" }} />
            </div>

            <div className="px-6 pt-6 pb-8">
              <h2 className="font-extrabold text-2xl text-white text-center">
                {sent ? "Check your email" : "Sign in to SKAAP"}
              </h2>
              <p className="text-[14px] text-center mt-1" style={{ color: "rgba(255,255,255,0.55)" }}>
                {sent
                  ? `We sent a sign-in link to ${email}`
                  : "Just your email. No password."}
              </p>

              {!sent && (
                <>
                  <div className="mt-6">
                    <div className="flex items-center gap-3 px-4 h-12 rounded-2xl glass-pill">
                      <Mail size={18} style={{ color: "rgba(255,255,255,0.4)" }} />
                      <input
                        type="email"
                        placeholder="you@email.com"
                        value={email}
                        autoFocus
                        inputMode="email"
                        autoComplete="email"
                        onChange={e => setEmail(e.target.value)}
                        onKeyDown={e => e.key === "Enter" && handleSubmit()}
                        className="flex-1 bg-transparent text-sm text-white outline-none placeholder:text-white/30"
                      />
                    </div>
                  </div>

                  <motion.button
                    whileTap={{ scale: 0.97 }}
                    onClick={handleSubmit}
                    disabled={loading}
                    className="w-full mt-5 font-bold text-[15px] text-white flex items-center justify-center"
                    style={{
                      height: 52,
                      borderRadius: 16,
                      background: "linear-gradient(135deg, #C41E3A, #9E1830)",
                      opacity: loading ? 0.7 : 1,
                    }}
                  >
                    {loading ? "Sending..." : "Email me a sign-in link"}
                  </motion.button>

                  <p className="mt-4 text-[11px] text-center" style={{ color: "rgba(255,255,255,0.35)" }}>
                    No spam. We don't share your email. Ever.
                  </p>
                </>
              )}

              {sent && (
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={close}
                  className="w-full mt-6 font-bold text-[15px] text-white flex items-center justify-center"
                  style={{
                    height: 52,
                    borderRadius: 16,
                    background: "linear-gradient(135deg, #C41E3A, #9E1830)",
                  }}
                >
                  Got it
                </motion.button>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
