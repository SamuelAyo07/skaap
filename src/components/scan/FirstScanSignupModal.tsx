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
          className="fixed inset-0 z-[90] flex items-end sm:items-center justify-center px-4"
          onClick={dismiss}
        >
          <div className="absolute inset-0 bg-black/40" />
          <motion.div
            initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 40, opacity: 0 }}
            transition={{ type: "spring", damping: 24, stiffness: 220 }}
            className="relative w-full max-w-sm bg-white rounded-3xl p-6 shadow-2xl max-h-[92vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <button onClick={dismiss}
              className="absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center"
              style={{ background: "#F3F4F6" }} aria-label="Close">
              <X size={16} color="#6B7280" />
            </button>

            <div className="flex items-center gap-2 mb-3">
              <img src={skaapIcon} alt="SKAAP" className="w-7 h-7 rounded-lg" />
              <span className="font-extrabold text-base tracking-tight" style={{ color: "#0A1220" }}>SKAAP</span>
            </div>

            <h2 className="font-extrabold text-[22px] leading-tight tracking-tight" style={{ color: "#0A1220" }}>
              You're in. Save your scans.
            </h2>
            <p className="text-[13px] mt-1" style={{ color: "#6B7280" }}>
              Sign up in seconds. No email confirmation needed.
            </p>

            {/* OAuth — compact icons */}
            <div className="mt-4 flex items-center justify-center gap-3">
              <button type="button" disabled={submitting} onClick={() => handleOAuth("google")}
                aria-label="Continue with Google"
                className="w-12 h-12 rounded-full flex items-center justify-center"
                style={{ background: "#fff", border: "1px solid #E5E7EB" }}>
                <svg width="20" height="20" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.99.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z"/></svg>
              </button>
              <button type="button" disabled={submitting} onClick={() => handleOAuth("apple")}
                aria-label="Continue with Apple"
                className="w-12 h-12 rounded-full flex items-center justify-center text-white"
                style={{ background: "#0A1220" }}>
                <svg width="18" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/></svg>
              </button>
            </div>


            <div className="flex items-center gap-3 my-4">
              <div className="flex-1 h-px" style={{ background: "#E5E7EB" }} />
              <span className="text-[11px] font-semibold" style={{ color: "#9CA3AF" }}>OR</span>
              <div className="flex-1 h-px" style={{ background: "#E5E7EB" }} />
            </div>

            <form onSubmit={handleSubmit} className="space-y-2.5">
              {/* Photo */}
              <div className="flex items-center gap-3 pb-2">
                <button type="button" onClick={() => fileRef.current?.click()}
                  className="relative w-14 h-14 rounded-full overflow-hidden flex items-center justify-center flex-shrink-0"
                  style={{ background: avatar ? "transparent" : "#F3F4F6", border: "1px dashed #D1D5DB" }}>
                  {avatar ? <img src={avatar} alt="" className="w-full h-full object-cover" /> : <Camera size={18} color="#9CA3AF" />}
                </button>
                <div className="flex-1">
                  <p className="text-[12px] font-semibold" style={{ color: "#0A1220" }}>Add a photo (optional)</p>
                  <p className="text-[11px]" style={{ color: "#9CA3AF" }}>Tap to upload · skip anytime</p>
                </div>
                <input ref={fileRef} type="file" accept="image/*" onChange={pickPhoto} className="hidden" />
              </div>

              <div className="relative">
                <UserIcon size={16} className="absolute left-3 top-1/2 -translate-y-1/2" color="#9CA3AF" />
                <input type="text" value={name} onChange={(e) => setName(e.target.value)}
                  placeholder="Your name" maxLength={100} required autoFocus
                  className="w-full pl-9 pr-3 py-3 rounded-xl text-[14px] outline-none focus:ring-2 placeholder:text-gray-400"
                  style={{ background: "#F9FAFB", border: "1px solid #E5E7EB", color: "#0A1220", caretColor: "#C41E3A" }} />
              </div>
              <div className="relative">
                <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2" color="#9CA3AF" />
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@email.com" maxLength={255} required inputMode="email" autoComplete="email"
                  className="w-full pl-9 pr-3 py-3 rounded-xl text-[14px] outline-none focus:ring-2 placeholder:text-gray-400"
                  style={{ background: "#F9FAFB", border: "1px solid #E5E7EB", color: "#0A1220", caretColor: "#C41E3A" }} />
              </div>
              <div className="relative">
                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2" color="#9CA3AF" />
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password (8+ chars)" minLength={8} maxLength={72} required autoComplete="new-password"
                  className="w-full pl-9 pr-3 py-3 rounded-xl text-[14px] outline-none focus:ring-2 placeholder:text-gray-400"
                  style={{ background: "#F9FAFB", border: "1px solid #E5E7EB", color: "#0A1220", caretColor: "#C41E3A" }} />
              </div>
              <div className="relative">
                <Phone size={16} className="absolute left-3 top-1/2 -translate-y-1/2" color="#9CA3AF" />
                <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)}
                  placeholder="Phone (optional)" maxLength={32} inputMode="tel" autoComplete="tel"
                  className="w-full pl-9 pr-3 py-3 rounded-xl text-[14px] outline-none focus:ring-2 placeholder:text-gray-400"
                  style={{ background: "#F9FAFB", border: "1px solid #E5E7EB", color: "#0A1220", caretColor: "#C41E3A" }} />
              </div>

              <button type="submit" disabled={submitting}
                className="w-full py-3.5 rounded-2xl font-bold text-[15px] text-white disabled:opacity-60"
                style={{ background: "linear-gradient(135deg, #C41E3A, #9E1830)", boxShadow: "0 4px 14px rgba(196,30,58,0.3)" }}>
                {submitting ? "Saving..." : "Create account & start"}
              </button>
              <button type="button" onClick={dismiss}
                className="w-full py-2 font-semibold text-[13px]" style={{ color: "#9CA3AF" }}>
                Skip for now
              </button>
            </form>

            <p className="text-center text-[11px] mt-3" style={{ color: "#9CA3AF" }}>
              We don't share your data. Ever.
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
