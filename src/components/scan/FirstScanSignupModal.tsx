import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Mail, User as UserIcon, Phone, Lock, Camera } from "lucide-react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { toast } from "sonner";
import { compressImage } from "@/lib/imageCompress";
import skaapIcon from "@/assets/skaap-icon.png";

const STORAGE_KEY = "skaap_first_scan_signup_v1";
const NAME_KEY = "skaap_user_name_v1";
const EMAIL_KEY = "skaap_user_email_v1";
const PHONE_KEY = "skaap_user_phone_v1";
const GUEST_AVATAR_KEY = "skaap_guest_avatar_v1";

export function hasCompletedFirstScanSignup(): boolean {
  try { return localStorage.getItem(STORAGE_KEY) === "1"; } catch { return false; }
}

export function markFirstScanSignupSeen() {
  try { localStorage.setItem(STORAGE_KEY, "1"); } catch {}
}

export function getUserName(): string | null {
  try { return localStorage.getItem(NAME_KEY); } catch { return null; }
}

export function getUserFirstName(): string | null {
  const n = getUserName();
  if (!n) return null;
  return n.trim().split(/\s+/)[0] || null;
}

export function getUserEmail(): string | null {
  try { return localStorage.getItem(EMAIL_KEY); } catch { return null; }
}

export function getUserPhone(): string | null {
  try { return localStorage.getItem(PHONE_KEY); } catch { return null; }
}

export function saveUserIdentity(name: string, email: string, phone?: string) {
  try {
    localStorage.setItem(NAME_KEY, name);
    localStorage.setItem(EMAIL_KEY, email);
    if (phone !== undefined) {
      if (phone) localStorage.setItem(PHONE_KEY, phone);
      else localStorage.removeItem(PHONE_KEY);
    }
  } catch {}
}

const Schema = z.object({
  name: z.string().trim().min(1, "Name required").max(100),
  email: z.string().trim().email("Enter a valid email").max(255),
  password: z.string().min(8, "Password must be at least 8 characters").max(72),
  phone: z.string().trim().max(32).optional().or(z.literal("")),
});

interface Props {
  open: boolean;
  onClose: () => void;
}

function fileToDataUrl(file: Blob): Promise<string> {
  return new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = () => res(String(r.result));
    r.onerror = () => rej(r.error);
    r.readAsDataURL(file);
  });
}

export function FirstScanSignupModal({ open, onClose }: Props) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [avatar, setAvatar] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const pickPhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    try {
      const c = await compressImage(f, { maxDim: 512, quality: 0.85 });
      const data = await fileToDataUrl(c);
      setAvatar(data);
    } catch {
      toast.error("Couldn't load photo");
    }
  };

  const persistIdentity = async (n: string, em: string, ph?: string) => {
    saveUserIdentity(n, em, ph);
    if (avatar) {
      try { localStorage.setItem(GUEST_AVATAR_KEY, avatar); } catch {}
    }
    markFirstScanSignupSeen();
    try {
      await supabase.from("scan_signups").insert({
        name: n, email: em, phone: ph || null, source: "first_scan",
      });
    } catch {}
  };

  const handleOAuth = async (provider: "google" | "apple") => {
    setSubmitting(true);
    try {
      const result = await lovable.auth.signInWithOAuth(provider, {
        redirect_uri: window.location.origin + "/scan",
      });
      if (result.error) {
        toast.error("Couldn't sign in. Try again.");
        setSubmitting(false);
        return;
      }
      // result.redirected → browser handles redirect; nothing else to do.
      markFirstScanSignupSeen();
    } catch {
      toast.error("Couldn't sign in. Try again.");
      setSubmitting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = Schema.safeParse({ name, email, password, phone });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message || "Check your details");
      return;
    }
    setSubmitting(true);
    try {
      // Sign up directly — no email verification needed (auto-confirm flow).
      const { data, error } = await supabase.auth.signUp({
        email: parsed.data.email,
        password: parsed.data.password,
        options: {
          data: { full_name: parsed.data.name, phone: parsed.data.phone || null },
          emailRedirectTo: window.location.origin + "/scan",
        },
      });

      // If email confirmation is required, fall back to immediate password sign-in attempt
      if (error && /already/i.test(error.message)) {
        const { error: signErr } = await supabase.auth.signInWithPassword({
          email: parsed.data.email,
          password: parsed.data.password,
        });
        if (signErr) {
          toast.error("Account exists. Use a different email or sign in.");
          setSubmitting(false);
          return;
        }
      } else if (error) {
        toast.error(error.message);
        setSubmitting(false);
        return;
      }

      await persistIdentity(parsed.data.name, parsed.data.email, parsed.data.phone);

      // Upload avatar if user is now authenticated
      if (avatar && data?.user?.id) {
        try {
          const blob = await (await fetch(avatar)).blob();
          const path = `${data.user.id}/avatar-${Date.now()}.jpg`;
          await supabase.storage.from("avatars").upload(path, blob, { upsert: true, contentType: "image/jpeg" });
          const { data: pub } = supabase.storage.from("avatars").getPublicUrl(path);
          await supabase.from("profiles").upsert({ id: data.user.id, avatar_url: pub.publicUrl, email: parsed.data.email, full_name: parsed.data.name });
        } catch {}
      }

      toast.success(`You're in, ${parsed.data.name.split(/\s+/)[0]}`);
      onClose();
    } catch {
      // Always save locally so user isn't blocked
      await persistIdentity(parsed.data.name, parsed.data.email, parsed.data.phone);
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  const dismiss = () => { markFirstScanSignupSeen(); onClose(); };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-[90] flex items-end sm:items-center justify-center"
          onClick={dismiss}
        >
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
          <motion.div
            initial={{ y: 60, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 60, opacity: 0 }}
            transition={{ type: "spring", damping: 28, stiffness: 260 }}
            className="relative w-full sm:max-w-[400px] bg-[#F2F2F7] rounded-t-[28px] sm:rounded-[28px] max-h-[94vh] overflow-y-auto shadow-2xl"
            onClick={(e) => e.stopPropagation()}
            style={{ paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 16px)" }}
          >
            {/* Drag handle */}
            <div className="flex justify-center pt-2 pb-1 sm:hidden">
              <div className="w-9 h-[5px] rounded-full" style={{ background: "#D1D1D6" }} />
            </div>

            {/* Top bar: Cancel / title / dismiss */}
            <div className="flex items-center justify-between px-4 pt-3 pb-1">
              <button onClick={dismiss} className="text-[15px] font-medium px-1 py-1" style={{ color: "#C41E3A" }}>
                Skip
              </button>
              <span className="text-[15px] font-semibold" style={{ color: "#0A1220" }}>Your details</span>
              <button onClick={dismiss}
                className="w-7 h-7 rounded-full flex items-center justify-center"
                style={{ background: "rgba(120,120,128,0.16)" }} aria-label="Close">
                <X size={14} color="#3C3C43" />
              </button>
            </div>

            {/* Hero */}
            <div className="px-5 pt-3 pb-5 text-center">
              <h2 className="font-bold text-[28px] leading-[1.1] tracking-tight" style={{ color: "#0A1220", letterSpacing: "-0.5px" }}>
                Save your scans
              </h2>
              <p className="text-[14px] mt-1.5 max-w-[280px] mx-auto" style={{ color: "#6B6B70" }}>
                Add your details so your history, alerts, and saved products sync everywhere.
              </p>
            </div>

            {/* Avatar */}
            <div className="flex flex-col items-center pb-5">
              <button type="button" onClick={() => fileRef.current?.click()}
                className="relative w-[88px] h-[88px] rounded-full overflow-hidden flex items-center justify-center"
                style={{ background: "#FFFFFF", boxShadow: "0 1px 2px rgba(0,0,0,0.06)" }}>
                {avatar ? (
                  <img src={avatar} alt="" className="w-full h-full object-cover" />
                ) : (
                  <UserIcon size={36} color="#C7C7CC" />
                )}
                <span className="absolute bottom-0 right-0 w-7 h-7 rounded-full flex items-center justify-center text-white"
                  style={{ background: "#C41E3A", border: "2px solid #F2F2F7" }}>
                  <Camera size={13} />
                </span>
              </button>
              <button type="button" onClick={() => fileRef.current?.click()}
                className="mt-2 text-[14px] font-medium" style={{ color: "#C41E3A" }}>
                {avatar ? "Change photo" : "Add photo"}
              </button>
              <input ref={fileRef} type="file" accept="image/*" onChange={pickPhoto} className="hidden" />
            </div>

            {/* OAuth buttons — full width, native look */}
            <div className="px-4 space-y-2">
              <button type="button" disabled={submitting} onClick={() => handleOAuth("apple")}
                className="w-full h-[50px] rounded-2xl flex items-center justify-center gap-2 font-semibold text-[15px] text-white active:opacity-80 transition"
                style={{ background: "#000000" }}>
                <svg width="16" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/></svg>
                Continue with Apple
              </button>
              <button type="button" disabled={submitting} onClick={() => handleOAuth("google")}
                className="w-full h-[50px] rounded-2xl flex items-center justify-center gap-2 font-semibold text-[15px] active:opacity-80 transition"
                style={{ background: "#FFFFFF", color: "#0A1220", border: "1px solid rgba(60,60,67,0.18)" }}>
                <svg width="16" height="16" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.99.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z"/></svg>
                Continue with Google
              </button>
            </div>

            {/* Divider */}
            <div className="flex items-center gap-3 my-5 px-5">
              <div className="flex-1 h-px" style={{ background: "rgba(60,60,67,0.18)" }} />
              <span className="text-[11px] font-medium uppercase tracking-wider" style={{ color: "#8E8E93" }}>or with email</span>
              <div className="flex-1 h-px" style={{ background: "rgba(60,60,67,0.18)" }} />
            </div>

            {/* iOS-style inset grouped form */}
            <form onSubmit={handleSubmit} className="px-4 space-y-5">
              <div className="rounded-[14px] overflow-hidden" style={{ background: "#FFFFFF" }}>
                <Row label="Name" icon={<UserIcon size={16} color="#C41E3A" />}>
                  <input type="text" value={name} onChange={(e) => setName(e.target.value)}
                    placeholder="Required" maxLength={100} required autoFocus autoComplete="name"
                    className="flex-1 bg-transparent outline-none text-[16px] placeholder:text-[#C7C7CC]"
                    style={{ color: "#0A1220", caretColor: "#C41E3A" }} />
                </Row>
                <Divider />
                <Row label="Email" icon={<Mail size={16} color="#C41E3A" />}>
                  <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@email.com" maxLength={255} required inputMode="email" autoComplete="email"
                    className="flex-1 bg-transparent outline-none text-[16px] placeholder:text-[#C7C7CC]"
                    style={{ color: "#0A1220", caretColor: "#C41E3A" }} />
                </Row>
                <Divider />
                <Row label="Phone" icon={<Phone size={16} color="#C41E3A" />}>
                  <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)}
                    placeholder="Optional" maxLength={32} inputMode="tel" autoComplete="tel"
                    className="flex-1 bg-transparent outline-none text-[16px] placeholder:text-[#C7C7CC]"
                    style={{ color: "#0A1220", caretColor: "#C41E3A" }} />
                </Row>
                <Divider />
                <Row label="Password" icon={<Lock size={16} color="#C41E3A" />}>
                  <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                    placeholder="8+ characters" minLength={8} maxLength={72} required autoComplete="new-password"
                    className="flex-1 bg-transparent outline-none text-[16px] placeholder:text-[#C7C7CC]"
                    style={{ color: "#0A1220", caretColor: "#C41E3A" }} />
                </Row>
              </div>

              <button type="submit" disabled={submitting}
                className="w-full h-[50px] rounded-2xl font-semibold text-[16px] text-white disabled:opacity-60 active:opacity-90 transition"
                style={{ background: "#C41E3A", boxShadow: "0 6px 16px rgba(196,30,58,0.28)" }}>
                {submitting ? "Saving…" : "Create account"}
              </button>

              <p className="text-center text-[12px]" style={{ color: "#8E8E93" }}>
                We never share your data. By continuing you agree to our Terms.
              </p>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// iOS-style settings row
function Row({ label, icon, children }: { label: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <label className="flex items-center gap-3 px-4 h-[52px] cursor-text">
      <span className="w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0"
        style={{ background: "rgba(196,30,58,0.10)" }}>{icon}</span>
      <span className="text-[15px] font-medium w-[72px] flex-shrink-0" style={{ color: "#0A1220" }}>{label}</span>
      {children}
    </label>
  );
}

function Divider() {
  return <div className="ml-[60px] h-px" style={{ background: "rgba(60,60,67,0.12)" }} />;
}

