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
  {
    icon: Search,
    title: "Search",
    desc: "Search any product by name, without having to scan it.",
  },
  {
    icon: WifiOff,
    title: "Offline mode",
    desc: "Scan your items even when your phone has no signal.",
  },
  {
    icon: SlidersHorizontal,
    title: "Ingredient alerts",
    desc: "Get warned about palm oil, gluten, lactose, and more.",
  },
  {
    icon: BarChart3,
    title: "Weekly Kitchen Report",
    desc: "See how your eating habits change week over week.",
  },
  {
    icon: Flame,
    title: "Streak tracking",
    desc: "Build healthy scanning streaks and stay motivated.",
  },
  {
    icon: Share2,
    title: "Share cards",
    desc: "Share beautiful product cards with friends and family.",
  },
];

const PRICE_TIERS = [
  { value: 0, label: "$9.99/yr", price: "$9.99/year" },
  { value: 33, label: "$14.99/yr", price: "$14.99/year" },
  { value: 66, label: "$19.99/yr", price: "$19.99/year" },
  { value: 100, label: "$24.99/yr", price: "$24.99/year" },
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
        body: { billing: "annual" },
      });
      if (error) throw error;
      if (data?.url) {
        window.open(data.url, "_blank");
      }
    } catch (err: any) {
      toast.error("Could not start checkout");
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
              boxShadow: "0 -4px 24px rgba(0,0,0,0.08)",
            }}
            onClick={e => e.stopPropagation()}
          >
            {/* Close */}
            <button onClick={closeUpgrade}
              className="absolute top-4 left-4 z-10 w-9 h-9 flex items-center justify-center"
              aria-label="Close">
              <X size={22} color="#1A1A1A" />
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
              <h2 className="font-extrabold text-[28px] leading-tight mt-2" style={{ color: "#1A1A1A" }}>
                Become a member,{"\n"}support SKAAP
              </h2>

              {upgradeFeature && (
                <p className="text-[13px] mt-2" style={{ color: "#E8314A" }}>
                  {upgradeFeature} is a Plus feature
                </p>
              )}

              {/* Features */}
              <div className="mt-8 space-y-6">
                {FEATURES.map((f, i) => {
                  const Icon = f.icon;
                  return (
                    <div key={i} className="flex items-start gap-4">
                      <div className="flex-shrink-0 w-12 h-12 flex items-center justify-center">
                        <Icon size={28} color="#1A1A1A" strokeWidth={1.5} />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-bold text-[16px]" style={{ color: "#1A1A1A" }}>{f.title}</h3>
                        <p className="text-[14px] mt-0.5 leading-relaxed" style={{ color: "#6B7280" }}>{f.desc}</p>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Pay what you want section */}
              <div className="mt-10">
                <h3 className="font-extrabold text-[24px]" style={{ color: "#1A1A1A" }}>
                  Pay what you want
                </h3>
                <p className="text-[12px] font-bold tracking-[0.1em] uppercase mt-1" style={{ color: "#9CA3AF" }}>
                  NO COMMITMENT
                </p>

                {/* Mascot area */}
                <div className="flex flex-col items-center mt-6">
                  <div className="w-24 h-24 rounded-full flex items-center justify-center" style={{ background: "#F3F4F6" }}>
                    <span className="text-[48px]">🐑</span>
                  </div>

                  <p className="font-bold text-[22px] mt-4" style={{ color: "#E8314A" }}>
                    {tier.price}
                  </p>
                  <p className="text-[14px] mt-1" style={{ color: "#6B7280" }}>
                    Your participation helps the project to grow.
                  </p>
                </div>

                {/* Slider */}
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

              {/* CTA */}
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={handleCTA}
                className="w-full mt-8 font-bold text-[17px] text-white flex items-center justify-center"
                style={{
                  height: 56,
                  borderRadius: 14,
                  background: "#E8314A",
                }}
              >
                {loading ? "Starting checkout..." : "Become a member"}
              </motion.button>

              {/* Fine print */}
              <p className="text-center mt-4 text-[11px] leading-relaxed" style={{ color: "#9CA3AF" }}>
                Payment will be processed securely via Stripe. Your subscription renews annually at the same price, unless canceled 24 hours before renewal.
              </p>
              <div className="flex items-center justify-center gap-3 mt-3">
                <button className="text-[13px] font-medium" style={{ color: "#E8314A" }}>Privacy policy</button>
                <span style={{ color: "#D1D5DB" }}>·</span>
                <button className="text-[13px] font-medium" style={{ color: "#E8314A" }}>Restore purchase</button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
      <AuthSheet open={authOpen} onClose={() => setAuthOpen(false)} onSuccess={() => setAuthOpen(false)} />
    </AnimatePresence>
  );
}
