import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Search, WifiOff, SlidersHorizontal, BarChart3, Flame, Share2 } from "lucide-react";
import { useSubscription } from "@/context/SubscriptionContext";
import { useAuth } from "@/context/AuthContext";
import { AuthSheet } from "./AuthSheet";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Slider } from "@/components/ui/slider";

const FEATURES = [
  { icon: Search, title: "Search", desc: "Search any product by name, without having to scan it." },
  { icon: WifiOff, title: "Offline mode", desc: "Scan your items even when your phone has no signal." },
  { icon: SlidersHorizontal, title: "Ingredient alerts", desc: "Get warned about palm oil, gluten, lactose, and more." },
  { icon: BarChart3, title: "Weekly Kitchen Report", desc: "See how your eating habits change week over week." },
  { icon: Flame, title: "Streak tracking", desc: "Build healthy scanning streaks and stay motivated." },
  { icon: Share2, title: "Share cards", desc: "Share beautiful product cards with friends and family." },
];

const PRICE_TIERS = [
  { value: 0, label: "$9.99/yr", amount: "$9.99/year" },
  { value: 33, label: "$14.99/yr", amount: "$14.99/year" },
  { value: 66, label: "$19.99/yr", amount: "$19.99/year" },
  { value: 100, label: "$24.99/yr", amount: "$24.99/year" },
];

function getClosestTier(val: number) {
  return PRICE_TIERS.reduce((prev, curr) =>
    Math.abs(curr.value - val) < Math.abs(prev.value - val) ? curr : prev
  );
}

export function UpgradeSheet() {
  const { showUpgradeSheet, closeUpgrade, upgradeFeature } = useSubscription();
  const { user } = useAuth();
  const [sliderVal, setSliderVal] = useState([33]);
  const [billingMode, setBillingMode] = useState<"annual" | "monthly">("annual");
  const [authOpen, setAuthOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const tier = getClosestTier(sliderVal[0]);

  const handleCTA = async () => {
    if (!user) {
      setAuthOpen(true);
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("create-checkout", {
        body: { billing: billingMode },
      });
      if (error) throw error;
      if (data?.url) {
        window.open(data.url, "_blank");
      }
    } catch (err: any) {
      toast.error("Could not start checkout. Please try again.");
    }
    setLoading(false);
    closeUpgrade();
  };

  return (
    <AnimatePresence>
      {showUpgradeSheet && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[80] flex items-end justify-center"
          onClick={closeUpgrade}
        >
          <div className="absolute inset-0 bg-black/30" />

          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 26, stiffness: 200 }}
            className="relative w-full z-10 overflow-y-auto"
            style={{
              maxHeight: "92vh",
              maxWidth: 430,
              background: "#FFFFFF",
              borderRadius: "24px 24px 0 0",
              boxShadow: "0 -4px 32px rgba(0,0,0,0.12)",
            }}
            onClick={e => e.stopPropagation()}
          >
            {/* Close */}
            <button onClick={closeUpgrade}
              className="absolute top-4 left-4 z-10 w-9 h-9 flex items-center justify-center rounded-full"
              style={{ background: "#F3F4F6" }}
              aria-label="Close">
              <X size={18} color="#374151" />
            </button>

            {/* Drag handle */}
            <div className="flex justify-center pt-3">
              <div style={{ width: 36, height: 4, borderRadius: 99, background: "#E5E7EB" }} />
            </div>

            <div className="px-6 pt-10 pb-8">
              {/* Header */}
              <p className="text-[12px] font-bold tracking-[0.15em] uppercase" style={{ color: "#E8314A" }}>
                MEMBER ACCESS
              </p>
              <h2 className="font-extrabold text-[26px] leading-tight mt-2" style={{ color: "#1A1A1A" }}>
                Become a member,{"\n"}support SKAAP
              </h2>

              {upgradeFeature && (
                <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full" style={{ background: "#FEF2F2" }}>
                  <span className="text-[12px] font-semibold" style={{ color: "#E8314A" }}>
                    ✦ {upgradeFeature} requires Plus
                  </span>
                </div>
              )}

              {/* Features */}
              <div className="mt-8 space-y-5">
                {FEATURES.map((f, i) => {
                  const Icon = f.icon;
                  return (
                    <div key={i} className="flex items-start gap-4">
                      <div className="flex-shrink-0 w-11 h-11 rounded-2xl flex items-center justify-center" style={{ background: "#F9FAFB", border: "1px solid #F3F4F6" }}>
                        <Icon size={22} color="#1A1A1A" strokeWidth={1.5} />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-bold text-[15px]" style={{ color: "#1A1A1A" }}>{f.title}</h3>
                        <p className="text-[13px] mt-0.5 leading-relaxed" style={{ color: "#6B7280" }}>{f.desc}</p>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Billing toggle */}
              <div className="mt-10 flex items-center gap-2 p-1 rounded-2xl" style={{ background: "#F3F4F6" }}>
                <button
                  onClick={() => setBillingMode("annual")}
                  className="flex-1 text-center py-2.5 rounded-xl text-[13px] font-bold transition-all"
                  style={{
                    background: billingMode === "annual" ? "#FFFFFF" : "transparent",
                    color: billingMode === "annual" ? "#1A1A1A" : "#9CA3AF",
                    boxShadow: billingMode === "annual" ? "0 1px 4px rgba(0,0,0,0.08)" : "none",
                  }}
                >
                  Annual · Save 37%
                </button>
                <button
                  onClick={() => setBillingMode("monthly")}
                  className="flex-1 text-center py-2.5 rounded-xl text-[13px] font-bold transition-all"
                  style={{
                    background: billingMode === "monthly" ? "#FFFFFF" : "transparent",
                    color: billingMode === "monthly" ? "#1A1A1A" : "#9CA3AF",
                    boxShadow: billingMode === "monthly" ? "0 1px 4px rgba(0,0,0,0.08)" : "none",
                  }}
                >
                  Monthly
                </button>
              </div>

              {/* Pay what you want (annual only) */}
              {billingMode === "annual" ? (
                <div className="mt-6">
                  <h3 className="font-extrabold text-[22px]" style={{ color: "#1A1A1A" }}>
                    Pay what you want
                  </h3>
                  <p className="text-[11px] font-bold tracking-[0.1em] uppercase mt-1" style={{ color: "#9CA3AF" }}>
                    NO COMMITMENT
                  </p>

                  <div className="flex flex-col items-center mt-6">
                    <div className="w-20 h-20 rounded-full flex items-center justify-center" style={{ background: "#F9FAFB", border: "1px solid #F3F4F6" }}>
                      <span className="text-[40px]">🐑</span>
                    </div>

                    <p className="font-extrabold text-[28px] mt-4" style={{ color: "#E8314A" }}>
                      {tier.amount}
                    </p>
                    <p className="text-[13px] mt-1" style={{ color: "#6B7280" }}>
                      Your participation helps the project to grow.
                    </p>
                  </div>

                  <div className="mt-6 px-2">
                    <Slider
                      value={sliderVal}
                      onValueChange={setSliderVal}
                      max={100}
                      step={1}
                      className="w-full [&_[data-radix-slider-track]]:h-[6px] [&_[data-radix-slider-track]]:bg-[#E5E7EB] [&_[data-radix-slider-range]]:bg-[#E8314A] [&_[data-radix-slider-thumb]]:w-7 [&_[data-radix-slider-thumb]]:h-7 [&_[data-radix-slider-thumb]]:bg-white [&_[data-radix-slider-thumb]]:border-2 [&_[data-radix-slider-thumb]]:border-[#E8314A] [&_[data-radix-slider-thumb]]:shadow-md"
                    />
                  </div>
                </div>
              ) : (
                <div className="mt-6 flex flex-col items-center">
                  <div className="w-20 h-20 rounded-full flex items-center justify-center" style={{ background: "#F9FAFB", border: "1px solid #F3F4F6" }}>
                    <span className="text-[40px]">🐑</span>
                  </div>
                  <p className="font-extrabold text-[28px] mt-4" style={{ color: "#E8314A" }}>
                    $1.99/month
                  </p>
                  <p className="text-[13px] mt-1" style={{ color: "#6B7280" }}>
                    Cancel anytime. No commitment.
                  </p>
                </div>
              )}

              {/* CTA */}
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={handleCTA}
                disabled={loading}
                className="w-full mt-8 font-bold text-[17px] text-white flex items-center justify-center disabled:opacity-60"
                style={{
                  height: 56,
                  borderRadius: 16,
                  background: "linear-gradient(135deg, #E8314A, #c42040)",
                  boxShadow: "0 4px 16px rgba(232,49,74,0.3)",
                }}
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <motion.span animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full inline-block" />
                    Starting checkout...
                  </span>
                ) : (
                  "Become a member"
                )}
              </motion.button>

              {/* 7-day trial badge */}
              <div className="flex justify-center mt-3">
                <span className="text-[11px] font-semibold px-3 py-1 rounded-full" style={{ background: "#F0FDF4", color: "#15803D" }}>
                  ✓ 7-day free trial included
                </span>
              </div>

              {/* Fine print */}
              <p className="text-center mt-4 text-[11px] leading-relaxed" style={{ color: "#9CA3AF" }}>
                Payment will be processed securely via Stripe. Your subscription renews {billingMode === "annual" ? "annually" : "monthly"} at the same price, unless canceled 24 hours before renewal.
              </p>
              <div className="flex items-center justify-center gap-3 mt-3 pb-2">
                <button className="text-[13px] font-medium" style={{ color: "#E8314A" }}>Privacy policy</button>
                <span style={{ color: "#D1D5DB" }}>·</span>
                <button className="text-[13px] font-medium" style={{ color: "#E8314A" }}>Restore purchase</button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
      <AuthSheet open={authOpen} onClose={() => setAuthOpen(false)} onSuccess={() => { setAuthOpen(false); handleCTA(); }} />
    </AnimatePresence>
  );
}
