import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Lock, Check, ChevronDown, ShieldCheck } from "lucide-react";
import { useSubscription } from "@/context/SubscriptionContext";
import { toast } from "sonner";

const STORAGE_KEY = "skaap_personalization_v1";

const DIET_OPTIONS = [
  "Vegan", "Vegetarian", "Pescatarian", "Keto", "Paleo",
  "Mediterranean", "Low-carb", "Low-sodium", "Low-sugar", "High-protein",
];

const HEALTH_OPTIONS = [
  "Diabetes", "High blood pressure", "High cholesterol", "Heart disease",
  "Pregnancy", "Nursing", "IBS / gut sensitivity", "Kidney concerns",
  "Thyroid", "PCOS",
];

const SKIN_GOAL_OPTIONS = [
  "Hydration", "Anti-aging", "Acne", "Brightening", "Redness",
  "Dark spots", "Pores", "Firmness", "Sensitivity care", "Barrier repair",
];

const SKIN_TYPE_OPTIONS = [
  "Oily", "Dry", "Combination", "Normal", "Sensitive", "Mature", "Acne-prone",
];

const SKIN_ALLERGY_OPTIONS = [
  "Fragrance", "Parabens", "Sulfates", "Essential oils", "Nickel",
  "Lanolin", "Formaldehyde", "Nut oils",
];

interface Prefs {
  diets: string[];
  health: string[];
  skinGoals: string[];
  skinType: string[];
  skinAllergies: string[];
  notes: string;
}

function loadPrefs(): Prefs {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const p = JSON.parse(raw);
      return {
        diets: p.diets || [],
        health: p.health || [],
        skinGoals: p.skinGoals || [],
        skinType: p.skinType || [],
        skinAllergies: p.skinAllergies || [],
        notes: p.notes || "",
      };
    }
  } catch {}
  return { diets: [], health: [], skinGoals: [], skinType: [], skinAllergies: [], notes: "" };
}

/* ─────────────────────────────────────────────────────────────
   Locked state, Apple-style glass preview, fun & frictionless.
   Anchors on $2.99/mo (looks cheaper) with annual bonus framing.
   ───────────────────────────────────────────────────────────── */
function LockedPreview({ onUpgrade }: { onUpgrade: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.09 }}
      className="relative rounded-3xl overflow-hidden"
      style={{
        background: "linear-gradient(180deg, rgba(255,255,255,0.92), rgba(249,250,251,0.92))",
        border: "1px solid rgba(10,18,32,0.06)",
        boxShadow: "0 1px 0 rgba(255,255,255,0.8) inset, 0 10px 30px -18px rgba(10,18,32,0.18)",
      }}
    >
      {/* Header */}
      <div className="px-5 pt-5 pb-3">
        <div className="flex items-center gap-2">
          <motion.div
            animate={{ rotate: [0, -8, 8, 0] }}
            transition={{ duration: 2.4, repeat: Infinity, repeatDelay: 3 }}
            className="w-7 h-7 rounded-full flex items-center justify-center"
            style={{ background: "linear-gradient(135deg, #C41E3A, #9E1830)", boxShadow: "0 4px 12px rgba(196,30,58,0.25)" }}
          >
            <Sparkles size={14} color="#fff" />
          </motion.div>
          <h3 className="font-bold text-[15px] tracking-tight" style={{ color: "#0A1220" }}>
            Meet SKAAP AI
          </h3>
          <span className="ml-auto text-[10px] font-bold px-2 py-0.5 rounded-full"
            style={{ background: "rgba(196,30,58,0.08)", color: "#C41E3A" }}>
            Plus
          </span>
        </div>
        <p className="text-[12.5px] mt-2 leading-snug" style={{ color: "#4B5563" }}>
          Your private nutrition &amp; beauty coach. Tell it your diet, allergies, skin goals, every scan reads through <em>your</em> lens.
        </p>
      </div>

      {/* Blurred preview content */}
      <div className="relative px-5 pb-4">
        <div style={{ filter: "blur(6px)", opacity: 0.55, pointerEvents: "none", userSelect: "none" }}>
          <div className="flex flex-wrap gap-1.5 mb-2">
            {DIET_OPTIONS.slice(0, 6).map(d => (
              <span key={d} className="text-[11px] font-semibold px-3 py-1.5 rounded-full"
                style={{ background: "#F3F4F6", color: "#6B7280" }}>{d}</span>
            ))}
          </div>
          <div className="flex flex-wrap gap-1.5">
            {HEALTH_OPTIONS.slice(0, 5).map(d => (
              <span key={d} className="text-[11px] font-semibold px-3 py-1.5 rounded-full"
                style={{ background: "#F3F4F6", color: "#6B7280" }}>{d}</span>
            ))}
          </div>
        </div>

        {/* Glass overlay */}
        <div
          className="absolute inset-0 flex items-center justify-center px-5"
          style={{
            background: "linear-gradient(180deg, rgba(255,255,255,0.35), rgba(255,255,255,0.9))",
            backdropFilter: "blur(2px)",
          }}
        >
          <div className="w-full">
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={onUpgrade}
              className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl font-bold text-[14px] text-white"
              style={{
                background: "linear-gradient(135deg, #0A1220, #1A2540)",
                boxShadow: "0 8px 24px -8px rgba(10,18,32,0.55)",
              }}
            >
              <Sparkles size={14} /> Unlock SKAAP AI, $2.99/mo
            </motion.button>
            <div className="flex items-center justify-center gap-1.5 mt-2.5 text-[10.5px]" style={{ color: "#6B7280" }}>
              <ShieldCheck size={11} style={{ color: "#10B981" }} />
              <span>7-day free trial · or $15.99/yr (save 55%) · cancel anytime</span>
            </div>
          </div>
        </div>
      </div>

      {/* Fun social proof footer */}
      <div className="px-5 pb-4 pt-1 flex items-center justify-center gap-1.5 text-[10.5px]" style={{ color: "#9CA3AF" }}>
        <span>🥑 Food</span>
        <span style={{ opacity: 0.4 }}>·</span>
        <span>💄 Beauty</span>
        <span style={{ opacity: 0.4 }}>·</span>
        <span>🧴 Skincare</span>
        <span style={{ opacity: 0.4 }}>·</span>
        <span>One scan, your rules</span>
      </div>
    </motion.div>
  );
}


/* ─────────────────────────────────────────────────────────────
   Unlocked state, clean Apple-style editor
   ───────────────────────────────────────────────────────────── */
export function PersonalizationCard() {
  const { isPlus, openUpgrade } = useSubscription();
  const [prefs, setPrefs] = useState<Prefs>(() => loadPrefs());
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    if (isPlus) {
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs)); } catch {}
    }
  }, [prefs, isPlus]);

  if (!isPlus) return <LockedPreview onUpgrade={() => openUpgrade("SKAAP AI")} />;

  const toggle = (key: "diets" | "health" | "skinGoals" | "skinType" | "skinAllergies", value: string) => {
    setPrefs(p => ({
      ...p,
      [key]: p[key].includes(value) ? p[key].filter(v => v !== value) : [...p[key], value],
    }));
  };

  const count =
    prefs.diets.length + prefs.health.length +
    prefs.skinGoals.length + prefs.skinType.length + prefs.skinAllergies.length;

  const Chip = ({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) => (
    <motion.button
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className="text-[12px] font-semibold px-3 py-1.5 rounded-full transition-all"
      style={{
        background: active ? "rgba(196,30,58,0.10)" : "rgba(10,18,32,0.04)",
        color: active ? "#C41E3A" : "#374151",
        border: active ? "1.5px solid #C41E3A" : "1.5px solid transparent",
      }}
    >
      {active && "✓ "}{label}
    </motion.button>
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.09 }}
      className="rounded-3xl overflow-hidden"
      style={{
        background: "linear-gradient(180deg, rgba(255,255,255,0.96), rgba(249,250,251,0.96))",
        border: "1px solid rgba(10,18,32,0.06)",
        boxShadow: "0 10px 30px -18px rgba(10,18,32,0.18)",
      }}
    >
      <button
        onClick={() => setExpanded(e => !e)}
        className="w-full flex items-center gap-3 px-5 py-4 text-left"
      >
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center"
          style={{ background: "linear-gradient(135deg, #C41E3A, #9E1830)", boxShadow: "0 4px 12px rgba(196,30,58,0.25)" }}
        >
          <Sparkles size={15} color="#fff" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-[14.5px] tracking-tight" style={{ color: "#0A1220" }}>SKAAP AI</h3>
          <p className="text-[11.5px]" style={{ color: "#6B7280" }}>
            {count > 0 ? `Tuned to ${count} preference${count === 1 ? "" : "s"}` : "Personalize your scans"}
          </p>
        </div>
        <ChevronDown size={16} style={{ color: "#9CA3AF", transform: expanded ? "rotate(180deg)" : "none", transition: "transform 200ms" }} />
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div className="px-5 pb-5 space-y-4" style={{ borderTop: "1px solid rgba(10,18,32,0.05)" }}>
              <div className="pt-4">
                <p className="text-[10.5px] font-bold uppercase tracking-wider mb-2" style={{ color: "#6B7280" }}>Dietary</p>
                <div className="flex flex-wrap gap-1.5">
                  {DIET_OPTIONS.map(d => (
                    <Chip key={d} label={d} active={prefs.diets.includes(d)} onClick={() => toggle("diets", d)} />
                  ))}
                </div>
              </div>

              <div>
                <p className="text-[10.5px] font-bold uppercase tracking-wider mb-2" style={{ color: "#6B7280" }}>Health</p>
                <div className="flex flex-wrap gap-1.5">
                  {HEALTH_OPTIONS.map(d => (
                    <Chip key={d} label={d} active={prefs.health.includes(d)} onClick={() => toggle("health", d)} />
                  ))}
                </div>
              </div>

              <div className="pt-3" style={{ borderTop: "1px dashed rgba(10,18,32,0.08)" }}>
                <p className="text-[10.5px] font-bold uppercase tracking-wider mb-2" style={{ color: "#C41E3A" }}>
                  💄 Skin goals
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {SKIN_GOAL_OPTIONS.map(d => (
                    <Chip key={d} label={d} active={prefs.skinGoals.includes(d)} onClick={() => toggle("skinGoals", d)} />
                  ))}
                </div>
              </div>

              <div>
                <p className="text-[10.5px] font-bold uppercase tracking-wider mb-2" style={{ color: "#6B7280" }}>Skin type</p>
                <div className="flex flex-wrap gap-1.5">
                  {SKIN_TYPE_OPTIONS.map(d => (
                    <Chip key={d} label={d} active={prefs.skinType.includes(d)} onClick={() => toggle("skinType", d)} />
                  ))}
                </div>
              </div>

              <div>
                <p className="text-[10.5px] font-bold uppercase tracking-wider mb-2" style={{ color: "#6B7280" }}>Skin allergies &amp; avoids</p>
                <div className="flex flex-wrap gap-1.5">
                  {SKIN_ALLERGY_OPTIONS.map(d => (
                    <Chip key={d} label={d} active={prefs.skinAllergies.includes(d)} onClick={() => toggle("skinAllergies", d)} />
                  ))}
                </div>
              </div>

              <div>
                <p className="text-[10.5px] font-bold uppercase tracking-wider mb-2" style={{ color: "#6B7280" }}>Notes for SKAAP AI</p>
                <textarea
                  value={prefs.notes}
                  onChange={e => setPrefs(p => ({ ...p, notes: e.target.value.slice(0, 500) }))}
                  placeholder="e.g. Training for a marathon, avoid seed oils, low FODMAP…"
                  rows={3}
                  maxLength={500}
                  className="w-full text-[12.5px] px-3 py-2.5 rounded-xl outline-none resize-none"
                  style={{ background: "rgba(10,18,32,0.03)", border: "1px solid rgba(10,18,32,0.06)", color: "#0A1220" }}
                />
              </div>

              <button
                onClick={() => toast.success("SKAAP AI is tuned to you")}
                className="w-full flex items-center justify-center gap-1.5 py-3 rounded-2xl font-bold text-[13px] text-white"
                style={{ background: "linear-gradient(135deg, #C41E3A, #9E1830)", boxShadow: "0 6px 16px -6px rgba(196,30,58,0.4)" }}
              >
                <Check size={13} /> Save preferences
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
