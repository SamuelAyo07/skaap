import { motion } from "framer-motion";
import { Sparkles, AlertTriangle, Check } from "lucide-react";
import { analyzeBeautyMatch, getSkinPrefs, hasAnySkinPrefs } from "@/lib/skinPrefs";
import { useSubscription } from "@/context/SubscriptionContext";

interface Props {
  ingredientsText?: string;
  productName?: string;
}

/**
 * Shows on beauty scan results when the user has set skin goals/type/allergies.
 * Surfaces matches (good for your goals) and avoids (flagged ingredients) in plain English.
 * For non-Plus users, shows a soft nudge to add prefs.
 */
export function BeautyPersonalizationBanner({ ingredientsText, productName }: Props) {
  const { isPlus, openUpgrade } = useSubscription();
  const prefs = getSkinPrefs();

  // No prefs set, soft nudge
  if (!hasAnySkinPrefs(prefs)) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
        className="mx-5 mt-4 rounded-2xl px-4 py-3 flex items-center gap-3"
        style={{
          background: "linear-gradient(180deg, rgba(196,30,58,0.05), rgba(196,30,58,0.02))",
          border: "1px solid rgba(196,30,58,0.12)",
        }}
      >
        <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
          style={{ background: "linear-gradient(135deg, #C41E3A, #9E1830)" }}>
          <Sparkles size={14} color="#fff" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-[13px]" style={{ color: "#0A1220" }}>Make this scan about your skin</p>
          <p className="text-[11.5px] mt-0.5" style={{ color: "#6B7280" }}>
            Add your skin goals and allergies so we flag what matters to you.
          </p>
        </div>
        <button
          onClick={() => isPlus ? null : openUpgrade("Skin personalization")}
          className="text-[11px] font-bold px-3 py-1.5 rounded-full text-white flex-shrink-0"
          style={{ background: "#C41E3A" }}
        >
          {isPlus ? "Set up" : "Plus"}
        </button>
      </motion.div>
    );
  }

  const { matches, avoids } = analyzeBeautyMatch(ingredientsText, prefs);

  if (matches.length === 0 && avoids.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
        className="mx-5 mt-4 rounded-2xl px-4 py-3 flex items-center gap-2"
        style={{ background: "rgba(10,18,32,0.03)", border: "1px solid rgba(10,18,32,0.05)" }}
      >
        <Sparkles size={14} style={{ color: "#6B7280" }} />
        <p className="text-[12px]" style={{ color: "#4B5563" }}>
          Nothing in {productName || "this product"} stands out for your skin profile.
        </p>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
      className="mx-5 mt-4 rounded-2xl overflow-hidden"
      style={{
        background: "linear-gradient(180deg, rgba(255,255,255,0.96), rgba(249,250,251,0.96))",
        border: "1px solid rgba(10,18,32,0.06)",
        boxShadow: "0 10px 30px -18px rgba(10,18,32,0.18)",
      }}
    >
      <div className="px-4 py-3 flex items-center gap-2" style={{ borderBottom: "1px solid rgba(10,18,32,0.05)" }}>
        <div className="w-7 h-7 rounded-full flex items-center justify-center"
          style={{ background: "linear-gradient(135deg, #C41E3A, #9E1830)" }}>
          <Sparkles size={13} color="#fff" />
        </div>
        <p className="font-bold text-[13px]" style={{ color: "#0A1220" }}>For your skin</p>
        <span className="ml-auto text-[10px] font-bold px-2 py-0.5 rounded-full"
          style={{ background: "rgba(196,30,58,0.08)", color: "#C41E3A" }}>SKAAP AI</span>
      </div>

      <div className="px-4 py-3 space-y-2">
        {matches.slice(0, 3).map((m, i) => (
          <div key={`m${i}`} className="flex items-start gap-2.5">
            <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
              style={{ background: "#DCFCE7" }}>
              <Check size={11} style={{ color: "#15803D" }} />
            </div>
            <p className="text-[12.5px] leading-snug" style={{ color: "#0A1220" }}>
              Good for <b>{m.goal.toLowerCase()}</b>: contains {m.ingredient} ({m.why}).
            </p>
          </div>
        ))}
        {avoids.slice(0, 3).map((a, i) => (
          <div key={`a${i}`} className="flex items-start gap-2.5">
            <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
              style={{ background: a.severity === "high" ? "#FEE2E2" : "#FEF3C7" }}>
              <AlertTriangle size={11} style={{ color: a.severity === "high" ? "#B91C1C" : "#B45309" }} />
            </div>
            <p className="text-[12.5px] leading-snug" style={{ color: "#0A1220" }}>
              Heads up: contains <b>{a.ingredient}</b> ({a.reason}).
            </p>
          </div>
        ))}
      </div>
    </motion.div>
  );
}
