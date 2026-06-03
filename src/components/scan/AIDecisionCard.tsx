// SKAAP AI Decision Card — the signature feature.
// Tells the user: given YOUR goal, should you buy this?

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Sparkles, Lock, Check, X, AlertCircle, Settings2 } from "lucide-react";
import { useSubscription } from "@/context/SubscriptionContext";
import {
  useHealthProfile, fetchAIDecision, AIDecision, GOAL_OPTIONS,
  hasUsedFreePeek, consumeFreePeek,
} from "@/lib/healthProfile";

interface Props {
  barcode: string;
  productName: string;
  brandName?: string;
  nutriScore?: string;
  novaGroup?: number;
  additiveCount: number;
  worstRisk?: string;
  isOrganic?: boolean;
  nutrientLevels?: string;
  sugar100g?: number;
  protein100g?: number;
  fiber100g?: number;
  satFat100g?: number;
  onOpenProfile: () => void;
}

const VERDICT_STYLE = {
  great_pick: {
    label: "Great pick",
    bg: "linear-gradient(135deg, #DCFCE7, #BBF7D0)",
    border: "#86EFAC",
    chipBg: "#16A34A",
    icon: Check,
  },
  ok_sometimes: {
    label: "OK sometimes",
    bg: "linear-gradient(135deg, #FEF3C7, #FDE68A)",
    border: "#FCD34D",
    chipBg: "#D97706",
    icon: AlertCircle,
  },
  skip_it: {
    label: "Skip it",
    bg: "linear-gradient(135deg, #FFE4E6, #FECDD3)",
    border: "#FDA4AF",
    chipBg: "#C41E3A",
    icon: X,
  },
};

export default function AIDecisionCard(props: Props) {
  const { isPlus, openUpgrade } = useSubscription();
  const { profile, hasProfile, loaded } = useHealthProfile();
  const [decision, setDecision] = useState<AIDecision | null>(null);
  const [loading, setLoading] = useState(false);
  const [unlockedForPeek, setUnlockedForPeek] = useState(false);

  const canSeeFull = isPlus || unlockedForPeek;

  // Auto-claim free peek for first-ever scan
  useEffect(() => {
    if (!isPlus && !hasUsedFreePeek()) {
      setUnlockedForPeek(true);
      consumeFreePeek();
    }
  }, [isPlus]);

  useEffect(() => {
    if (!loaded || !canSeeFull) return;
    let cancelled = false;
    setLoading(true);
    fetchAIDecision({ ...props, profile }).then(r => {
      if (!cancelled) { setDecision(r); setLoading(false); }
    });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.barcode, profile.goal, canSeeFull, loaded]);

  const goalMeta = GOAL_OPTIONS.find(g => g.id === profile.goal) || GOAL_OPTIONS[7];

  // Locked teaser for free users who've used their peek — compact, sits after first scan
  if (!canSeeFull) {
    return (
      <motion.button
        initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35, duration: 0.3 }}
        onClick={() => openUpgrade("Personalized Decisions")}
        className="mx-auto block w-full text-left relative overflow-hidden"
        style={{
          maxWidth: 350, marginTop: 14,
          borderRadius: 18, padding: "12px 14px",
          background: "linear-gradient(135deg, #0A1220, #1F2937)",
          boxShadow: "0 8px 22px rgba(10,18,32,0.28)",
        }}>
        <div className="absolute -right-3 -top-3 w-16 h-16 rounded-full" style={{ background: "radial-gradient(circle, rgba(196,30,58,0.4), transparent 70%)" }} />
        <div className="flex items-center gap-2.5 relative">
          <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: "linear-gradient(135deg, #C41E3A, #9E1830)" }}>
            <Sparkles size={13} className="text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[9.5px] font-bold uppercase tracking-wider text-white/60 leading-tight">For your goal</p>
            <p className="text-white font-bold text-[13px] leading-tight mt-0.5">
              Should YOU buy this?
            </p>
          </div>
          <span className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[10.5px] font-bold text-white flex-shrink-0" style={{ background: "#C41E3A" }}>
            <Lock size={10} /> Plus
          </span>
        </div>
      </motion.button>
    );
  }

  // Plus / peek user — show the real card
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.35, duration: 0.3 }}
      className="mx-auto w-full"
      style={{ maxWidth: 350, marginTop: 14 }}
    >
      {/* Goal pill */}
      <button onClick={props.onOpenProfile}
        className="flex items-center gap-1.5 mb-2 px-3 py-1 rounded-full text-[11px] font-semibold"
        style={{ background: "#F3F4F6", color: "#374151" }}>
        <span>{goalMeta.emoji}</span>
        For your goal: {goalMeta.label}
        <Settings2 size={10} style={{ color: "#9CA3AF" }} />
      </button>

      {loading || !decision ? (
        <div className="rounded-2xl p-4" style={{ background: "#F9FAFB", border: "1px solid #F3F4F6" }}>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full flex items-center justify-center" style={{ background: "linear-gradient(135deg, #C41E3A, #9E1830)" }}>
              <Sparkles size={13} className="text-white" />
            </div>
            <p className="text-[12px] font-semibold" style={{ color: "#6B7280" }}>Reading this for your goal…</p>
          </div>
          <div className="space-y-1.5 mt-3">
            <div className="h-3 rounded-full" style={{ background: "linear-gradient(90deg, #F3F4F6 25%, #E9EAEC 50%, #F3F4F6 75%)", backgroundSize: "200% 100%", animation: "shimmer 1.4s infinite", width: "85%" }} />
            <div className="h-3 rounded-full" style={{ background: "linear-gradient(90deg, #F3F4F6 25%, #E9EAEC 50%, #F3F4F6 75%)", backgroundSize: "200% 100%", animation: "shimmer 1.4s infinite", width: "60%" }} />
          </div>
        </div>
      ) : (() => {
        const v = VERDICT_STYLE[decision.verdict] || VERDICT_STYLE.ok_sometimes;
        const Icon = v.icon;
        return (
          <div className="rounded-2xl p-4 relative overflow-hidden"
            style={{ background: v.bg, border: `1.5px solid ${v.border}` }}>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-white" style={{ background: v.chipBg }}>
                <Icon size={16} strokeWidth={3} />
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: v.chipBg }}>Verdict</p>
                <p className="font-bold text-[15px]" style={{ color: "#0A1220" }}>{v.label}</p>
              </div>
              {typeof decision.fit_score === "number" && (
                <span className="ml-auto px-2.5 py-1 rounded-full text-[11px] font-bold text-white" style={{ background: v.chipBg }}>
                  {decision.fit_score}/100 fit
                </span>
              )}
            </div>

            <p className="font-bold text-[14px] mt-3 leading-snug" style={{ color: "#0A1220" }}>
              {decision.headline}
            </p>

            {decision.why?.length > 0 && (
              <ul className="mt-2.5 space-y-1.5">
                {decision.why.slice(0, 3).map((w, i) => (
                  <li key={i} className="flex items-start gap-1.5 text-[12px]" style={{ color: "#1F2937" }}>
                    <span className="mt-1 flex-shrink-0" style={{ width: 4, height: 4, borderRadius: 999, background: v.chipBg }} />
                    <span>{w}</span>
                  </li>
                ))}
              </ul>
            )}

            {decision.swap_hint && decision.verdict !== "great_pick" && (
              <div className="mt-3 px-3 py-2.5 rounded-xl bg-white/70 backdrop-blur-sm" style={{ border: "1px solid rgba(255,255,255,0.6)" }}>
                <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: v.chipBg }}>Try instead</p>
                <p className="text-[12px] mt-0.5 font-semibold" style={{ color: "#0A1220" }}>{decision.swap_hint}</p>
              </div>
            )}

            {!hasProfile && (
              <button onClick={props.onOpenProfile}
                className="mt-3 text-[11px] font-bold underline" style={{ color: v.chipBg }}>
                Fine-tune for me →
              </button>
            )}
          </div>
        );
      })()}

      {!isPlus && unlockedForPeek && (
        <p className="text-[10px] text-center mt-2" style={{ color: "#9CA3AF" }}>
          🎁 Your free preview. <button onClick={() => openUpgrade("Personalized Decisions")} className="font-bold underline" style={{ color: "#C41E3A" }}>Keep it on for every scan</button>
        </p>
      )}
    </motion.div>
  );
}
