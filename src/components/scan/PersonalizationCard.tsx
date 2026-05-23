import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Lock, Check, ChevronDown } from "lucide-react";
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

interface Prefs {
  diets: string[];
  health: string[];
  notes: string;
}

function loadPrefs(): Prefs {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return { diets: [], health: [], notes: "" };
}

export function PersonalizationCard() {
  const { isPlus, openUpgrade } = useSubscription();
  const [prefs, setPrefs] = useState<Prefs>(() => loadPrefs());
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    if (isPlus) {
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs)); } catch {}
    }
  }, [prefs, isPlus]);

  const gate = () => { if (!isPlus) { openUpgrade("Personalization"); return false; } return true; };

  const toggle = (key: "diets" | "health", value: string) => {
    if (!gate()) return;
    setPrefs(p => ({
      ...p,
      [key]: p[key].includes(value) ? p[key].filter(v => v !== value) : [...p[key], value],
    }));
  };

  const Chip = ({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) => (
    <motion.button
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className="text-[12px] font-semibold px-3 py-1.5 rounded-full transition-all"
      style={{
        background: active ? "rgba(196,30,58,0.12)" : "#F3F4F6",
        color: active ? "#C41E3A" : "#6B7280",
        border: active ? "1.5px solid #C41E3A" : "1.5px solid transparent",
      }}
    >
      {active && "✓ "}{label}
    </motion.button>
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.09 }}
      className="rounded-2xl overflow-hidden"
      style={{ background: "#fff", border: "1px solid #E5E7EB" }}
    >
      <button
        onClick={() => isPlus ? setExpanded(e => !e) : openUpgrade("Personalization")}
        className="w-full flex items-center gap-2 px-4 py-3.5 text-left"
      >
        <Sparkles size={16} style={{ color: "#C41E3A" }} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <h3 className="font-bold text-[14px]" style={{ color: "#0A1220" }}>Personalization</h3>
            {!isPlus && <Lock size={11} style={{ color: "#9CA3AF" }} />}
          </div>
          <p className="text-[11px]" style={{ color: "#9CA3AF" }}>
            {isPlus
              ? `${prefs.diets.length + prefs.health.length} preference${prefs.diets.length + prefs.health.length === 1 ? "" : "s"} set`
              : "Set your diet, health, and let your AI coach align scans to you."}
          </p>
        </div>
        {!isPlus ? (
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: "#FEF3C7", color: "#92400E" }}>Plus</span>
        ) : (
          <ChevronDown size={16} style={{ color: "#9CA3AF", transform: expanded ? "rotate(180deg)" : "none", transition: "transform 200ms" }} />
        )}
      </button>

      <AnimatePresence>
        {expanded && isPlus && (
          <motion.div
            initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div className="px-4 pb-4 space-y-4" style={{ borderTop: "1px solid #F3F4F6" }}>
              <div className="pt-3">
                <p className="text-[11px] font-bold uppercase tracking-wider mb-2" style={{ color: "#6B7280" }}>Dietary preferences</p>
                <div className="flex flex-wrap gap-1.5">
                  {DIET_OPTIONS.map(d => (
                    <Chip key={d} label={d} active={prefs.diets.includes(d)} onClick={() => toggle("diets", d)} />
                  ))}
                </div>
              </div>

              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider mb-2" style={{ color: "#6B7280" }}>Health restrictions</p>
                <div className="flex flex-wrap gap-1.5">
                  {HEALTH_OPTIONS.map(d => (
                    <Chip key={d} label={d} active={prefs.health.includes(d)} onClick={() => toggle("health", d)} />
                  ))}
                </div>
              </div>

              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider mb-2" style={{ color: "#6B7280" }}>Anything else for your AI coach?</p>
                <textarea
                  value={prefs.notes}
                  onChange={e => setPrefs(p => ({ ...p, notes: e.target.value.slice(0, 500) }))}
                  placeholder="e.g. Training for a marathon, avoid seed oils, low FODMAP…"
                  rows={3}
                  maxLength={500}
                  className="w-full text-[12px] px-3 py-2 rounded-xl outline-none resize-none"
                  style={{ background: "#F9FAFB", border: "1px solid #E5E7EB", color: "#0A1220" }}
                />
                <p className="text-[10px] mt-1 text-right" style={{ color: "#9CA3AF" }}>{prefs.notes.length}/500</p>
              </div>

              <button
                onClick={() => toast.success("Personalization saved")}
                className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl font-bold text-[12px] text-white"
                style={{ background: "linear-gradient(135deg, #C41E3A, #9E1830)" }}
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
