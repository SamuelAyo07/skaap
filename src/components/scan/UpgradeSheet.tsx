import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Sparkles, Search, Bell, Heart, Check } from "lucide-react";
import { useSubscription } from "@/context/SubscriptionContext";
import { useAuth } from "@/context/AuthContext";
import { AuthSheet } from "./AuthSheet";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { trackEvent } from "@/lib/analytics";

const FEATURES = [
  { icon: Heart, title: "Personalized verdicts for your goals & diet" },
  { icon: Search, title: "Search 3M+ foods, cosmetics & skincare" },
  { icon: Bell, title: "Custom alerts for ingredients you avoid" },
  { icon: Sparkles, title: "Smart swaps & full additive details" },
];

type TierKey = "supporter" | "champion";

const TIERS: Record<TierKey, { price: string; label: string; sub: string; foot: string }> = {
  supporter: { price: "$4.99",  label: "MONTHLY", sub: "billed monthly",        foot: "Cancel anytime. No ads. No tracking." },
  champion:  { price: "$39.99", label: "YEARLY",  sub: "one-time · save 33%",   foot: "One year all access. No renewal." },
};

export function UpgradeSheet() {
  const { showUpgradeSheet, closeUpgrade } = useSubscription();
  const { user } = useAuth();
  const [selected, setSelected] = useState<TierKey>("supporter");
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
        window.open(data.url, "_blank", "noopener,noreferrer");
        closeUpgrade();
      }
    } catch {
      toast.error("Could not start checkout. Please try again.");
    }
    setLoading(false);
  };

  const tier = TIERS[selected];
  const ctaLabel = selected === "supporter"
    ? "Start $4.99/month"
    : "Get yearly all-access · $39.99";

  return (
    <AnimatePresence>
      {showUpgradeSheet && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-[80] flex items-end justify-center"
          onClick={closeUpgrade}
        >
          <div className="absolute inset-0 bg-black/60" />
          <motion.div
            initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 220 }}
            className="relative w-full z-10 overflow-y-auto"
            style={{
              maxHeight: "94vh",
              maxWidth: 430,
              borderRadius: "28px 28px 0 0",
              background: "radial-gradient(120% 70% at 0% 0%, #2A0A14 0%, #0A0A12 55%, #06060B 100%)",
              boxShadow: "0 -8px 40px rgba(0,0,0,0.5)",
              color: "#fff",
            }}
            onClick={e => e.stopPropagation()}
          >
            <div className="flex justify-center pt-3">
              <div style={{ width: 40, height: 4, borderRadius: 99, background: "rgba(255,255,255,0.18)" }} />
            </div>
            <button onClick={closeUpgrade}
              className="absolute top-3 right-4 z-10 w-9 h-9 flex items-center justify-center rounded-full"
              style={{ background: "rgba(255,255,255,0.08)" }} aria-label="Close">
              <X size={18} color="#fff" />
            </button>

            <div className="px-6 pt-6 pb-7">
              {/* Brand */}
              <div className="flex items-center gap-1.5">
                <span style={{ color: "#C41E3A", fontSize: 14 }}>✦</span>
                <span className="font-bold tracking-[0.18em] text-[12px]" style={{ color: "#C41E3A" }}>SKAAP PLUS</span>
              </div>

              <h2 className="font-extrabold leading-[1.05] mt-3" style={{ fontSize: 34, letterSpacing: -0.5 }}>
                Every feature,<br/>made for you.
              </h2>
              <p className="mt-2 text-[14px]" style={{ color: "rgba(255,255,255,0.55)" }}>
                Personalized scans across food, skincare and cosmetics.
              </p>

              {/* Feature card */}
              <div className="mt-5 p-4 rounded-2xl" style={{
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.08)",
                backdropFilter: "blur(20px)",
              }}>
                {FEATURES.map((f, i) => {
                  const Icon = f.icon;
                  return (
                    <div key={i} className="flex items-center gap-3" style={{ padding: "10px 0" }}>
                      <div className="flex items-center justify-center flex-shrink-0" style={{
                        width: 30, height: 30, borderRadius: 10,
                        background: "rgba(196,30,58,0.14)",
                      }}>
                        <Icon size={15} color="#FF4D6A" strokeWidth={2} />
                      </div>
                      <p className="text-[14px] font-medium" style={{ color: "rgba(255,255,255,0.92)" }}>{f.title}</p>
                    </div>
                  );
                })}
              </div>

              {/* Pricing tiles */}
              <div className="mt-4 grid grid-cols-2 gap-3">
                {(Object.keys(TIERS) as TierKey[]).map(key => {
                  const t = TIERS[key];
                  const active = key === selected;
                  return (
                    <button
                      key={key}
                      onClick={() => setSelected(key)}
                      className="text-left p-4 rounded-2xl transition-all relative"
                      style={{
                        background: active ? "rgba(196,30,58,0.12)" : "rgba(255,255,255,0.04)",
                        border: active ? "1.5px solid #C41E3A" : "1px solid rgba(255,255,255,0.08)",
                      }}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold tracking-[0.16em] text-[11px]" style={{ color: active ? "#FF4D6A" : "rgba(255,255,255,0.55)" }}>
                          {t.label}
                        </span>
                        {active && <Check size={14} color="#FF4D6A" strokeWidth={3} />}
                      </div>
                      <div className="font-extrabold mt-1.5" style={{ fontSize: 30, letterSpacing: -1 }}>
                        {t.price}
                      </div>
                      <div className="text-[11px] mt-0.5" style={{ color: key === "champion" ? "#22C55E" : "rgba(255,255,255,0.5)" }}>
                        {t.sub}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* CTA */}
              <motion.button
                whileTap={{ scale: 0.97 }} onClick={handleCTA} disabled={loading}
                className="w-full mt-4 font-bold text-[16px] text-white flex items-center justify-center disabled:opacity-60"
                style={{
                  height: 56, borderRadius: 16,
                  background: "linear-gradient(135deg, #E11D48, #C41E3A)",
                  boxShadow: "0 8px 24px rgba(196,30,58,0.45)",
                }}
              >
                {loading ? "Opening checkout..." : ctaLabel}
              </motion.button>

              <p className="text-center mt-3 text-[11px]" style={{ color: "rgba(255,255,255,0.4)" }}>
                {tier.foot}
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
      <AuthSheet open={authOpen} onClose={() => setAuthOpen(false)} />
    </AnimatePresence>
  );
}
