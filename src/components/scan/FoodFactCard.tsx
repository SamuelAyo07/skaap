import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Lightbulb, ChevronRight } from "lucide-react";

const FOOD_FACTS = [
  { emoji: "🚨", fact: "1 in 8 US grocery products contains an additive banned in Europe.", source: "EFSA / USDA" },
  { emoji: "🧪", fact: "The US allows over 10,000 chemicals in food. The EU allows only 410.", source: "FDA vs EFSA" },
  { emoji: "🍞", fact: "Azodicarbonamide — the same chemical in yoga mats — is still legal in US bread.", source: "EU Food Safety" },
  { emoji: "⚪", fact: "Titanium dioxide is in 11,000+ US products but banned in Europe for potential DNA damage.", source: "EFSA 2022" },
  { emoji: "💪", fact: "Protein keeps you full longer and helps build muscle. Aim for 0.8g per kg of body weight daily.", source: "WHO Guidelines" },
  { emoji: "🌾", fact: "Most Americans only get half the recommended daily fiber. Aim for 25-30g per day.", source: "USDA" },
  { emoji: "🍬", fact: "The average American eats 17 teaspoons of added sugar daily. WHO recommends max 6.", source: "AHA / WHO" },
  { emoji: "🧂", fact: "90% of Americans consume too much sodium. It's hidden in bread, cheese, and sauces.", source: "CDC" },
  { emoji: "🔴", fact: "Red 40, Yellow 5, and Yellow 6 require warning labels in Europe but not in the US.", source: "EFSA" },
  { emoji: "🥦", fact: "Eating 5+ servings of fruits and vegetables daily can reduce heart disease risk by 20%.", source: "Harvard Health" },
  { emoji: "🧃", fact: "A single soda can contains about 39g of sugar — that's almost 10 teaspoons.", source: "USDA" },
  { emoji: "🐄", fact: "rBST growth hormone is injected into US dairy cows but banned in the EU, Canada, and Australia.", source: "EFSA / Health Canada" },
  { emoji: "🏷️", fact: "Companies can self-certify ingredients as 'Generally Recognized as Safe' without FDA review.", source: "FDA GRAS Loophole" },
  { emoji: "🌍", fact: "58,512 US food products contain at least one additive that's been banned or restricted elsewhere.", source: "Environmental Working Group" },
  { emoji: "🧠", fact: "Omega-3 fatty acids support brain health. Found in fish, walnuts, and flaxseed.", source: "NIH" },
  { emoji: "💧", fact: "Drinking water before meals can help reduce calorie intake by up to 13%.", source: "Journal of Clinical Nutrition" },
  { emoji: "🥛", fact: "Calcium doesn't just build bones — it helps your heart, muscles, and nerves function properly.", source: "NIH" },
  { emoji: "🫘", fact: "Legumes are one of the most nutrient-dense foods on earth — high in protein, fiber, and iron.", source: "WHO" },
  { emoji: "🍎", fact: "An apple's antioxidant power is equal to 1,500mg of vitamin C — but only with the skin on.", source: "Cornell University" },
  { emoji: "🌿", fact: "Ultra-processed foods now make up 58% of total calories consumed in the US.", source: "BMJ Open" },
];

function getDailyFact(): typeof FOOD_FACTS[0] {
  const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000);
  return FOOD_FACTS[dayOfYear % FOOD_FACTS.length];
}

export function FoodFactCard() {
  const [fact, setFact] = useState(getDailyFact());
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    setFact(getDailyFact());
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2, duration: 0.4 }}
      className="mx-5 mt-4 rounded-2xl overflow-hidden"
      style={{
        background: "linear-gradient(135deg, #FFF7ED 0%, #FFFBEB 100%)",
        border: "1px solid #FDE68A",
      }}
    >
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full text-left px-4 py-3.5 flex items-start gap-3"
        aria-expanded={expanded}
        aria-label="Food fact of the day"
      >
        <span className="text-2xl flex-shrink-0 mt-0.5">{fact.emoji}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-1">
            <Lightbulb size={13} style={{ color: "#D97706" }} />
            <span className="text-[11px] font-bold uppercase tracking-wider" style={{ color: "#D97706" }}>
              Food Fact of the Day
            </span>
          </div>
          <p className="text-[13px] font-semibold leading-snug" style={{ color: "#92400E" }}>
            {fact.fact}
          </p>
        </div>
        <ChevronRight
          size={16}
          className="flex-shrink-0 mt-2 transition-transform"
          style={{ color: "#D97706", transform: expanded ? "rotate(90deg)" : "rotate(0deg)" }}
        />
      </button>
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-3.5 pt-0">
              <div className="flex items-center gap-1.5 mt-1">
                <span className="text-[10px] font-medium px-2 py-0.5 rounded-full" style={{ background: "#FDE68A", color: "#92400E" }}>
                  Source: {fact.source}
                </span>
              </div>
              <p className="text-[12px] mt-2 leading-relaxed" style={{ color: "#B45309" }}>
                SKAAP flags every product with concerning additives so you can make informed choices. Scan any product to see what's really inside.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
