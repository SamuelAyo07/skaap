import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Lightbulb, ChevronRight, RefreshCw } from "lucide-react";

const FOOD_FACTS = [
  { emoji: "🚨", fact: "1 in 8 US grocery products contains an additive banned in Europe.", source: "EFSA / USDA", learn: "The EU uses the 'precautionary principle', if there's doubt about safety, it's banned. The US waits for proof of harm. That's why US shelves have ingredients you won't find in Europe." },
  { emoji: "🧪", fact: "The US allows over 10,000 chemicals in food. The EU allows only 410.", source: "FDA vs EFSA", learn: "Many of these chemicals entered the US food supply through the GRAS loophole, companies can self-certify ingredients as safe without FDA review." },
  { emoji: "🍞", fact: "Azodicarbonamide, the same chemical in yoga mats, is still legal in US bread.", source: "EU Food Safety", learn: "It's used to make bread fluffier and whiter. The EU, Australia, and Singapore have banned it. The WHO linked it to respiratory issues in workers." },
  { emoji: "⚪", fact: "Titanium dioxide is in 11,000+ US products but banned in Europe.", source: "EFSA 2022", learn: "Used to make foods look brighter and whiter (candy coatings, frosting, coffee creamer). The EU banned it after studies showed it could damage DNA in your gut cells." },
  { emoji: "💪", fact: "Protein keeps you full longer and helps build muscle. Aim for 0.8g per kg daily.", source: "WHO Guidelines", learn: "Your body uses protein to repair cells and make new ones. Good sources: eggs, fish, beans, Greek yogurt. Spreading protein across meals works better than loading up at dinner." },
  { emoji: "🌾", fact: "Most Americans only get half the recommended daily fiber.", source: "USDA", learn: "Fiber feeds the good bacteria in your gut, helps you stay full, and keeps your digestion smooth. Think oats, berries, lentils, and whole grains, not supplements." },
  { emoji: "🍬", fact: "The average American eats 17 teaspoons of added sugar daily. WHO says max 6.", source: "AHA / WHO", learn: "That's almost 3x the recommended amount! Sugar hides in 'healthy' foods like granola bars, yogurt, and sauces. Check the label, if sugar is in the first 3 ingredients, it's a lot." },
  { emoji: "🧂", fact: "90% of Americans consume too much sodium, it's hidden everywhere.", source: "CDC", learn: "Your body only needs about 500mg of sodium per day. But the average intake is 3,400mg! The biggest sources aren't the salt shaker, they're bread, pizza, and processed meats." },
  { emoji: "🔴", fact: "Red 40, Yellow 5, and Yellow 6 require warning labels in Europe but not in the US.", source: "EFSA", learn: "In the EU, products with these dyes must say 'may have an adverse effect on activity and attention in children.' US companies use the same dyes with no warning required." },
  { emoji: "🥦", fact: "5+ servings of fruits & veggies daily cuts heart disease risk by 20%.", source: "Harvard Health", learn: "A serving is smaller than you think: one apple, half a cup of cooked broccoli, or a handful of berries. Different colors = different nutrients. Eat the rainbow! 🌈" },
  { emoji: "🧃", fact: "A single soda can has ~39g of sugar, almost 10 teaspoons.", source: "USDA", learn: "Your body processes liquid sugar much faster than sugar in food, causing a bigger blood sugar spike. Even 'natural' fruit juices can have just as much sugar as soda." },
  { emoji: "🐄", fact: "rBST growth hormone is in US dairy but banned in the EU, Canada & Australia.", source: "EFSA / Health Canada", learn: "rBST is injected into cows to produce more milk. It increases infections in cows (requiring more antibiotics) and raises IGF-1 levels in milk, which some studies link to cancer risk." },
  { emoji: "🏷️", fact: "Companies can self-certify ingredients as 'Safe' without FDA review.", source: "FDA GRAS Loophole", learn: "The GRAS (Generally Recognized As Safe) system lets food companies hire their own scientists to declare ingredients safe, and they don't even have to tell the FDA about it." },
  { emoji: "🌍", fact: "58,512 US food products contain at least one globally restricted additive.", source: "Environmental Working Group", learn: "That means there's a good chance something in your pantry right now contains an ingredient that another country has decided isn't safe enough for their citizens." },
  { emoji: "🧠", fact: "Omega-3 fatty acids support brain health, most people don't get enough.", source: "NIH", learn: "Your brain is nearly 60% fat, and it needs omega-3s to build brain and nerve cells. Best sources: salmon, sardines, walnuts, chia seeds, and flaxseed." },
  { emoji: "💧", fact: "Drinking water before meals can reduce calorie intake by up to 13%.", source: "Journal of Clinical Nutrition", learn: "Water takes up space in your stomach, which makes you feel more full. Try drinking a full glass 30 minutes before eating, it's the simplest health hack that actually works." },
  { emoji: "🫘", fact: "Legumes are among the most nutrient-dense foods on Earth.", source: "WHO", learn: "Beans, lentils, and chickpeas pack protein, fiber, iron, and B vitamins into one cheap package. People in Blue Zones (where people live longest) eat legumes daily." },
  { emoji: "🍎", fact: "An apple's antioxidant power equals 1,500mg of vitamin C, but only with the skin.", source: "Cornell University", learn: "The peel contains most of the fiber and antioxidants. Peeling an apple removes 50% of its vitamin C and most of its flavonoids. Always eat the skin! 🍎" },
  { emoji: "🌿", fact: "Ultra-processed foods now make up 58% of total calories in the US.", source: "BMJ Open", learn: "Ultra-processed means it's been through heavy industrial processing and contains ingredients you wouldn't find in a home kitchen (emulsifiers, flavor enhancers, colorings)." },
  { emoji: "🇳🇬", fact: "Nigeria bans Potassium Bromate in bread, the US still allows it.", source: "NAFDAC", learn: "Potassium Bromate is used to strengthen bread dough. It's classified as a possible carcinogen by the IARC. Nigeria, the EU, and Brazil have all banned it." },
  { emoji: "🇯🇵", fact: "Japan has one of the strictest food additive approval systems in the world.", source: "MHLW Japan", learn: "Japan evaluates every additive individually and requires extensive safety data. Many colors and preservatives common in the US are not approved in Japan." },
  { emoji: "🇧🇷", fact: "Brazil banned trans fats entirely in 2023, the US only partially restricts them.", source: "ANVISA", learn: "Artificial trans fats raise bad cholesterol AND lower good cholesterol, a double hit. Brazil joins Denmark, Austria, and Iceland in a full ban." },
  { emoji: "🥚", fact: "Eggs contain all 9 essential amino acids, they're a 'complete protein'.", source: "USDA", learn: "One large egg has 6g of protein, vitamin D, B12, and choline (critical for brain health). The yolk has most of the nutrients, don't skip it!" },
  { emoji: "🍫", fact: "Dark chocolate (70%+) has more antioxidants than blueberries.", source: "Journal of Nutrition", learn: "Cocoa is packed with flavonoids that improve blood flow and lower blood pressure. The key is 70%+ cocoa, milk chocolate doesn't count. A small square daily is plenty." },
  { emoji: "🥑", fact: "Avocados have more potassium than bananas, and potassium fights bloating.", source: "USDA", learn: "Potassium helps your kidneys flush out excess sodium, reducing water retention. One avocado has 975mg vs banana's 422mg. It also has healthy fats that help absorb vitamins." },
];

function getDailyFact(): typeof FOOD_FACTS[0] {
  const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000);
  return FOOD_FACTS[dayOfYear % FOOD_FACTS.length];
}

export function FoodFactCard() {
  const [factIndex, setFactIndex] = useState(() => {
    const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000);
    return dayOfYear % FOOD_FACTS.length;
  });
  const [expanded, setExpanded] = useState(false);
  const fact = FOOD_FACTS[factIndex];

  const nextFact = () => {
    setExpanded(false);
    setFactIndex((factIndex + 1) % FOOD_FACTS.length);
  };

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
              Did You Know?
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
              <p className="text-[12px] leading-relaxed" style={{ color: "#92400E" }}>
                {fact.learn}
              </p>
              <div className="flex items-center justify-between mt-3">
                <span className="text-[10px] font-medium px-2 py-0.5 rounded-full" style={{ background: "#FDE68A", color: "#92400E" }}>
                  Source: {fact.source}
                </span>
                <button
                  onClick={(e) => { e.stopPropagation(); nextFact(); }}
                  className="flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-full"
                  style={{ background: "#FDE68A", color: "#92400E" }}
                >
                  <RefreshCw size={10} /> Next fact
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
