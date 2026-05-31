import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Check, ChevronRight, Sparkles } from "lucide-react";
import { HealthGoal, HealthProfile, GOAL_OPTIONS, useHealthProfile } from "@/lib/healthProfile";
import { useSubscription } from "@/context/SubscriptionContext";

const DIETARY = [
  { id: "vegan", label: "Vegan" },
  { id: "vegetarian", label: "Vegetarian" },
  { id: "gluten_free", label: "Gluten-free" },
  { id: "dairy_free", label: "Dairy-free" },
  { id: "nut_free", label: "Nut-free" },
];

const BUDGET = [
  { id: "low" as const, label: "Premium", sub: "Quality first" },
  { id: "medium" as const, label: "Balanced", sub: "Mid range" },
  { id: "high" as const, label: "Budget", sub: "Price first" },
];

interface Props {
  open: boolean;
  onClose: () => void;
  onSaved?: () => void;
}

export default function HealthProfileSheet({ open, onClose, onSaved }: Props) {
  const { profile, save } = useHealthProfile();
  const { isPlus, openUpgrade } = useSubscription();
  const [step, setStep] = useState(0);
  const [draft, setDraft] = useState<HealthProfile>(profile);
  // Multi-goal local state (UI only — joined into draft.goal as primary + dietary tags)
  const [selectedGoals, setSelectedGoals] = useState<HealthGoal[]>([profile.goal]);

  useEffect(() => {
    if (open) {
      setStep(0);
      setDraft(profile);
      setSelectedGoals([profile.goal]);
    }
  }, [open, profile]);

  const toggleGoal = (id: HealthGoal) => {
    setSelectedGoals(prev =>
      prev.includes(id) ? (prev.length > 1 ? prev.filter(x => x !== id) : prev) : [...prev, id]
    );
  };

  const toggleDietary = (id: string) => {
    setDraft(d => ({
      ...d,
      dietary: d.dietary.includes(id) ? d.dietary.filter(x => x !== id) : [...d.dietary, id],
    }));
  };

  const finish = async () => {
    // Always save locally so the preview reflects their choice.
    // Plus is required to keep it on for every future scan — paywall after the peek.
    const next: HealthProfile = {
      ...draft,
      goal: selectedGoals[0],
      // pack extra goals into a known field so backend prompt still gets them
      avoid_ingredients: draft.avoid_ingredients,
    };
    // Store secondary goals in localStorage so AI gets them via decision prompt
    try {
      localStorage.setItem("skaap_extra_goals_v1", JSON.stringify(selectedGoals.slice(1)));
    } catch {}
    await save(next);
    onSaved?.();
    onClose();
    if (!isPlus) {
      // Soft nudge after they've felt the value
      setTimeout(() => openUpgrade("Personalized Decisions"), 600);
    }
  };

  const skip = () => {
    onClose();
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-[110]"
            style={{ background: "rgba(10,18,32,0.55)", backdropFilter: "blur(8px)" }}
          />
          <motion.div
            initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 280 }}
            className="fixed bottom-0 z-[111] flex justify-center"
            style={{
              left: 0,
              right: 0,
              pointerEvents: "none",
            }}
          >
            <div
              style={{
                pointerEvents: "auto",
                width: "100%",
                maxWidth: 390,
                background: "#FFFFFF",
                borderTopLeftRadius: 28,
                borderTopRightRadius: 28,
                boxShadow: "0 -20px 60px rgba(196,30,58,0.18)",
                maxHeight: "92dvh",
                overflowY: "auto",
              }}
            >
              {/* Header */}
              <div className="flex items-center justify-between px-5 pt-4 pb-3 sticky top-0 z-10" style={{ background: "#FFFFFF" }}>
                <div className="min-w-0">
                  <p className="text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5" style={{ color: "#C41E3A" }}>
                    <Sparkles size={11} /> Preview · Plus feature
                  </p>
                  <h2 className="text-[20px] font-bold mt-0.5" style={{ color: "#0A1220" }}>
                    {step === 0 ? "Pick your goals" : step === 1 ? "Any dietary needs?" : "Budget feel?"}
                  </h2>
                </div>
                <button onClick={onClose} aria-label="Close"
                  className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: "#F3F4F6" }}>
                  <X size={16} style={{ color: "#6B7280" }} />
                </button>
              </div>

              {/* Step 0 — Multi-Goal */}
              {step === 0 && (
                <div className="px-5 pb-4">
                  <p className="text-[13px]" style={{ color: "#6B7280" }}>
                    Pick one or more — every scan will be judged for YOU, not generic.
                  </p>
                  <div className="grid grid-cols-2 gap-2 mt-3">
                    {GOAL_OPTIONS.map(g => {
                      const active = selectedGoals.includes(g.id);
                      return (
                        <button key={g.id}
                          onClick={() => toggleGoal(g.id)}
                          className="text-left p-3 rounded-2xl transition-all relative"
                          style={{
                            background: active ? "linear-gradient(135deg, #FFF1F2, #FFE4E6)" : "#F9FAFB",
                            border: active ? "1.5px solid #C41E3A" : "1px solid #F3F4F6",
                            boxShadow: active ? "0 6px 20px rgba(196,30,58,0.18)" : "none",
                          }}>
                          {active && (
                            <span className="absolute top-2 right-2 w-4 h-4 rounded-full flex items-center justify-center" style={{ background: "#C41E3A" }}>
                              <Check size={10} className="text-white" strokeWidth={3} />
                            </span>
                          )}
                          <div className="text-[22px]">{g.emoji}</div>
                          <p className="font-bold text-[13px] mt-1" style={{ color: "#0A1220" }}>{g.label}</p>
                          <p className="text-[10px] mt-0.5 leading-tight" style={{ color: "#6B7280" }}>{g.tagline}</p>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Step 1 — Dietary */}
              {step === 1 && (
                <div className="px-5 pb-4">
                  <p className="text-[13px]" style={{ color: "#6B7280" }}>Tap all that apply. Skip if none.</p>
                  <div className="flex flex-wrap gap-2 mt-3">
                    {DIETARY.map(d => {
                      const active = draft.dietary.includes(d.id);
                      return (
                        <button key={d.id} onClick={() => toggleDietary(d.id)}
                          className="px-4 py-2.5 rounded-full text-[13px] font-semibold transition-all"
                          style={{
                            background: active ? "#C41E3A" : "#F9FAFB",
                            color: active ? "#FFF" : "#0A1220",
                            border: active ? "1px solid #C41E3A" : "1px solid #E5E7EB",
                          }}>
                          {active && <Check size={12} className="inline mr-1" />}
                          {d.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Step 2 — Budget */}
              {step === 2 && (
                <div className="px-5 pb-4">
                  <p className="text-[13px]" style={{ color: "#6B7280" }}>So we can suggest swaps in your price range.</p>
                  <div className="space-y-2 mt-3">
                    {BUDGET.map(b => {
                      const active = draft.budget_sensitivity === b.id;
                      return (
                        <button key={b.id}
                          onClick={() => setDraft(d => ({ ...d, budget_sensitivity: b.id }))}
                          className="w-full flex items-center justify-between p-4 rounded-2xl text-left"
                          style={{
                            background: active ? "linear-gradient(135deg, #FFF1F2, #FFE4E6)" : "#F9FAFB",
                            border: active ? "1.5px solid #C41E3A" : "1px solid #F3F4F6",
                          }}>
                          <div>
                            <p className="font-bold text-[14px]" style={{ color: "#0A1220" }}>{b.label}</p>
                            <p className="text-[11px]" style={{ color: "#6B7280" }}>{b.sub}</p>
                          </div>
                          {active && <Check size={18} style={{ color: "#C41E3A" }} strokeWidth={3} />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Footer */}
              <div className="px-5 pb-6 pt-2 sticky bottom-0" style={{ background: "linear-gradient(180deg, rgba(255,255,255,0) 0%, #FFF 30%)" }}>
                {step < 2 ? (
                  <button onClick={() => setStep(s => s + 1)}
                    className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl font-bold text-[15px] text-white"
                    style={{ background: "#0A1220" }}>
                    Continue <ChevronRight size={16} />
                  </button>
                ) : (
                  <button onClick={finish}
                    className="w-full py-3.5 rounded-2xl font-bold text-[15px] text-white"
                    style={{ background: "linear-gradient(135deg, #C41E3A, #9E1830)", boxShadow: "0 8px 24px rgba(196,30,58,0.32)" }}>
                    See my personal verdict
                  </button>
                )}
                <div className="flex items-center justify-between mt-2">
                  {step > 0 ? (
                    <button onClick={() => setStep(s => s - 1)}
                      className="text-[12px] py-1.5 font-semibold" style={{ color: "#6B7280" }}>
                      ← Back
                    </button>
                  ) : <span />}
                  <button onClick={skip}
                    className="text-[12px] py-1.5 font-semibold ml-auto" style={{ color: "#9CA3AF" }}>
                    Skip for now
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
