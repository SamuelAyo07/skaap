import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface NutritionFacts {
  energyKcal100g?: number | null;
  fat100g?: number | null;
  sugars100g?: number | null;
  protein100g?: number | null;
  fiber100g?: number | null;
  salt100g?: number | null;
}

// Consistent phrasing: "Why it matters: ..." — non-technical, one line.
const WHY_IT_MATTERS: Record<string, string> = {
  cal:  "Why it matters: Calories are the fuel your body uses. Too much, too often, and the extra gets stored as fat.",
  sug:  "Why it matters: Too much sugar spikes your energy then crashes it, and over time strains your heart and weight.",
  fat:  "Why it matters: Fat isn't bad — but a lot of the wrong kind clogs arteries. Less is usually safer.",
  prot: "Why it matters: Protein keeps you full longer and helps repair muscles. More is usually a plus.",
  fib:  "Why it matters: Fiber keeps your gut happy and your appetite steady. Most people don't get enough.",
  salt: "Why it matters: A little salt is fine. Too much pushes blood pressure up and tires your heart.",
};

interface Props { n: NutritionFacts; }

export function NutritionAtAGlance({ n }: Props) {
  const [open, setOpen] = useState<string | null>(null);

  const rows = [
    { key: "cal",  show: n.energyKcal100g != null, icon: "🔥", label: "Calories", val: n.energyKcal100g != null ? `${Math.round(n.energyKcal100g)} kcal` : "—", hint: n.energyKcal100g == null ? "Not listed" : n.energyKcal100g! > 400 ? "Very energy-rich" : n.energyKcal100g! > 200 ? "Moderate" : "Light" },
    { key: "sug",  show: n.sugars100g != null,     icon: "🍬", label: "Sugar",    val: n.sugars100g != null ? `${n.sugars100g.toFixed(1)} g` : "—",          hint: n.sugars100g == null ? "Not listed" : n.sugars100g! > 15 ? "A lot of sugar" : n.sugars100g! > 5 ? "Some sugar" : "Low sugar" },
    { key: "fat",  show: n.fat100g != null,        icon: "💧", label: "Fat",      val: n.fat100g != null ? `${n.fat100g.toFixed(1)} g` : "—",                hint: n.fat100g == null ? "Not listed" : n.fat100g! > 17.5 ? "High in fat" : n.fat100g! > 3 ? "Medium" : "Low fat" },
    { key: "prot", show: n.protein100g != null,    icon: "💪", label: "Protein",  val: n.protein100g != null ? `${n.protein100g.toFixed(1)} g` : "—",        hint: n.protein100g == null ? "Not listed" : n.protein100g! >= 8 ? "Good boost" : n.protein100g! >= 4 ? "Some" : "Little" },
    { key: "fib",  show: n.fiber100g != null,      icon: "🌾", label: "Fiber",    val: n.fiber100g != null ? `${n.fiber100g.toFixed(1)} g` : "—",            hint: n.fiber100g == null ? "Not listed" : n.fiber100g! >= 6 ? "Very filling" : n.fiber100g! >= 3 ? "Decent" : "Low" },
    { key: "salt", show: n.salt100g != null,       icon: "🧂", label: "Salt",     val: n.salt100g != null ? `${n.salt100g.toFixed(2)} g` : "—",              hint: n.salt100g == null ? "Not listed" : n.salt100g! > 1.5 ? "Salty" : n.salt100g! > 0.3 ? "Some salt" : "Low salt" },
  ].filter(r => r.show);

  if (rows.length === 0) return null;

  return (
    <div className="mx-5" style={{ marginTop: 20 }}>
      <div className="flex items-center justify-between mb-1">
        <p className="font-bold" style={{ fontSize: 16, color: "#111827" }}>Nutrition at a glance</p>
        <p style={{ fontSize: 11, color: "#9CA3AF" }}>per 100g · tap for why</p>
      </div>
      <div className="grid grid-cols-2 gap-2 mt-2">
        {rows.map(r => {
          const isOpen = open === r.key;
          return (
            <button
              key={r.key}
              type="button"
              onClick={() => setOpen(isOpen ? null : r.key)}
              className="text-left flex items-start gap-2 px-3 py-2.5 rounded-2xl transition-colors"
              style={{
                background: isOpen ? "#FFF1F2" : "#F9FAFB",
                border: `1px solid ${isOpen ? "#FECDD3" : "#F3F4F6"}`,
              }}
            >
              <span style={{ fontSize: 18, lineHeight: "20px" }}>{r.icon}</span>
              <div className="min-w-0 flex-1">
                <p style={{ fontSize: 10, fontWeight: 600, letterSpacing: 0.4, textTransform: "uppercase", color: "#9CA3AF" }}>{r.label}</p>
                <p className="font-bold" style={{ fontSize: 14, color: "#111827", lineHeight: "18px" }}>{r.val}</p>
                <p style={{ fontSize: 11, color: "#6B7280", marginTop: 2, lineHeight: "14px" }}>{r.hint}</p>
              </div>
            </button>
          );
        })}
      </div>
      <AnimatePresence mode="wait">
        {open && (
          <motion.div
            key={open}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.18 }}
            className="overflow-hidden"
          >
            <p
              className="mt-2 px-3.5 py-2.5 rounded-xl text-[12px] leading-snug"
              style={{ background: "#FFFBEB", border: "1px solid #FEF3C7", color: "#78350F" }}
            >
              {WHY_IT_MATTERS[open]}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
