import { createContext, useContext, useState, ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Info } from "lucide-react";
import { hapticLight } from "@/lib/haptics";

export type TermKey =
  | "score"
  | "nutri-score"
  | "nova"
  | "additives"
  | "eco"
  | "ingredients"
  | "weight"
  | "low-sugar"
  | "high-sugar"
  | "low-salt"
  | "low-sat-fat"
  | "high-sat-fat"
  | "high-protein"
  | "high-fiber"
  | "live-cultures"
  | "no-additives"
  | "some-additives"
  | "many-additives"
  | "organic"
  | "verdict-green"
  | "verdict-amber"
  | "verdict-red";

type TermDef = { title: string; body: string; example?: string };

const TERMS: Record<TermKey, TermDef> = {
  "score": {
    title: "SKAAP Score",
    body: "A simple 0–100 health rating. We mix five things: nutrition (Nutri-Score), how processed it is (NOVA), additives, eco impact, and ingredient quality.",
    example: "75–100 = green (great) · 50–74 = amber (okay) · 0–49 = red (think twice).",
  },
  "nutri-score": {
    title: "Nutri-Score",
    body: "An A–E nutrition grade used across Europe. It rewards fiber, protein, fruit & veg, and penalizes sugar, salt, saturated fat, and calories.",
    example: "A is best, E is worst.",
  },
  "nova": {
    title: "NOVA group",
    body: "Tells you how processed a food is, from 1 to 4. 1 = whole foods. 4 = ultra-processed (lots of industrial ingredients you wouldn't find in a kitchen).",
    example: "Lower is better.",
  },
  "additives": {
    title: "Additives",
    body: "Anything added that isn't a basic food ingredient — colors, preservatives, sweeteners, thickeners. Some are harmless, some are flagged or banned elsewhere.",
    example: "Fewer is usually better.",
  },
  "eco": {
    title: "Eco-Score",
    body: "Estimates the environmental impact of the product — farming, packaging, transport, and end of life.",
    example: "Higher score = lighter footprint.",
  },
  "ingredients": {
    title: "Ingredient quality",
    body: "Short, recognizable ingredient lists score higher. Long lists full of industrial-sounding names score lower.",
  },
  "weight": {
    title: "Weight",
    body: "How much each part counts toward the final SKAAP Score. Nutri-Score matters most (35%), then NOVA (25%), additives (20%), eco (10%), ingredients (10%).",
  },
  "low-sugar": {
    title: "Low sugar",
    body: "Less than 5g of sugar per 100g. A good sign — your body handles small amounts of sugar much better than big spikes.",
  },
  "high-sugar": {
    title: "High sugar",
    body: "More than 15g of sugar per 100g. Frequent spikes can stress your energy levels, teeth, and long-term metabolic health.",
  },
  "low-salt": {
    title: "Low salt",
    body: "Less than 0.3g of salt per 100g. Easier on your blood pressure, especially across a whole day of eating.",
  },
  "low-sat-fat": {
    title: "Low saturated fat",
    body: "Less than 1.5g of saturated fat per 100g. Saturated fat in big amounts is linked to higher cholesterol.",
  },
  "high-sat-fat": {
    title: "High saturated fat",
    body: "More than 5g of saturated fat per 100g. Fine occasionally; worth watching if it stacks up across the day.",
  },
  "high-protein": {
    title: "High protein",
    body: "At least 8g of protein per 100g. Helps you stay full longer and supports muscle.",
  },
  "high-fiber": {
    title: "High fiber",
    body: "At least 6g of fiber per 100g. Great for digestion, steady energy, and feeling full.",
  },
  "live-cultures": {
    title: "Live cultures",
    body: "Contains good bacteria (like in yogurt or kefir) that support your gut.",
  },
  "no-additives": {
    title: "No additives",
    body: "No colors, preservatives, sweeteners or industrial ingredients added. As close to the real food as it gets.",
  },
  "some-additives": {
    title: "A few additives",
    body: "1–2 added ingredients. Usually fine, but worth knowing what they are.",
  },
  "many-additives": {
    title: "Lots of additives",
    body: "3+ added ingredients. Often a sign of ultra-processing. Tap individual additives below to see what each one does.",
  },
  "organic": {
    title: "Organic",
    body: "Grown without synthetic pesticides or fertilizers, and without GMOs.",
  },
  "verdict-green": {
    title: "Positive health impact",
    body: "This product scores 75 or higher — strong nutrition, few or no additives, generally a solid choice.",
  },
  "verdict-amber": {
    title: "Okay in moderation",
    body: "This product scores 50–74 — it has some good things going for it, but also a few flags. Fine sometimes, not every day.",
  },
  "verdict-red": {
    title: "Think twice",
    body: "This product scores below 50 — high in things to limit, or full of additives. Worth checking the alternatives below.",
  },
};

type Ctx = { explain: (term: TermKey) => void };
const TermCtx = createContext<Ctx | null>(null);

export function useExplain() {
  const ctx = useContext(TermCtx);
  if (!ctx) throw new Error("useExplain must be used inside <TermExplainerProvider>");
  return ctx.explain;
}

export function TermExplainerProvider({ children }: { children: ReactNode }) {
  const [term, setTerm] = useState<TermKey | null>(null);
  const def = term ? TERMS[term] : null;

  const explain = (t: TermKey) => {
    hapticLight();
    setTerm(t);
  };

  return (
    <TermCtx.Provider value={{ explain }}>
      {children}
      <AnimatePresence>
        {def && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setTerm(null)}
              className="fixed inset-0 z-[100]"
              style={{ background: "rgba(17,24,39,0.45)", backdropFilter: "blur(4px)" }}
            />
            <motion.div
              initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 280 }}
              className="fixed left-1/2 -translate-x-1/2 bottom-0 z-[101] w-full"
              style={{ maxWidth: 390 }}
            >
              <div
                className="px-5 pt-3 pb-8"
                style={{
                  background: "#fff",
                  borderTopLeftRadius: 24,
                  borderTopRightRadius: 24,
                  boxShadow: "0 -8px 30px rgba(17,24,39,0.15)",
                }}
              >
                <div className="flex justify-center mb-2">
                  <div style={{ width: 36, height: 4, borderRadius: 4, background: "#E5E7EB" }} />
                </div>
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full flex items-center justify-center" style={{ background: "#FEF2F4" }}>
                      <Info size={14} style={{ color: "#C41E3A" }} />
                    </div>
                    <h3 className="font-bold" style={{ fontSize: 17, color: "#111827" }}>{def.title}</h3>
                  </div>
                  <button onClick={() => setTerm(null)} aria-label="Close"
                    className="w-8 h-8 rounded-full flex items-center justify-center"
                    style={{ background: "#F3F4F6" }}>
                    <X size={14} style={{ color: "#374151" }} />
                  </button>
                </div>
                <p className="text-[14px] leading-relaxed" style={{ color: "#374151" }}>{def.body}</p>
                {def.example && (
                  <p className="text-[12px] mt-3 px-3 py-2 rounded-lg" style={{ color: "#6B7280", background: "#F9FAFB" }}>
                    {def.example}
                  </p>
                )}
                <button onClick={() => setTerm(null)}
                  className="mt-4 w-full py-3 rounded-2xl font-bold text-white text-[14px]"
                  style={{ background: "linear-gradient(135deg, #C41E3A, #9E1830)" }}>
                  Got it
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </TermCtx.Provider>
  );
}

/** Wrap any label/element to make it tappable and show its plain-English meaning. */
export function Explain({
  term, children, className, style, as: As = "button",
}: {
  term: TermKey;
  children: ReactNode;
  className?: string;
  style?: React.CSSProperties;
  as?: any;
}) {
  const explain = useExplain();
  return (
    <As
      type="button"
      onClick={(e: any) => { e.stopPropagation(); explain(term); }}
      className={className}
      style={{ cursor: "pointer", ...style }}
    >
      {children}
    </As>
  );
}
