import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { User, ArrowLeft, LogOut, Bell, Shield, ChevronRight, Plus, X, Crown, Heart, Activity, Smartphone, ExternalLink } from "lucide-react";
import { SocialLinks } from "@/components/scan/SocialLinks";
import { ShareRewardsCard } from "@/components/scan/ShareRewardsCard";
import { useAuth } from "@/context/AuthContext";
import { useSubscription } from "@/context/SubscriptionContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface ProfileScreenProps {
  onBack: () => void;
}

const PRESET_ALERTS = [
  { name: "Gluten", code: "gluten" },
  { name: "Lactose", code: "lactose" },
  { name: "Palm Oil", code: "palm-oil" },
  { name: "Soy", code: "soy" },
  { name: "Peanuts", code: "peanuts" },
  { name: "Tree Nuts", code: "tree-nuts" },
  { name: "Eggs", code: "eggs" },
  { name: "Shellfish", code: "shellfish" },
  { name: "Sulfites", code: "sulfites" },
  { name: "Aspartame", code: "e951" },
  { name: "MSG", code: "e621" },
  { name: "Tartrazine", code: "e102" },
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
  const [loadingAlerts, setLoadingAlerts] = useState(true);
  const [customAlert, setCustomAlert] = useState("");
  const [showCustomInput, setShowCustomInput] = useState(false);

  // Load alerts
  useEffect(() => {
    if (!user) { setLoadingAlerts(false); return; }
    supabase
      .from("user_alerts")
      .select("*")
      .eq("user_id", user.id)
      .then(({ data }) => {
        if (data) setAlerts(data as AlertItem[]);
        setLoadingAlerts(false);
      });
  }, [user]);

  const toggleAlert = useCallback(async (preset: typeof PRESET_ALERTS[0]) => {
    if (!user) return;
    if (!isPlus) { openUpgrade(); return; }

    const existing = alerts.find(a => a.ingredient_code === preset.code);
    if (existing) {
      // Remove
      await supabase.from("user_alerts").delete().eq("id", existing.id);
      setAlerts(prev => prev.filter(a => a.id !== existing.id));
    } else {
      // Add
      const { data } = await supabase.from("user_alerts").insert({
        user_id: user.id,
        ingredient_name: preset.name,
        ingredient_code: preset.code,
        active: true,
      }).select().single();
      if (data) setAlerts(prev => [...prev, data as AlertItem]);
    }
  }, [user, alerts, isPlus, openUpgrade]);

  const addCustomAlert = useCallback(async () => {
    if (!user || !customAlert.trim()) return;
    if (!isPlus) { openUpgrade(); return; }

    const name = customAlert.trim();
    const code = name.toLowerCase().replace(/\s+/g, "-");
    if (alerts.some(a => a.ingredient_code === code)) {
      toast.error("Alert already exists");
      return;
    }

    const { data } = await supabase.from("user_alerts").insert({
      user_id: user.id,
      ingredient_name: name,
      ingredient_code: code,
      active: true,
    }).select().single();
    if (data) {
      setAlerts(prev => [...prev, data as AlertItem]);
      setCustomAlert("");
      setShowCustomInput(false);
      toast.success(`Alert added for ${name}`);
    }
  }, [user, customAlert, alerts, isPlus, openUpgrade]);

  const removeAlert = useCallback(async (id: string) => {
    await supabase.from("user_alerts").delete().eq("id", id);
    setAlerts(prev => prev.filter(a => a.id !== id));
  }, []);

  const handleSignOut = async () => {
    await signOut();
    onBack();
  };

  const activeAlertCodes = new Set(alerts.map(a => a.ingredient_code));

  return (
    <div className="min-h-screen" style={{ maxWidth: 430, margin: "0 auto", background: "#F9FAFB" }}>
      {/* Header */}
      <div className="flex items-center gap-3 px-5 pt-[env(safe-area-inset-top,12px)] h-14">
        <button onClick={onBack} className="flex items-center">
          <ArrowLeft size={20} style={{ color: "#0A1220" }} />
        </button>
        <h1 className="font-extrabold text-[20px] tracking-tight" style={{ color: "#0A1220" }}>Profile</h1>
      </div>

      <div className="px-5 pt-4 pb-28 space-y-4">
        {/* User card */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl p-4 flex items-center gap-3.5" style={{ border: "1px solid #E5E7EB" }}>
          <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ background: "#0A1220" }}>
            <User size={22} color="#fff" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-[15px] font-bold truncate tracking-tight" style={{ color: "#0A1220" }}>
              {user?.user_metadata?.full_name || "User"}
            </h2>
            <p className="text-[11px] truncate" style={{ color: "#9CA3AF" }}>
              {user?.email || "—"}
            </p>
          </div>
          {isPlus && (
            <span className="text-[10px] font-bold px-2.5 py-1 rounded-full" style={{ background: "rgba(176,32,47,0.1)", color: "#B0202F" }}>
              <Crown size={10} className="inline mr-1" />PLUS
            </span>
          )}
        </motion.div>

        {/* Subscription status */}
        {!isPlus && (
          <motion.button
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
            onClick={() => openUpgrade()}
            className="w-full rounded-2xl p-4 flex items-center gap-3 text-left"
            style={{ background: "linear-gradient(135deg, #B0202F, #8a1825)" }}
          >
            <Crown size={20} color="#fff" />
            <div className="flex-1">
              <p className="text-[13px] font-bold text-white">Upgrade to SKAAP Plus</p>
              <p className="text-[11px] text-white/60">Unlimited history, alerts, kitchen reports</p>
            </div>
            <ChevronRight size={16} color="rgba(255,255,255,0.5)" />
          </motion.button>
        )}

        {/* ─── Ingredient Alerts ─── */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Shield size={16} style={{ color: "#B0202F" }} />
              <h3 className="font-bold text-[14px]" style={{ color: "#0A1220" }}>My Alerts</h3>
            </div>
            {!isPlus && (
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ background: "#FEF3C7", color: "#92400E" }}>Plus only</span>
            )}
          </div>
          <p className="text-[11px] mb-3" style={{ color: "#9CA3AF" }}>Get warned when a scanned product contains these ingredients.</p>

          {/* Preset toggles */}
          <div className="flex flex-wrap gap-2 mb-3">
            {PRESET_ALERTS.map(preset => {
              const isActive = activeAlertCodes.has(preset.code);
              return (
                <motion.button
                  key={preset.code}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => toggleAlert(preset)}
                  className="text-[12px] font-semibold px-3 py-1.5 rounded-full transition-all"
                  style={{
                    background: isActive ? "rgba(176,32,47,0.12)" : "#F3F4F6",
                    color: isActive ? "#B0202F" : "#6B7280",
                    border: isActive ? "1.5px solid #B0202F" : "1.5px solid transparent",
                  }}
                >
                  {isActive && "✓ "}{preset.name}
                </motion.button>
              );
            })}
          </div>

          {/* Custom alerts */}
          {alerts.filter(a => !PRESET_ALERTS.some(p => p.code === a.ingredient_code)).length > 0 && (
            <div className="space-y-1.5 mb-3">
              {alerts.filter(a => !PRESET_ALERTS.some(p => p.code === a.ingredient_code)).map(alert => (
                <div key={alert.id} className="flex items-center justify-between bg-white rounded-xl px-3 py-2" style={{ border: "1px solid #E5E7EB" }}>
                  <span className="text-[12px] font-semibold" style={{ color: "#0A1220" }}>{alert.ingredient_name}</span>
                  <button onClick={() => removeAlert(alert.id)} className="p-1">
                    <X size={14} style={{ color: "#EF4444" }} />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Add custom */}
          <AnimatePresence>
            {showCustomInput ? (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                className="flex gap-2">
                <input
                  value={customAlert}
                  onChange={e => setCustomAlert(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && addCustomAlert()}
                  placeholder="e.g. E150d, Carrageenan"
                  className="flex-1 text-[12px] px-3 py-2 rounded-xl outline-none"
                  style={{ background: "#fff", border: "1px solid #E5E7EB", color: "#0A1220" }}
                  autoFocus
                />
                <button onClick={addCustomAlert} className="px-3 py-2 rounded-xl text-[12px] font-bold text-white" style={{ background: "#B0202F" }}>Add</button>
                <button onClick={() => { setShowCustomInput(false); setCustomAlert(""); }} className="px-2 py-2 rounded-xl text-[12px]" style={{ color: "#6B7280" }}>Cancel</button>
              </motion.div>
            ) : (
              <motion.button
                onClick={() => isPlus ? setShowCustomInput(true) : openUpgrade()}
                className="flex items-center gap-1.5 text-[12px] font-semibold"
                style={{ color: "#B0202F" }}
              >
                <Plus size={14} /> Add custom ingredient
              </motion.button>
            )}
          </AnimatePresence>
        </motion.div>

        {/* ─── Connected Health Apps ─── */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
          <div className="flex items-center gap-2 mb-2">
            <Activity size={16} style={{ color: "#B0202F" }} />
            <h3 className="font-bold text-[14px]" style={{ color: "#0A1220" }}>Health Connections</h3>
          </div>
          <p className="text-[11px] mb-3" style={{ color: "#9CA3AF" }}>Sync your nutrition data with health platforms.</p>

          <div className="bg-white rounded-2xl overflow-hidden" style={{ border: "1px solid #E5E7EB" }}>
            {[
              { name: "Apple Health", icon: "🍎", desc: "Sync nutrients & calories", available: false },
              { name: "Google Fit", icon: "💚", desc: "Track food intake", available: false },
              { name: "MyFitnessPal", icon: "🔥", desc: "Log scanned products", available: false },
              { name: "Samsung Health", icon: "💙", desc: "Nutrition tracking", available: false },
            ].map((app, i) => (
              <button key={app.name}
                onClick={() => toast.info(`${app.name} integration coming soon!`)}
                className="w-full flex items-center gap-3 px-4 py-3 text-left active:bg-gray-50 transition-colors"
                style={{ borderBottom: i < 3 ? "1px solid #F3F4F6" : "none" }}>
                <span className="text-[18px]">{app.icon}</span>
                <div className="flex-1 min-w-0">
                  <span className="text-[13px] font-semibold block" style={{ color: "#0A1220" }}>{app.name}</span>
                  <span className="text-[11px]" style={{ color: "#9CA3AF" }}>{app.desc}</span>
                </div>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ background: "#F3F4F6", color: "#9CA3AF" }}>Soon</span>
              </button>
            ))}
          </div>
        </motion.div>

        {/* ─── Settings ─── */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="bg-white rounded-2xl overflow-hidden" style={{ border: "1px solid #E5E7EB" }}>
          {[
            { icon: Bell, label: "Notifications", action: () => toast.info("Coming soon") },
          ].map((item, i) => {
            const Icon = item.icon;
            return (
              <button key={item.label} onClick={item.action}
                className="w-full flex items-center gap-3 px-4 py-3.5 text-left active:bg-gray-50 transition-colors"
                style={{ borderBottom: "1px solid #F3F4F6" }}>
                <Icon size={16} style={{ color: "#9CA3AF" }} />
                <span className="flex-1 text-[13px] font-medium" style={{ color: "#0A1220" }}>{item.label}</span>
                <ChevronRight size={13} style={{ color: "#D1D5DB" }} />
              </button>
            );
          })}
        </motion.div>

        {/* Social Links */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <SocialLinks variant="pill" />
        </motion.div>

        {/* Sign out */}
        <motion.button
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
          onClick={handleSignOut}
          className="w-full flex items-center gap-3 bg-white rounded-2xl px-4 py-3.5 text-left active:bg-gray-50 transition-colors"
          style={{ border: "1px solid #E5E7EB" }}
        >
          <LogOut size={16} style={{ color: "#EF4444" }} />
          <span className="text-[13px] font-medium" style={{ color: "#EF4444" }}>Sign Out</span>
        </motion.button>
      </div>
    </div>
  );
}
