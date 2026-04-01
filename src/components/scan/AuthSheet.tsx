import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Mail, Lock, User } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { lovable } from "@/integrations/lovable/index";
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
  const [socialLoading, setSocialLoading] = useState<string | null>(null);

  const handleSocialLogin = async (provider: "google" | "apple") => {
    setSocialLoading(provider);
    try {
      const { error } = await lovable.auth.signInWithOAuth(provider, {
        redirect_uri: window.location.origin,
      });
      if (error) {
        toast.error(`${provider === "google" ? "Google" : "Apple"} sign-in failed. Please try again.`);
      }
    } catch {
      toast.error("Something went wrong. Please try again.");
    }
    setSocialLoading(null);
  };

  const handleSubmit = async () => {
    if (!email || !password) {
      toast.error("Please enter your email and password");
      return;
    }
    if (mode === "signup" && password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    setLoading(true);
    try {
      if (mode === "signup") {
        const { error } = await signUp(email, password, name);
        if (error) {
          if (error.message?.includes("already registered")) {
            toast.error("This email is already registered. Switching to sign in...");
            setMode("signin");
          } else {
            toast.error(error.message || "Signup failed. Please try again.");
          }
        } else {
          toast.success("Account created! You're signed in.");
          onClose();
          onSuccess?.();
        }
      } else {
        const { error } = await signIn(email, password);
        if (error) {
          if (error.message?.includes("Invalid login")) {
            toast.error("Wrong email or password. Please try again.");
          } else {
            toast.error(error.message || "Login failed. Please try again.");
          }
        } else {
          toast.success("Welcome back!");
          onClose();
          onSuccess?.();
        }
      }
    } catch {
      toast.error("Something went wrong. Please try again.");
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

              {/* Social Sign-In Buttons */}
              <div className="mt-5 space-y-2.5">
                <button
                  onClick={() => handleSocialLogin("google")}
                  disabled={!!socialLoading}
                  className="w-full flex items-center justify-center gap-3 h-[48px] rounded-2xl font-semibold text-[14px] transition-all"
                  style={{
                    background: "rgba(255,255,255,0.08)",
                    border: "1px solid rgba(255,255,255,0.12)",
                    color: "#fff",
                    opacity: socialLoading === "apple" ? 0.5 : 1,
                  }}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                  </svg>
                  {socialLoading === "google" ? "Connecting..." : "Continue with Google"}
                </button>

                <button
                  onClick={() => handleSocialLogin("apple")}
                  disabled={!!socialLoading}
                  className="w-full flex items-center justify-center gap-3 h-[48px] rounded-2xl font-semibold text-[14px] transition-all"
                  style={{
                    background: "rgba(255,255,255,0.08)",
                    border: "1px solid rgba(255,255,255,0.12)",
                    color: "#fff",
                    opacity: socialLoading === "google" ? 0.5 : 1,
                  }}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="white">
                    <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
                  </svg>
                  {socialLoading === "apple" ? "Connecting..." : "Continue with Apple"}
                </button>
              </div>

              {/* Divider */}
              <div className="flex items-center gap-3 my-4">
                <div className="flex-1 h-px" style={{ background: "rgba(255,255,255,0.1)" }} />
                <span className="text-[12px]" style={{ color: "rgba(255,255,255,0.3)" }}>or</span>
                <div className="flex-1 h-px" style={{ background: "rgba(255,255,255,0.1)" }} />
              </div>

              <div className="space-y-3">
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
                className="w-full mt-5 font-bold text-[15px] text-white flex items-center justify-center"
                style={{
                  height: 52,
                  borderRadius: 16,
                  background: "linear-gradient(135deg, #C41E3A, #9E1830)",
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