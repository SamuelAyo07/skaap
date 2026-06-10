import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, LogOut, ChevronRight, Plus, X, Crown, Camera, Lock, Check, Pencil } from "lucide-react";
import { SocialLinks } from "@/components/scan/SocialLinks";
import { getUserFirstName, getUserName, getUserEmail, getUserPhone, saveUserIdentity } from "@/components/scan/FirstScanSignupModal";
import { useAuth } from "@/context/AuthContext";
import { useSubscription } from "@/context/SubscriptionContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { compressImage } from "@/lib/imageCompress";
import HealthProfileSheet from "@/components/scan/HealthProfileSheet";
import { BottomNavBar } from "@/components/scan/BottomNavBar";


// Cap any single upload at ~8 MB after compression as a final safety net
const MAX_UPLOAD_BYTES = 8 * 1024 * 1024;


interface ProfileScreenProps {
  onBack: () => void;
  onNavChange?: (nav: string) => void;
}

const PRESET_ALERTS = [
  { name: "Artificial colors", code: "artificial-colors" },
  { name: "Aspartame", code: "e951" },
  { name: "High-fructose corn syrup", code: "hfcs" },
  { name: "MSG", code: "e621" },
  { name: "Palm oil", code: "palm-oil" },
  { name: "Sulphite caramels", code: "e150d" },
  { name: "Gluten", code: "gluten" },
  { name: "Lactose", code: "lactose" },
];

interface AlertItem {
  id: string;
  ingredient_name: string;
  ingredient_code: string | null;
  active: boolean;
}

export function ProfileScreen({ onBack }: ProfileScreenProps) {
  const { user, signOut } = useAuth();
  const { isPlus, openUpgrade } = useSubscription();
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [customAlert, setCustomAlert] = useState("");
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [avatarProgress, setAvatarProgress] = useState(0);
  const [goalsOpen, setGoalsOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);



  const localName = getUserName();
  const localFirst = getUserFirstName();
  const displayName = user?.user_metadata?.full_name || localName || "Guest";
  const firstName = displayName.split(" ")[0] || localFirst || "friend";
  const displayEmail = user?.email || getUserEmail() || "";
  const initial = (firstName[0] || "?").toUpperCase();

  // Editable details
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState(displayName === "Guest" ? "" : displayName);
  const [editEmail, setEditEmail] = useState(displayEmail);
  const [editPhone, setEditPhone] = useState(user?.user_metadata?.phone || getUserPhone() || "");
  const [savingDetails, setSavingDetails] = useState(false);

  const saveDetails = async () => {
    const n = editName.trim();
    const em = editEmail.trim();
    const ph = editPhone.trim();
    if (!n) { toast.error("Name required"); return; }
    if (em && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(em)) { toast.error("Enter a valid email"); return; }
    setSavingDetails(true);
    try {
      saveUserIdentity(n, em, ph);
      if (user) {
        await supabase.from("profiles").upsert({
          id: user.id, full_name: n, email: em || user.email, phone: ph || null,
        });
        await supabase.auth.updateUser({ data: { full_name: n, phone: ph || null } });
      }
      toast.success("Saved");
      setEditing(false);
    } catch (e: any) {
      toast.error(e?.message || "Couldn't save");
    } finally {
      setSavingDetails(false);
    }
  };

  // Local guest storage keys for anonymous photo uploads
  const GUEST_AVATAR_KEY = "skaap_guest_avatar_v1";

  // Load profile + alerts (auth) OR local guest avatar
  useEffect(() => {
    if (user) {
      supabase.from("profiles").select("avatar_url").eq("id", user.id).maybeSingle()
        .then(({ data }) => { if (data?.avatar_url) setAvatarUrl(data.avatar_url); });
      supabase.from("user_alerts").select("*").eq("user_id", user.id)
        .then(({ data }) => { if (data) setAlerts(data as AlertItem[]); });
      return;
    }
    // Guest mode — pull avatar from localStorage
    try {
      const a = localStorage.getItem(GUEST_AVATAR_KEY);
      if (a) setAvatarUrl(a);
    } catch { /* ignore */ }
  }, [user]);

  const fileToDataUrl = (file: Blob): Promise<string> => new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = () => res(String(r.result));
    r.onerror = () => rej(r.error);
    r.readAsDataURL(file);
  });




  const handleAvatarPick = () => {
    fileInputRef.current?.click();
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setAvatarProgress(10);
    try {
      const compressed = await compressImage(file, { maxDim: 1024, quality: 0.85 });
      setAvatarProgress(50);
      if (compressed.size > MAX_UPLOAD_BYTES) {
        toast.error("Image is too large even after compression");
        return;
      }
      if (user) {
        const path = `${user.id}/avatar-${Date.now()}.jpg`;
        const { error: upErr } = await supabase.storage.from("avatars").upload(path, compressed, { upsert: true, contentType: "image/jpeg" });
        if (upErr) throw upErr;
        setAvatarProgress(85);
        const { data: pub } = supabase.storage.from("avatars").getPublicUrl(path);
        const url = pub.publicUrl;
        await supabase.from("profiles").upsert({ id: user.id, avatar_url: url, email: user.email });
        setAvatarUrl(url);
      } else {
        // Anonymous — persist as dataURL in localStorage
        const dataUrl = await fileToDataUrl(compressed);
        localStorage.setItem(GUEST_AVATAR_KEY, dataUrl);
        setAvatarUrl(dataUrl);
      }
      setAvatarProgress(100);
      toast.success("Photo updated");
    } catch (err: any) {
      toast.error(err?.message || "Upload failed");
    } finally {
      setUploading(false);
      setAvatarProgress(0);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };



  const toggleAlert = useCallback(async (preset: typeof PRESET_ALERTS[0]) => {
    if (!user) return;
    if (!isPlus) { openUpgrade(); return; }
    const existing = alerts.find(a => a.ingredient_code === preset.code);
    if (existing) {
      await supabase.from("user_alerts").delete().eq("id", existing.id);
      setAlerts(prev => prev.filter(a => a.id !== existing.id));
    } else {
      const { data } = await supabase.from("user_alerts").insert({
        user_id: user.id, ingredient_name: preset.name, ingredient_code: preset.code, active: true,
      }).select().single();
      if (data) setAlerts(prev => [...prev, data as AlertItem]);
    }
  }, [user, alerts, isPlus, openUpgrade]);

  const addCustomAlert = useCallback(async () => {
    if (!user || !customAlert.trim()) return;
    if (!isPlus) { openUpgrade(); return; }
    const name = customAlert.trim();
    const code = name.toLowerCase().replace(/\s+/g, "-");
    if (alerts.some(a => a.ingredient_code === code)) { toast.error("Already added"); return; }
    const { data } = await supabase.from("user_alerts").insert({
      user_id: user.id, ingredient_name: name, ingredient_code: code, active: true,
    }).select().single();
    if (data) {
      setAlerts(prev => [...prev, data as AlertItem]);
      setCustomAlert(""); setShowCustomInput(false);
      toast.success(`Alert added`);
    }
  }, [user, customAlert, alerts, isPlus, openUpgrade]);

  const removeAlert = useCallback(async (id: string) => {
    await supabase.from("user_alerts").delete().eq("id", id);
    setAlerts(prev => prev.filter(a => a.id !== id));
  }, []);

  const handleSignOut = async () => { await signOut(); onBack(); };
  const activeAlertCodes = new Set(alerts.map(a => a.ingredient_code));
  const activeCount = alerts.filter(a => a.active).length;

  return (
    <div className="min-h-[100dvh]" style={{ maxWidth: 430, margin: "0 auto", background: "#FFFFFF" }}>
      {/* Apple-style sheet header */}
      <div className="flex items-center justify-between px-5 pt-[env(safe-area-inset-top,12px)] h-14">
        <button onClick={onBack} className="p-1 -ml-1"><ArrowLeft size={20} style={{ color: "#0A1220" }} /></button>
        <h1 className="font-semibold text-[16px] tracking-tight" style={{ color: "#0A1220" }}>Profile</h1>
        <button onClick={onBack} className="text-[15px] font-semibold" style={{ color: "#B0202F" }}>Done</button>
      </div>

      <div className="px-5 pt-2 pb-28 space-y-5">
        {/* Avatar block */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col items-center pt-3">
          <div className="relative">
            <button onClick={handleAvatarPick}
              className="w-[88px] h-[88px] rounded-full flex items-center justify-center overflow-hidden"
              style={{ background: "linear-gradient(135deg, #B0202F, #8a1825)", boxShadow: "0 8px 24px rgba(176,32,47,0.25)" }}
              aria-label="Change photo"
            >
              {avatarUrl ? (
                <img src={avatarUrl} alt="" className="w-full h-full object-cover" />
              ) : (
                <span className="text-white font-bold text-[36px]">{initial}</span>
              )}
            </button>
            <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-white flex items-center justify-center" style={{ border: "2px solid #fff", boxShadow: "0 2px 6px rgba(0,0,0,0.12)" }}>
              {uploading ? (
                <span className="text-[9px] font-bold tabular-nums" style={{ color: "#B0202F" }}>
                  {avatarProgress}%
                </span>
              ) : (
                <Camera size={13} style={{ color: "#0A1220" }} />
              )}
            </div>
            <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={handleAvatarUpload} className="hidden" />
          </div>
          <h2 className="mt-3 text-[20px] font-bold tracking-tight" style={{ color: "#0A1220" }}>{displayName}</h2>

          {displayEmail && <p className="text-[13px] mt-0.5" style={{ color: "#B0202F" }}>{displayEmail}</p>}
        </motion.div>

        {/* Editable details card */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.03 }}
          className="rounded-2xl bg-white overflow-hidden" style={{ border: "1px solid #E5E7EB" }}>
          <div className="flex items-center justify-between px-4 pt-3.5 pb-1">
            <h3 className="font-bold text-[14px]" style={{ color: "#0A1220" }}>Your details</h3>
            {!editing ? (
              <button onClick={() => setEditing(true)} className="flex items-center gap-1 text-[12px] font-bold" style={{ color: "#B0202F" }}>
                <Pencil size={12} /> Edit
              </button>
            ) : (
              <button onClick={saveDetails} disabled={savingDetails} className="flex items-center gap-1 text-[12px] font-bold disabled:opacity-50" style={{ color: "#B0202F" }}>
                <Check size={13} /> {savingDetails ? "Saving…" : "Save"}
              </button>
            )}
          </div>
          <div className="px-4 pb-4 pt-2 space-y-2">
            {editing ? (
              <>
                <input type="text" value={editName} onChange={e => setEditName(e.target.value.slice(0, 100))}
                  placeholder="Your name" maxLength={100}
                  className="w-full px-3 py-2.5 rounded-xl text-[14px] outline-none placeholder:text-gray-400"
                  style={{ background: "#F9FAFB", border: "1px solid #E5E7EB", color: "#0A1220", caretColor: "#C41E3A" }} />
                <input type="email" value={editEmail} onChange={e => setEditEmail(e.target.value.slice(0, 255))}
                  placeholder="you@email.com" maxLength={255} inputMode="email" autoComplete="email"
                  className="w-full px-3 py-2.5 rounded-xl text-[14px] outline-none placeholder:text-gray-400"
                  style={{ background: "#F9FAFB", border: "1px solid #E5E7EB", color: "#0A1220", caretColor: "#C41E3A" }} />
                <input type="tel" value={editPhone} onChange={e => setEditPhone(e.target.value.slice(0, 32))}
                  placeholder="Phone (optional)" maxLength={32} inputMode="tel" autoComplete="tel"
                  className="w-full px-3 py-2.5 rounded-xl text-[14px] outline-none placeholder:text-gray-400"
                  style={{ background: "#F9FAFB", border: "1px solid #E5E7EB", color: "#0A1220", caretColor: "#C41E3A" }} />
                <button onClick={() => setEditing(false)} className="text-[11px] font-semibold pt-1" style={{ color: "#9CA3AF" }}>
                  Cancel
                </button>
              </>
            ) : (
              <div className="space-y-1.5">
                <div className="flex justify-between text-[13px]"><span style={{ color: "#9CA3AF" }}>Name</span><span style={{ color: "#0A1220" }} className="font-semibold">{displayName === "Guest" ? "—" : displayName}</span></div>
                <div className="flex justify-between text-[13px]"><span style={{ color: "#9CA3AF" }}>Email</span><span style={{ color: "#0A1220" }} className="font-semibold truncate ml-3">{displayEmail || "—"}</span></div>
                <div className="flex justify-between text-[13px]"><span style={{ color: "#9CA3AF" }}>Phone</span><span style={{ color: "#0A1220" }} className="font-semibold">{editPhone || "—"}</span></div>
              </div>
            )}
          </div>
        </motion.div>

        {/* My Goals — opens HealthProfileSheet */}
        <motion.button initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
          onClick={() => setGoalsOpen(true)}
          className="w-full rounded-2xl px-4 py-3.5 flex items-center gap-3 text-left bg-white"
          style={{ border: "1px solid #E5E7EB" }}
        >
          <div className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: "#B0202F" }}>
            <Crown size={16} color="#FFD700" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[14px] font-bold" style={{ color: "#0A1220" }}>My Goals</p>
            <p className="text-[11px]" style={{ color: "#9CA3AF" }}>Tune scans to your goals, diet & what you avoid</p>
          </div>
          <ChevronRight size={16} style={{ color: "#D1D5DB" }} />
        </motion.button>


        {/* Plus preview — Personalization + Alerts in one card */}
        {!isPlus ? (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.09 }}
            className="rounded-2xl bg-white overflow-hidden relative" style={{ border: "1px solid #E5E7EB" }}>
            {/* Header */}
            <div className="flex items-center justify-between px-4 pt-4 pb-1">
              <h3 className="font-bold text-[15px]" style={{ color: "#0A1220" }}>Personalization & Alerts</h3>
              <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-full" style={{ background: "rgba(176,32,47,0.08)", color: "#B0202F" }}>
                <Lock size={9} /> PLUS
              </span>
            </div>
            <p className="px-4 text-[12px] mb-3" style={{ color: "#9CA3AF" }}>
              Tune every scan to your skin, diet, allergies and the additives you avoid.
            </p>

            {/* Blurred preview content */}
            <div className="pointer-events-none select-none" style={{ filter: "blur(3px)", opacity: 0.85 }}>
              <div className="grid grid-cols-2 gap-2 px-4 pb-3">
                {[
                  { emoji: "🧴", title: "Skin type", sub: "Dry · Oily · Sensitive" },
                  { emoji: "💄", title: "Cosmetic prefs", sub: "Fragrance-free · Vegan" },
                  { emoji: "🥗", title: "Diet", sub: "Vegan · Keto · Halal" },
                  { emoji: "💪", title: "Goals", sub: "More protein · Less sugar" },
                  { emoji: "🤱", title: "Life stage", sub: "Pregnant · Nursing · Kids" },
                  { emoji: "⚠️", title: "Allergies", sub: "Nuts · Gluten · Dairy" },
                ].map(p => (
                  <div key={p.title} className="rounded-xl p-2.5" style={{ background: "#F9FAFB", border: "1px solid #F3F4F6" }}>
                    <div className="flex items-center gap-1.5">
                      <span style={{ fontSize: 14 }}>{p.emoji}</span>
                      <p className="font-bold text-[12px]" style={{ color: "#0A1220" }}>{p.title}</p>
                    </div>
                    <p className="text-[10px] mt-0.5 leading-tight" style={{ color: "#9CA3AF" }}>{p.sub}</p>
                  </div>
                ))}
              </div>
              <div className="px-4 pb-3">
                <p className="text-[11px] font-bold uppercase tracking-wider mb-2" style={{ color: "#6B7280" }}>My alerts</p>
                {PRESET_ALERTS.slice(0, 4).map((preset, i) => (
                  <div key={preset.code} className="flex items-center justify-between py-2" style={{ borderTop: i === 0 ? "none" : "1px solid #F3F4F6" }}>
                    <span className="text-[13px]" style={{ color: "#0A1220" }}>{preset.name}</span>
                    <span className="w-[40px] h-[24px] rounded-full" style={{ background: "#E5E7EB" }} />
                  </div>
                ))}
              </div>
            </div>

            {/* Brand-red unlock CTA */}
            <button onClick={() => openUpgrade("Personalization")}
              className="w-full flex items-center justify-center gap-2 py-3.5"
              style={{ background: "linear-gradient(135deg, #C41E3A, #9E1830)" }}>
              <Crown size={14} color="#FFD700" />
              <span className="text-[14px] font-bold text-white">Unlock with Plus</span>
            </button>
          </motion.div>
        ) : (
          /* PLUS users get the real, interactive Alerts panel */
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="rounded-2xl bg-white overflow-hidden relative" style={{ border: "1px solid #E5E7EB" }}>
            <div className="flex items-center justify-between px-4 pt-4 pb-2">
              <h3 className="font-bold text-[15px]" style={{ color: "#0A1220" }}>My Alerts</h3>
              <span className="text-[11px] font-bold" style={{ color: "#B0202F" }}>{activeCount} on</span>
            </div>
            <div>
              {PRESET_ALERTS.map((preset, i) => {
                const active = activeAlertCodes.has(preset.code);
                return (
                  <div key={preset.code}
                    className="flex items-center justify-between px-4 py-3"
                    style={{ borderTop: "1px solid #F3F4F6" }}
                  >
                    <span className="text-[14px]" style={{ color: "#0A1220" }}>{preset.name}</span>
                    <button onClick={() => toggleAlert(preset)} aria-label={`Toggle ${preset.name}`}
                      className="relative w-[44px] h-[26px] rounded-full transition-colors"
                      style={{ background: active ? "#B0202F" : "#E5E7EB" }}
                    >
                      <span className="absolute top-[2px] left-[2px] w-[22px] h-[22px] rounded-full bg-white transition-transform shadow"
                        style={{ transform: active ? "translateX(18px)" : "translateX(0)" }} />
                    </button>
                  </div>
                );
              })}
              {alerts.filter(a => !PRESET_ALERTS.some(p => p.code === a.ingredient_code)).map(alert => (
                <div key={alert.id} className="flex items-center justify-between px-4 py-3" style={{ borderTop: "1px solid #F3F4F6" }}>
                  <span className="text-[14px]" style={{ color: "#0A1220" }}>{alert.ingredient_name}</span>
                  <button onClick={() => removeAlert(alert.id)}><X size={16} style={{ color: "#9CA3AF" }} /></button>
                </div>
              ))}
              <div className="px-4 py-3" style={{ borderTop: "1px solid #F3F4F6" }}>
                <AnimatePresence mode="wait">
                  {showCustomInput ? (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex gap-2">
                      <input value={customAlert} onChange={e => setCustomAlert(e.target.value.slice(0, 200))}
                        onKeyDown={e => e.key === "Enter" && addCustomAlert()}
                        placeholder="e.g. Carrageenan" maxLength={200} autoFocus
                        className="flex-1 text-[14px] px-3 py-2 rounded-xl outline-none"
                        style={{ background: "#F9FAFB", border: "1px solid #E5E7EB", color: "#0A1220" }} />
                      <button onClick={addCustomAlert} className="px-3 py-2 rounded-xl text-[13px] font-bold text-white" style={{ background: "#B0202F" }}>Add</button>
                      <button onClick={() => { setShowCustomInput(false); setCustomAlert(""); }} className="px-2 text-[13px]" style={{ color: "#9CA3AF" }}>Cancel</button>
                    </motion.div>
                  ) : (
                    <button onClick={() => setShowCustomInput(true)}
                      className="flex items-center gap-1.5 text-[13px] font-semibold" style={{ color: "#B0202F" }}>
                      <Plus size={14} /> Add custom
                    </button>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </motion.div>
        )}

        {/* Social */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <SocialLinks variant="pill" />
        </motion.div>

        {/* Sign out */}
        {user && (
          <motion.button initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
            onClick={handleSignOut}
            className="w-full flex items-center justify-center gap-2 rounded-2xl px-4 py-3.5 bg-white"
            style={{ border: "1px solid #E5E7EB" }}
          >
            <LogOut size={15} style={{ color: "#EF4444" }} />
            <span className="text-[14px] font-semibold" style={{ color: "#EF4444" }}>Sign Out</span>
          </motion.button>
        )}
      </div>

      <HealthProfileSheet open={goalsOpen} onClose={() => setGoalsOpen(false)} />
    </div>
  );
}

