import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Mail, User as UserIcon, Lock } from "lucide-react";
import { z } from "zod";
import { lovable } from "@/integrations/lovable";
import { supabase } from "@/integrations/supabase/client";
import { saveUserIdentity, markFirstScanSignupSeen } from "@/components/scan/FirstScanSignupModal";
import { toast } from "sonner";

interface AuthSheetProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const Schema = z.object({
  name: z.string().trim().min(1, "Name required").max(100),
  email: z.string().trim().email("Enter a valid email").max(255),
  password: z.string().min(8, "8+ characters").max(72),
});

export function AuthSheet({ open, onClose, onSuccess }: AuthSheetProps) {
  const [loading, setLoading] = useState<"google" | "apple" | "email" | null>(null);
  const [mode, setMode] = useState<"signup" | "signin">("signup");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

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
    } catch {
      toast.error("Couldn't sign in. Try again.");
      setLoading(null);
    }
  };

  const handleEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading("email");
    try {
      if (mode === "signup") {
        const parsed = Schema.safeParse({ name, email, password });
        if (!parsed.success) {
          toast.error(parsed.error.issues[0]?.message || "Check your details");
          setLoading(null); return;
        }
        const { error } = await supabase.auth.signUp({
          email: parsed.data.email,
          password: parsed.data.password,
          options: {
            data: { full_name: parsed.data.name },
            emailRedirectTo: window.location.origin + "/scan",
          },
        });
        if (error) { toast.error(error.message); setLoading(null); return; }
        saveUserIdentity(parsed.data.name, parsed.data.email);
        markFirstScanSignupSeen();
        toast.success(`You're in, ${parsed.data.name.split(/\s+/)[0]}`);
        onSuccess?.(); onClose();
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
        if (error) { toast.error(error.message); setLoading(null); return; }
        toast.success("Welcome back");
        onSuccess?.(); onClose();
      }
    } catch {
      toast.error("Something went wrong");
    } finally {
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
            className="relative w-full rounded-t-[28px] z-10 overflow-hidden max-h-[92vh] overflow-y-auto"
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

            <div className="px-6 pt-5 pb-6">
              <h2 className="font-extrabold text-2xl text-white text-center">
                {mode === "signup" ? "Join SKAAP" : "Welcome back"}
              </h2>
              <p className="text-[13px] text-center mt-1" style={{ color: "rgba(255,255,255,0.55)" }}>
                {mode === "signup" ? "Save your scans, unlock community." : "Sign in to continue."}
              </p>

              {/* Compact social icons */}
              <div className="mt-5 flex items-center justify-center gap-3">
                <motion.button
                  whileTap={{ scale: 0.92 }}
                  disabled={!!loading}
                  onClick={() => handleOAuth("google")}
                  className="w-14 h-14 rounded-full flex items-center justify-center"
                  style={{ background: "#FFFFFF", opacity: loading === "google" ? 0.6 : 1 }}
                  aria-label="Continue with Google"
                >
                  <svg width="22" height="22" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.99.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z"/></svg>
                </motion.button>
                <motion.button
                  whileTap={{ scale: 0.92 }}
                  disabled={!!loading}
                  onClick={() => handleOAuth("apple")}
                  className="w-14 h-14 rounded-full flex items-center justify-center text-white"
                  style={{ background: "#000000", border: "1px solid rgba(255,255,255,0.15)", opacity: loading === "apple" ? 0.6 : 1 }}
                  aria-label="Continue with Apple"
                >
                  <svg width="22" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/></svg>
                </motion.button>
              </div>

              <div className="flex items-center gap-3 my-5">
                <div className="flex-1 h-px" style={{ background: "rgba(255,255,255,0.12)" }} />
                <span className="text-[10px] font-semibold tracking-wider" style={{ color: "rgba(255,255,255,0.4)" }}>OR USE EMAIL</span>
                <div className="flex-1 h-px" style={{ background: "rgba(255,255,255,0.12)" }} />
              </div>

              <form onSubmit={handleEmail} className="space-y-2.5">
                {mode === "signup" && (
                  <div className="relative">
                    <UserIcon size={16} className="absolute left-3 top-1/2 -translate-y-1/2" color="rgba(255,255,255,0.4)" />
                    <input type="text" value={name} onChange={e => setName(e.target.value)}
                      placeholder="Your name" maxLength={100} required
                      className="w-full pl-9 pr-3 py-3 rounded-xl text-[14px] text-white outline-none placeholder:text-white/30"
                      style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }} />
                  </div>
                )}
                <div className="relative">
                  <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2" color="rgba(255,255,255,0.4)" />
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                    placeholder="you@email.com" maxLength={255} required inputMode="email" autoComplete="email"
                    className="w-full pl-9 pr-3 py-3 rounded-xl text-[14px] text-white outline-none placeholder:text-white/30"
                    style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }} />
                </div>
                <div className="relative">
                  <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2" color="rgba(255,255,255,0.4)" />
                  <input type="password" value={password} onChange={e => setPassword(e.target.value)}
                    placeholder={mode === "signup" ? "Password (8+ chars)" : "Password"}
                    minLength={8} maxLength={72} required
                    autoComplete={mode === "signup" ? "new-password" : "current-password"}
                    className="w-full pl-9 pr-3 py-3 rounded-xl text-[14px] text-white outline-none placeholder:text-white/30"
                    style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }} />
                </div>

                <button type="submit" disabled={!!loading}
                  className="w-full font-extrabold text-[14px] text-white"
                  style={{ height: 50, borderRadius: 14, background: "linear-gradient(135deg, #C41E3A, #9E1830)", opacity: loading === "email" ? 0.6 : 1 }}>
                  {loading === "email" ? "Working…" : mode === "signup" ? "Create account" : "Sign in"}
                </button>
              </form>

              <div className="flex items-center justify-between mt-3 text-[12px]">
                <button onClick={() => setMode(mode === "signup" ? "signin" : "signup")}
                  className="font-semibold" style={{ color: "rgba(255,255,255,0.65)" }}>
                  {mode === "signup" ? "Have an account? Sign in" : "New here? Create account"}
                </button>
                <button onClick={onClose} className="font-semibold" style={{ color: "rgba(255,255,255,0.4)" }}>
                  Skip
                </button>
              </div>

              <p className="mt-4 text-[11px] text-center" style={{ color: "rgba(255,255,255,0.3)" }}>
                We never share your details. No spam, ever.
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
