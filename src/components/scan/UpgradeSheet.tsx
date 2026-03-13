import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Zap, Check } from "lucide-react";
import { useSubscription } from "@/context/SubscriptionContext";
import { useAuth } from "@/context/AuthContext";

const FEATURES = [
  "Unlimited scan history",
  "Search any product by name",
  "Offline scanning — no signal needed",
  "Custom ingredient alerts",
  "Weekly Kitchen Report",
  "Streak tracking & share cards",
];

export function UpgradeSheet() {
  const { showUpgradeSheet, closeUpgrade, upgradeFeature } = useSubscription();
  const { user } = useAuth();
  const [billing, setBilling] = useState<"monthly" | "annual">("annual");

  const priceLabel = billing === "annual"
    ? "Start SKAAP Plus — $14.99/yr · Save 37%"
    : "Start SKAAP Plus — $1.99/mo";

  const handleCTA = () => {
    // For now, show a toast — Stripe integration will be connected next
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
          <div className="absolute inset-0" style={{
            background: "rgba(0,0,0,0.5)",
            backdropFilter: "blur(8px)",
            WebkitBackdropFilter: "blur(8px)",
          }} />

          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 26, stiffness: 200 }}
            className="relative w-full rounded-t-[28px] z-10 overflow-hidden"
            style={{
              maxHeight: "78vh",
              maxWidth: 430,
              background: "rgba(10,15,30,0.95)",
              backdropFilter: "blur(40px) saturate(200%)",
              WebkitBackdropFilter: "blur(40px) saturate(200%)",
              borderTop: "1px solid rgba(255,255,255,0.15)",
            }}
            onClick={e => e.stopPropagation()}
          >
            {/* Red glow */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-32 rounded-full pointer-events-none"
              style={{ background: "rgba(232,49,74,0.15)", filter: "blur(60px)" }} />

            {/* Close */}
            <button onClick={closeUpgrade}
              className="absolute top-3 right-4 z-10 w-10 h-10 flex items-center justify-center rounded-full glass-pill"
              aria-label="Close">
              <X size={18} style={{ color: "rgba(255,255,255,0.6)" }} />
            </button>

            {/* Drag handle */}
            <div className="flex justify-center pt-3">
              <div style={{ width: 36, height: 4, borderRadius: 99, background: "rgba(255,255,255,0.2)" }} />
            </div>

            <div className="px-6 pt-6 pb-8">
              {/* Wordmark */}
              <div className="text-center">
                <h2 className="font-extrabold text-[32px] text-white flex items-center justify-center gap-2">
                  <Zap size={24} style={{ color: "#E8314A" }} />
                  SKAAP+
                </h2>
                <p className="text-[16px] mt-2" style={{ color: "rgba(255,255,255,0.6)" }}>
                  Scan smarter. Eat better.
                </p>
                {upgradeFeature && (
                  <p className="text-[13px] mt-1" style={{ color: "#E8314A" }}>
                    {upgradeFeature} is a Plus feature
                  </p>
                )}
              </div>

              {/* Features */}
              <div className="mt-6 space-y-0">
                {FEATURES.map((f, i) => (
                  <div key={i} className="flex items-center gap-3 py-3" style={{
                    borderBottom: i < FEATURES.length - 1 ? "1px solid rgba(255,255,255,0.06)" : "none",
                  }}>
                    <Check size={16} style={{ color: "#22C55E" }} />
                    <span className="font-semibold text-[15px] text-white">{f}</span>
                  </div>
                ))}
              </div>

              {/* Billing toggle */}
              <div className="flex items-center justify-center gap-1 mt-6 p-1 rounded-full glass-pill"
                style={{ width: "fit-content", margin: "24px auto 0" }}>
                {(["monthly", "annual"] as const).map(b => (
                  <button key={b} onClick={() => setBilling(b)}
                    className="px-5 py-2 rounded-full text-[13px] font-semibold transition-all"
                    style={{
                      background: billing === b ? "#E8314A" : "transparent",
                      color: billing === b ? "#fff" : "rgba(255,255,255,0.5)",
                    }}>
                    {b === "monthly" ? "Monthly" : "Annual"}
                  </button>
                ))}
              </div>

              {/* CTA */}
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={handleCTA}
                className="w-full mt-6 font-extrabold text-[17px] text-white flex items-center justify-center"
                style={{
                  height: 56,
                  borderRadius: 16,
                  background: "linear-gradient(135deg, #E8314A, #c42040)",
                  boxShadow: "0 8px 32px rgba(232,49,74,0.3)",
                }}
              >
                {priceLabel}
              </motion.button>

              {/* Fine print */}
              <p className="text-center mt-3 text-[12px]" style={{ color: "rgba(255,255,255,0.35)" }}>
                7-day free trial · Cancel anytime
              </p>
              <p className="text-center mt-1 text-[11px] flex items-center justify-center gap-1" style={{ color: "rgba(255,255,255,0.25)" }}>
                🔒 Secure payment by Stripe
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
