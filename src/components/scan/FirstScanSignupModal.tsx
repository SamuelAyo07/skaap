import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Mail, User as UserIcon } from "lucide-react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import skaapIcon from "@/assets/skaap-icon.png";

const STORAGE_KEY = "skaap_first_scan_signup_v1";
const NAME_KEY = "skaap_user_name_v1";
const EMAIL_KEY = "skaap_user_email_v1";

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

export function saveUserIdentity(name: string, email: string) {
  try {
    localStorage.setItem(NAME_KEY, name);
    localStorage.setItem(EMAIL_KEY, email);
  } catch {}
}

const Schema = z.object({
  name: z.string().trim().min(1, "Name required").max(100),
  email: z.string().trim().email("Enter a valid email").max(255),
});

interface Props {
  open: boolean;
  onClose: () => void;
}

export function FirstScanSignupModal({ open, onClose }: Props) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = Schema.safeParse({ name, email });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message || "Check your details");
      return;
    }
    setSubmitting(true);
    try {
      const { error } = await supabase.from("scan_signups").insert({
        name: parsed.data.name,
        email: parsed.data.email,
        source: "first_scan",
      });
      if (error) throw error;
      saveUserIdentity(parsed.data.name, parsed.data.email);
      markFirstScanSignupSeen();
      toast.success(`You're in, ${parsed.data.name.split(/\s+/)[0]} 🎉`);
      onClose();
    } catch {
      // Save locally even if remote insert fails so the experience is personalized
      saveUserIdentity(parsed.data.name, parsed.data.email);
      markFirstScanSignupSeen();
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  const dismiss = () => {
    markFirstScanSignupSeen();
    onClose();
  };

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
            className="relative w-full max-w-sm bg-white rounded-3xl p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button onClick={dismiss}
              className="absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center"
              style={{ background: "#F3F4F6" }} aria-label="Close">
              <X size={16} color="#6B7280" />
            </button>

            <div className="flex items-center gap-2 mb-4">
              <img src={skaapIcon} alt="SKAAP" className="w-7 h-7 rounded-lg" />
              <span className="font-extrabold text-base tracking-tight" style={{ color: "#0A1220" }}>SKAAP</span>
            </div>

            <h2 className="font-extrabold text-[22px] leading-tight tracking-tight" style={{ color: "#0A1220" }}>
              You're in. One last thing.
            </h2>
            <p className="text-[13px] mt-1" style={{ color: "#6B7280" }}>
              So we can save your scans and send you smarter food intelligence.
            </p>

            <form onSubmit={handleSubmit} className="mt-5 space-y-3">
              <div className="relative">
                <UserIcon size={16} className="absolute left-3 top-1/2 -translate-y-1/2" color="#9CA3AF" />
                <input
                  type="text" value={name} onChange={(e) => setName(e.target.value)}
                  placeholder="Your name" maxLength={100} required autoFocus
                  className="w-full pl-9 pr-3 py-3 rounded-xl text-[14px] outline-none focus:ring-2 placeholder:text-gray-400"
                  style={{ background: "#F9FAFB", border: "1px solid #E5E7EB", color: "#0A1220", caretColor: "#C41E3A" }}
                />
              </div>
              <div className="relative">
                <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2" color="#9CA3AF" />
                <input
                  type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@email.com" maxLength={255} required inputMode="email" autoComplete="email"
                  className="w-full pl-9 pr-3 py-3 rounded-xl text-[14px] outline-none focus:ring-2 placeholder:text-gray-400"
                  style={{ background: "#F9FAFB", border: "1px solid #E5E7EB", color: "#0A1220", caretColor: "#C41E3A" }}
                />
              </div>

              <button
                type="submit" disabled={submitting}
                className="w-full py-3.5 rounded-2xl font-bold text-[15px] text-white disabled:opacity-60"
                style={{ background: "linear-gradient(135deg, #C41E3A, #9E1830)", boxShadow: "0 4px 14px rgba(196,30,58,0.3)" }}
              >
                {submitting ? "Saving..." : "Start Scanning"}
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
