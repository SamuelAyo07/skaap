import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Mail, Lock, User } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";

interface AuthSheetProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function AuthSheet({ open, onClose, onSuccess }: AuthSheetProps) {
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!email || !password) return;
    setLoading(true);
    if (mode === "signup") {
      const { error } = await signUp(email, password, name);
      if (error) {
        toast.error(error.message);
      } else {
        toast.success("Check your email to verify your account");
        onClose();
        onSuccess?.();
      }
    } else {
      const { error } = await signIn(email, password);
      if (error) {
        toast.error(error.message);
      } else {
        toast.success("Welcome back!");
        onClose();
        onSuccess?.();
      }
    }
    setLoading(false);
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[90] flex items-end justify-center"
          onClick={onClose}
        >
          <div className="absolute inset-0" style={{
            background: "rgba(0,0,0,0.5)",
            backdropFilter: "blur(8px)",
            WebkitBackdropFilter: "blur(8px)",
          }} />

          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
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
                {mode === "signin" ? "Welcome back" : "Create account"}
              </h2>
              <p className="text-[14px] text-center mt-1" style={{ color: "rgba(255,255,255,0.5)" }}>
                {mode === "signin" ? "Sign in to sync your scans" : "Join SKAAP to save your progress"}
              </p>

              <div className="mt-6 space-y-3">
                {mode === "signup" && (
                  <div className="flex items-center gap-3 px-4 h-12 rounded-2xl glass-pill">
                    <User size={18} style={{ color: "rgba(255,255,255,0.4)" }} />
                    <input
                      type="text"
                      placeholder="Full name"
                      value={name}
                      onChange={e => setName(e.target.value)}
                      className="flex-1 bg-transparent text-sm text-white outline-none placeholder:text-white/30"
                    />
                  </div>
                )}
                <div className="flex items-center gap-3 px-4 h-12 rounded-2xl glass-pill">
                  <Mail size={18} style={{ color: "rgba(255,255,255,0.4)" }} />
                  <input
                    type="email"
                    placeholder="Email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="flex-1 bg-transparent text-sm text-white outline-none placeholder:text-white/30"
                  />
                </div>
                <div className="flex items-center gap-3 px-4 h-12 rounded-2xl glass-pill">
                  <Lock size={18} style={{ color: "rgba(255,255,255,0.4)" }} />
                  <input
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && handleSubmit()}
                    className="flex-1 bg-transparent text-sm text-white outline-none placeholder:text-white/30"
                  />
                </div>
              </div>

              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={handleSubmit}
                disabled={loading}
                className="w-full mt-6 font-bold text-[15px] text-white flex items-center justify-center"
                style={{
                  height: 52,
                  borderRadius: 16,
                  background: "linear-gradient(135deg, #E8314A, #c42040)",
                  opacity: loading ? 0.7 : 1,
                }}
              >
                {loading ? "..." : mode === "signin" ? "Sign In" : "Create Account"}
              </motion.button>

              <button
                onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
                className="w-full mt-4 text-[13px] text-center"
                style={{ color: "rgba(255,255,255,0.5)" }}
              >
                {mode === "signin" ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
