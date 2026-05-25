import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Sparkles, Users, Search, Bell, Check } from "lucide-react";
import { useSubscription } from "@/context/SubscriptionContext";
import { useAuth } from "@/context/AuthContext";
import { AuthSheet } from "./AuthSheet";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { trackEvent } from "@/lib/analytics";
import skaapLogo from "@/assets/skaap-logo.png";

const FEATURES = [
  { icon: Sparkles, title: "AI Personalization", desc: "Learns your goals" },
  { icon: Users, title: "Community Intelligence", desc: "Trending near you" },
  { icon: Search, title: "Search any product", desc: "No barcode needed" },
  { icon: Bell, title: "Custom alerts", desc: "Gluten, palm oil & more" },
];

type TierKey = "supporter" | "member" | "champion";

const TIERS: { key: TierKey; price: string; label: string; sub: string; recurring: boolean; note?: string }[] = [
  { key: "supporter", price: "$2.99",  label: "Supporter", sub: "/month", recurring: true },
  { key: "member",    price: "$15.99", label: "Member",    sub: "/year",  recurring: false, note: "Save 55% vs monthly" },
  { key: "champion",  price: "$20",    label: "Champion",  sub: "/year",  recurring: false },
];

export function UpgradeSheet() {
  const { showUpgradeSheet, closeUpgrade, upgradeFeature } = useSubscription();
  const { user } = useAuth();
  const [selected, setSelected] = useState<TierKey>("champion");
  const [authOpen, setAuthOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleCTA = async () => {
    if (!user) { setAuthOpen(true); return; }
    setLoading(true);
    trackEvent("checkout_started", { tier: selected });
    try {
      const { data, error } = await supabase.functions.invoke("create-checkout", {
        body: { tier: selected },
      });
      if (error) throw error;
      if (data?.error === "already_subscribed") {
        toast.info(data.message || "You're already a SKAAP supporter, thank you!");
        closeUpgrade();
        setLoading(false);
        return;
      }
      if (data?.url) {
        // Open Stripe checkout in a new tab
        window.open(data.url, "_blank", "noopener,noreferrer");
        closeUpgrade();
      }
    } catch {
      toast.error("Could not start checkout. Please try again.");
    }
    setLoading(false);
  };

  const tier = TIERS.find(t => t.key === selected)!;

  return (
    <AnimatePresence>
      {showUpgradeSheet && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-[80] flex items-end justify-center"
          onClick={closeUpgrade}
        >
          <div className="absolute inset-0 bg-black/40" />
          <motion.div
            initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 26, stiffness: 200 }}
            className="relative w-full z-10 overflow-y-auto bg-white"
            style={{ maxHeight: "92vh", maxWidth: 430, borderRadius: "24px 24px 0 0", boxShadow: "0 -4px 32px rgba(0,0,0,0.12)" }}
            onClick={e => e.stopPropagation()}
          >
            <button onClick={closeUpgrade}
              className="absolute top-4 right-4 z-10 w-9 h-9 flex items-center justify-center rounded-full"
              style={{ background: "#F3F4F6" }} aria-label="Close">
              <X size={18} color="#374151" />
            </button>

            <div className="flex justify-center pt-3">
              <div style={{ width: 36, height: 4, borderRadius: 99, background: "#E5E7EB" }} />
            </div>

            <div className="px-5 pt-6 pb-6">
              <div className="flex items-center gap-2.5">
                <img src={skaapLogo} alt="SKAAP" className="h-7 object-contain" />
                {upgradeFeature && (
                  <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full" style={{ background: "#FEF2F2", color: "#C41E3A" }}>
                    ✦ {upgradeFeature}
                  </span>
                )}
              </div>

              <h2 className="font-extrabold text-[22px] leading-tight mt-3" style={{ color: "#0A1220" }}>
                See what your area is scanning, live.
              </h2>
              <p className="text-[13px] mt-1" style={{ color: "#6B7280" }}>
                All features. Pay what feels right.
              </p>

              {/* Tier picker */}
              <div className="mt-5 grid grid-cols-2 gap-2">
                {TIERS.map(t => {
                  const active = t.key === selected;
                  return (
                    <button
                      key={t.key}
                      onClick={() => setSelected(t.key)}
                      className="text-left p-3 rounded-2xl transition-all"
                      style={{
                        background: active ? "#FFFFFF" : "#F9FAFB",
                        border: active ? "2px solid #C41E3A" : "1px solid #E5E7EB",
                        boxShadow: active ? "0 4px 14px rgba(196,30,58,0.12)" : "none",
                      }}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-extrabold text-[16px]" style={{ color: "#0A1220" }}>
                          {t.price}
                          <span className="font-medium text-[11px] ml-0.5" style={{ color: "#6B7280" }}>{t.sub}</span>
                        </span>
                        {active && <Check size={14} color="#C41E3A" strokeWidth={3} />}
                      </div>
                      <div className="text-[11px] font-semibold mt-0.5" style={{ color: active ? "#C41E3A" : "#6B7280" }}>
                        {t.label}
                      </div>
                      <div className="text-[10px] mt-0.5" style={{ color: t.note ? "#16A34A" : "#9CA3AF" }}>
                        {t.note ? t.note : t.recurring ? "Recurring · 7-day trial" : "One-time payment"}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Features */}
              <div className="mt-5 grid grid-cols-2 gap-2">
                {FEATURES.map((f, i) => {
                  const Icon = f.icon;
                  return (
                    <div key={i} className="flex items-center gap-2.5 p-2.5 rounded-xl" style={{ background: "#F9FAFB" }}>
                      <Icon size={16} color="#C41E3A" strokeWidth={1.8} className="flex-shrink-0" />
                      <div className="min-w-0">
                        <p className="font-semibold text-[12px] truncate" style={{ color: "#1A1A1A" }}>{f.title}</p>
                        <p className="text-[10px] truncate" style={{ color: "#9CA3AF" }}>{f.desc}</p>
                      </div>
                    </div>
                  );
                })}
              </div>

              <motion.button
                whileTap={{ scale: 0.97 }} onClick={handleCTA} disabled={loading}
                className="w-full mt-5 font-bold text-[16px] text-white flex items-center justify-center disabled:opacity-60"
                style={{
                  height: 52, borderRadius: 14,
                  background: "linear-gradient(135deg, #C41E3A, #9E1830)",
                  boxShadow: "0 4px 16px rgba(196,30,58,0.35)",
                }}
              >
                {loading ? "Opening checkout..." : `Support SKAAP, ${tier.price}${tier.sub}`}
              </motion.button>

              <p className="text-center mt-3 text-[10px] leading-relaxed" style={{ color: "#9CA3AF" }}>
                Secure payment via Stripe.{" "}
                {tier.recurring ? "Cancel anytime." : "One-time. No renewal."} Opens in a new tab.
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
      <AuthSheet open={authOpen} onClose={() => setAuthOpen(false)} onSuccess={() => { setAuthOpen(false); handleCTA(); }} />
    </AnimatePresence>
  );
}
