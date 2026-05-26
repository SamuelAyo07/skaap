import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, LogOut, ChevronRight, Plus, X, Crown, Camera, Lock, Sparkles, Trash2, ImagePlus } from "lucide-react";
import { SocialLinks } from "@/components/scan/SocialLinks";
import { getUserFirstName, getUserName } from "@/components/scan/FirstScanSignupModal";
import { useAuth } from "@/context/AuthContext";
import { useSubscription } from "@/context/SubscriptionContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface ProfileScreenProps {
  onBack: () => void;
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
  const [gallery, setGallery] = useState<{ path: string; url: string }[]>([]);
  const [galleryBusy, setGalleryBusy] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  const localName = getUserName();
  const localFirst = getUserFirstName();
  const displayName = user?.user_metadata?.full_name || localName || "Guest";
  const firstName = displayName.split(" ")[0] || localFirst || "friend";
  const displayEmail = user?.email || (typeof window !== "undefined" ? localStorage.getItem("skaap_user_email_v1") : null) || "";
  const initial = (firstName[0] || "?").toUpperCase();

  // Load profile + alerts + gallery
  useEffect(() => {
    if (!user) return;
    supabase.from("profiles").select("avatar_url").eq("id", user.id).maybeSingle()
      .then(({ data }) => { if (data?.avatar_url) setAvatarUrl(data.avatar_url); });
    supabase.from("user_alerts").select("*").eq("user_id", user.id)
      .then(({ data }) => { if (data) setAlerts(data as AlertItem[]); });
    loadGallery();
  }, [user]);

  const loadGallery = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase.storage.from("avatars").list(`${user.id}/gallery`, {
      limit: 30, sortBy: { column: "created_at", order: "desc" },
    });
    if (!data) return;
    const items = data
      .filter(f => f.name && !f.name.startsWith("."))
      .map(f => {
        const path = `${user.id}/gallery/${f.name}`;
        const { data: pub } = supabase.storage.from("avatars").getPublicUrl(path);
        return { path, url: pub.publicUrl };
      });
    setGallery(items);
  }, [user]);

  const handleGalleryPick = () => {
    if (!user) { toast.error("Sign in to add photos"); return; }
    galleryInputRef.current?.click();
  };

  const handleGalleryUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length || !user) return;
    setGalleryBusy(true);
    try {
      for (const file of files.slice(0, 6)) {
        if (file.size > 5 * 1024 * 1024) { toast.error(`${file.name} too large (max 5 MB)`); continue; }
        const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
        const path = `${user.id}/gallery/${Date.now()}-${Math.random().toString(36).slice(2, 7)}.${ext}`;
        const { error } = await supabase.storage.from("avatars").upload(path, file, { contentType: file.type });
        if (error) { toast.error(error.message); continue; }
      }
      await loadGallery();
      toast.success("Photos added");
    } finally {
      setGalleryBusy(false);
      if (galleryInputRef.current) galleryInputRef.current.value = "";
    }
  };

  const handleGalleryDelete = async (path: string) => {
    if (!user) return;
    const { error } = await supabase.storage.from("avatars").remove([path]);
    if (error) { toast.error(error.message); return; }
    setGallery(prev => prev.filter(p => p.path !== path));
  };


  const handleAvatarPick = () => {
    if (!user) { toast.error("Sign in to add a photo"); return; }
    fileInputRef.current?.click();
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    if (file.size > 5 * 1024 * 1024) { toast.error("Image must be under 5 MB"); return; }
    setUploading(true);
    try {
      const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
      const path = `${user.id}/avatar-${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage.from("avatars").upload(path, file, { upsert: true, contentType: file.type });
      if (upErr) throw upErr;
      const { data: pub } = supabase.storage.from("avatars").getPublicUrl(path);
      const url = pub.publicUrl;
      await supabase.from("profiles").upsert({ id: user.id, avatar_url: url, email: user.email });
      setAvatarUrl(url);
      toast.success("Photo updated");
    } catch (err: any) {
      toast.error(err?.message || "Upload failed");
    } finally {
      setUploading(false);
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
    <div className="min-h-screen" style={{ maxWidth: 430, margin: "0 auto", background: "#FFFFFF" }}>
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
                <div className="w-3 h-3 rounded-full border-2 border-gray-300 border-t-[#B0202F] animate-spin" />
              ) : (
                <Camera size={13} style={{ color: "#0A1220" }} />
              )}
            </div>
            <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={handleAvatarUpload} className="hidden" />
          </div>
          <h2 className="mt-3 text-[20px] font-bold tracking-tight" style={{ color: "#0A1220" }}>{displayName}</h2>
          {displayEmail && <p className="text-[13px] mt-0.5" style={{ color: "#B0202F" }}>{displayEmail}</p>}
        </motion.div>

        {/* Photo gallery — free for everyone */}
        {user && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}
            className="rounded-2xl bg-white p-4" style={{ border: "1px solid #E5E7EB" }}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-[15px]" style={{ color: "#0A1220" }}>Photos</h3>
              <span className="text-[11px]" style={{ color: "#9CA3AF" }}>{gallery.length}/30</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <button onClick={handleGalleryPick} disabled={galleryBusy || gallery.length >= 30}
                className="aspect-square rounded-xl flex flex-col items-center justify-center gap-1 disabled:opacity-50"
                style={{ background: "#F9FAFB", border: "1px dashed #D1D5DB" }}>
                {galleryBusy ? (
                  <div className="w-4 h-4 rounded-full border-2 border-gray-300 border-t-[#B0202F] animate-spin" />
                ) : (
                  <>
                    <ImagePlus size={18} style={{ color: "#B0202F" }} />
                    <span className="text-[10px] font-semibold" style={{ color: "#6B7280" }}>Add</span>
                  </>
                )}
              </button>
              {gallery.map(item => (
                <div key={item.path} className="relative aspect-square rounded-xl overflow-hidden group" style={{ background: "#F3F4F6" }}>
                  <img src={item.url} alt="" className="w-full h-full object-cover" loading="lazy" />
                  <button onClick={() => handleGalleryDelete(item.path)}
                    className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/60 flex items-center justify-center"
                    aria-label="Delete photo">
                    <Trash2 size={11} color="#fff" />
                  </button>
                </div>
              ))}
            </div>
            <input ref={galleryInputRef} type="file" multiple accept="image/jpeg,image/png,image/webp"
              onChange={handleGalleryUpload} className="hidden" />
          </motion.div>
        )}


        {/* Try Skaap Plus — only if not plus */}
        {!isPlus && (
          <motion.button initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
            onClick={() => openUpgrade()}
            className="w-full rounded-2xl px-4 py-3.5 flex items-center gap-3 text-left bg-white"
            style={{ border: "1px solid #E5E7EB" }}
          >
            <div className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: "#B0202F" }}>
              <Sparkles size={16} color="#fff" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[14px] font-bold" style={{ color: "#0A1220" }}>Try Skaap Plus</p>
              <p className="text-[11px]" style={{ color: "#9CA3AF" }}>Live shelf intel + search</p>
            </div>
            <ChevronRight size={16} style={{ color: "#D1D5DB" }} />
          </motion.button>
        )}

        {/* My Alerts — Plus only */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="rounded-2xl bg-white overflow-hidden relative" style={{ border: "1px solid #E5E7EB" }}>
          <div className="flex items-center justify-between px-4 pt-4 pb-2">
            <h3 className="font-bold text-[15px]" style={{ color: "#0A1220" }}>My Alerts</h3>
            {isPlus ? (
              <span className="text-[11px] font-bold" style={{ color: "#B0202F" }}>{activeCount} on</span>
            ) : (
              <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-full" style={{ background: "rgba(176,32,47,0.08)", color: "#B0202F" }}>
                <Lock size={9} /> PLUS
              </span>
            )}
          </div>
          <div className={isPlus ? "" : "pointer-events-none opacity-50"}>
            {PRESET_ALERTS.map((preset, i) => {
              const active = activeAlertCodes.has(preset.code);
              return (
                <div key={preset.code}
                  className="flex items-center justify-between px-4 py-3"
                  style={{ borderTop: i === 0 ? "1px solid #F3F4F6" : "1px solid #F3F4F6" }}
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

            {/* Custom alerts */}
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
                  <button onClick={() => isPlus ? setShowCustomInput(true) : openUpgrade()}
                    className="flex items-center gap-1.5 text-[13px] font-semibold" style={{ color: "#B0202F" }}>
                    <Plus size={14} /> Add custom
                  </button>
                )}
              </AnimatePresence>
            </div>
          </div>

          {!isPlus && (
            <button onClick={() => openUpgrade()}
              className="absolute inset-0 flex flex-col items-center justify-center gap-2"
              style={{ background: "linear-gradient(180deg, rgba(255,255,255,0.4) 0%, rgba(255,255,255,0.92) 55%)" }}
            >
              <div className="flex items-center gap-2 px-4 py-2.5 rounded-full" style={{ background: "#0A1220" }}>
                <Crown size={14} color="#FFD700" />
                <span className="text-[13px] font-bold text-white">Unlock with Plus</span>
              </div>
              <p className="text-[11px] font-medium" style={{ color: "#6B7280" }}>Personalized intelligence for you</p>
            </button>
          )}
        </motion.div>

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
    </div>
  );
}
