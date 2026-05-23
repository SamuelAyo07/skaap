// SKAAP Score Engine, Yuka-inspired scoring system
// Score = Nutrition (60%) + Additives (30%) + Organic (10%)

// ─── Additive Risk Database ───
const HIGH_RISK = new Set([
  "E102","E104","E110","E122","E123","E124","E129","E131","E132","E133",
  "E142","E151","E155","E173","E174","E175","E180","E211","E213","E214",
  "E215","E216","E217","E218","E219","E249","E250","E251","E252","E385",
  "E512","E954","E955","E951","E952",
]);

const NO_RISK = new Set([
  "E290","E296","E297","E375",
]);

const MODERATE_RISK = new Set([
  "E100","E101","E120","E150A","E150B","E150C","E150D","E160B","E161B",
  "E163","E170","E200","E201","E202","E203","E210","E212","E220","E221",
  "E222","E223","E224","E225","E226","E227","E228","E234","E235","E239",
  "E260","E261","E262","E263","E270","E280","E281","E282","E283","E300",
  "E301","E302","E303","E304","E306","E307","E308","E309","E310","E311",
  "E312","E315","E316","E319","E320","E321","E322","E325","E326","E327",
  "E330","E331","E332","E333","E334","E335","E336","E337","E338","E339",
  "E340","E341","E343","E345","E349","E350","E351","E352","E353","E354",
  "E355","E356","E357","E359","E363","E380","E381","E383","E384","E386",
  "E387","E400","E401","E402","E403","E404","E405","E406","E407","E407A",
  "E408","E409","E410","E412","E413","E414","E415","E416","E417","E418",
  "E422","E432","E433","E434","E435","E436","E440","E442","E444","E445",
  "E450","E451","E452","E460","E461","E462","E463","E464","E465","E466",
  "E467","E468","E469","E470A","E470B","E471","E472A","E472B","E472C",
  "E472D","E472E","E472F","E473","E474","E475","E476","E477","E478",
  "E479B","E480","E481","E482","E483","E484","E485","E486","E487","E488",
  "E489","E491","E492","E493","E494","E495","E500","E501","E503","E504",
  "E507","E508","E509","E511","E513","E514","E515","E516","E517","E519",
  "E520","E521","E522","E523","E524","E525","E526","E527","E528","E529",
  "E530","E535","E536","E538","E541","E551","E552","E553A","E553B","E554",
  "E555","E556","E558","E559","E570","E574","E575","E576","E577","E578",
  "E579","E585","E620","E621","E622","E623","E624","E625","E626","E627",
  "E628","E629","E630","E631","E632","E633","E634","E635","E640","E650",
  "E900","E901","E902","E903","E904","E905","E907","E912","E914","E920",
  "E927B","E928","E938","E939","E941","E942","E943A","E943B","E944",
  "E948","E949","E950","E957","E959","E961","E962","E965","E966","E967",
  "E968","E999","E1100","E1101","E1102","E1103","E1104","E1105","E1200",
  "E1201","E1202","E1203","E1204","E1205","E1206","E1207","E1208","E1209",
  "E1210","E1211","E1212","E1213","E1214","E1400","E1401","E1402","E1403",
  "E1404","E1405","E1410","E1411","E1412","E1413","E1414","E1420","E1421",
  "E1422","E1423","E1430","E1440","E1441","E1442","E1443","E1450","E1451",
  "E1452",
]);

export type AdditiveRiskLevel = "high" | "moderate" | "limited" | "none";

export function getAdditiveRisk(tag: string): AdditiveRiskLevel {
  const code = tag.replace(/^en:/, "").replace(/-.*$/, "").toUpperCase().replace(/[^E0-9A-Z]/g, "");
  if (NO_RISK.has(code)) return "none";
  if (HIGH_RISK.has(code)) return "high";
  if (MODERATE_RISK.has(code)) return "moderate";
  return "limited";
}

export function getAdditiveRiskColor(level: AdditiveRiskLevel): string {
  switch (level) {
    case "high": return "#E8314A";
    case "moderate": return "#FF6D00";
    case "limited": return "#FFC107";
    case "none": return "#2D7D46";
  }
}

export function getAdditiveRiskLabel(level: AdditiveRiskLevel): string {
  switch (level) {
    case "high": return "High risk";
    case "moderate": return "Moderate";
    case "limited": return "Limited risk";
    case "none": return "Low risk";
  }
}

// ─── Additive descriptions (plain language, <12 words) ───
const ADDITIVE_DESCRIPTIONS: Record<string, string> = {
  "E100": "Natural yellow coloring from turmeric root.",
  "E101": "Vitamin B2, also known as riboflavin.",
  "E102": "Synthetic azo dye used for bright yellow coloring.",
  "E104": "Synthetic yellow dye, quinoline yellow.",
  "E110": "Synthetic orange-yellow azo dye (Sunset Yellow).",
  "E120": "Red coloring derived from cochineal insects.",
  "E122": "Synthetic red azo dye (Azorubine).",
  "E123": "Synthetic red dye (Amaranth), banned in some countries.",
  "E124": "Synthetic red azo dye (Ponceau 4R).",
  "E129": "Synthetic red azo dye (Allura Red AC).",
  "E131": "Synthetic blue dye (Patent Blue V).",
  "E132": "Synthetic blue dye (Indigotine).",
  "E133": "Synthetic blue dye (Brilliant Blue FCF).",
  "E142": "Synthetic green dye (Green S).",
  "E150A": "Caramel coloring made by heating sugar.",
  "E150B": "Caramel coloring produced with sulfite.",
  "E150C": "Caramel coloring produced with ammonia.",
  "E150D": "Caramel coloring used in cola-type drinks.",
  "E160A": "Beta-carotene, a natural orange-yellow pigment.",
  "E160B": "Annatto extract, natural orange food coloring.",
  "E170": "Calcium carbonate, natural white mineral coloring.",
  "E200": "Sorbic acid, a preservative against mold and yeast.",
  "E202": "Potassium sorbate, common preservative for shelf life.",
  "E210": "Benzoic acid, preservative found naturally in berries.",
  "E211": "Sodium benzoate, common synthetic preservative.",
  "E220": "Sulphur dioxide, preservative used in dried fruits and wine.",
  "E250": "Sodium nitrite, preservative in cured meats.",
  "E251": "Sodium nitrate, curing agent in processed meats.",
  "E252": "Potassium nitrate, preservative in cured meats.",
  "E270": "Lactic acid, natural acidity regulator.",
  "E280": "Propionic acid, preservative against mold in bread.",
  "E290": "Carbon dioxide, used for carbonation in drinks.",
  "E296": "Malic acid, natural tart flavoring from fruits.",
  "E297": "Fumaric acid, an acidity regulator.",
  "E300": "Vitamin C (ascorbic acid), antioxidant.",
  "E301": "Sodium ascorbate, a form of vitamin C.",
  "E306": "Vitamin E extract, natural antioxidant.",
  "E307": "Synthetic vitamin E (alpha-tocopherol).",
  "E310": "Propyl gallate, synthetic antioxidant.",
  "E320": "BHA (butylated hydroxyanisole), synthetic antioxidant.",
  "E321": "BHT (butylated hydroxytoluene), synthetic antioxidant.",
  "E322": "Lecithin, emulsifier from soy or sunflower.",
  "E325": "Sodium lactate, acidity regulator and humectant.",
  "E330": "Citric acid, natural acidity regulator from citrus.",
  "E331": "Sodium citrate, acidity regulator and emulsifier.",
  "E332": "Potassium citrate, acidity regulator.",
  "E333": "Calcium citrate, acidity regulator and firming agent.",
  "E334": "Tartaric acid, natural acid from grapes.",
  "E338": "Phosphoric acid, acidulant used in cola drinks.",
  "E339": "Sodium phosphate, emulsifier and acidity regulator.",
  "E340": "Potassium phosphate, acidity regulator.",
  "E341": "Calcium phosphate, anti-caking and raising agent.",
  "E400": "Alginic acid, thickener from brown seaweed.",
  "E401": "Sodium alginate, thickener and stabilizer from seaweed.",
  "E406": "Agar-agar, natural gelling agent from seaweed.",
  "E407": "Carrageenan, thickener and stabilizer from seaweed.",
  "E410": "Locust bean gum, natural thickener from carob.",
  "E412": "Guar gum, natural thickener from guar beans.",
  "E414": "Gum arabic, natural stabilizer from acacia trees.",
  "E415": "Xanthan gum, thickener produced by fermentation.",
  "E420": "Sorbitol, sugar alcohol used as sweetener.",
  "E422": "Glycerol, humectant and sweetener.",
  "E440": "Pectin, natural gelling agent from fruit.",
  "E450": "Diphosphates, raising agent and emulsifier.",
  "E451": "Triphosphates, stabilizer in processed meat.",
  "E452": "Polyphosphates, emulsifier in processed foods.",
  "E460": "Cellulose, plant fiber used as anti-caking agent.",
  "E461": "Methyl cellulose, thickener and emulsifier.",
  "E464": "Hydroxypropyl methyl cellulose, thickener and coating.",
  "E466": "Carboxymethyl cellulose, thickener and stabilizer.",
  "E471": "Mono and diglycerides, emulsifier from fats.",
  "E472A": "Acetic acid esters, emulsifier in baked goods.",
  "E472B": "Lactic acid esters, emulsifier in baked goods.",
  "E472C": "Citric acid esters, emulsifier in baked goods.",
  "E472E": "Mono and diacetyltartaric acid esters.",
  "E473": "Sucrose esters, emulsifier from sugar and fats.",
  "E475": "Polyglycerol esters, emulsifier in baked goods.",
  "E476": "Polyglycerol polyricinoleate, emulsifier in chocolate.",
  "E481": "Sodium stearoyl lactylate, dough conditioner.",
  "E491": "Sorbitan monostearate, emulsifier in baked goods.",
  "E500": "Sodium carbonate, raising agent (baking soda).",
  "E501": "Potassium carbonate, acidity regulator.",
  "E503": "Ammonium carbonate, raising agent.",
  "E504": "Magnesium carbonate, anti-caking agent.",
  "E507": "Hydrochloric acid, acidity regulator.",
  "E508": "Potassium chloride, salt substitute and firming agent.",
  "E509": "Calcium chloride, firming agent in canned vegetables.",
  "E511": "Magnesium chloride, firming agent.",
  "E516": "Calcium sulfate, firming agent and flour treatment.",
  "E524": "Sodium hydroxide, acidity regulator.",
  "E551": "Silicon dioxide, anti-caking agent.",
  "E621": "Monosodium glutamate (MSG), flavor enhancer.",
  "E627": "Disodium guanylate, flavor enhancer.",
  "E631": "Disodium inosinate, flavor enhancer.",
  "E635": "Disodium 5'-ribonucleotides, flavor enhancer.",
  "E900": "Dimethylpolysiloxane, anti-foaming agent.",
  "E901": "Beeswax, glazing agent.",
  "E903": "Carnauba wax, glazing and polishing agent.",
  "E904": "Shellac, glazing agent from lac insect.",
  "E920": "L-cysteine, flour treatment agent.",
  "E938": "Argon, packaging gas.",
  "E941": "Nitrogen, packaging gas.",
  "E948": "Oxygen, packaging gas.",
  "E949": "Hydrogen, packaging gas.",
  "E950": "Acesulfame K, artificial sweetener.",
  "E951": "Aspartame, artificial sweetener.",
  "E952": "Cyclamate, artificial sweetener.",
  "E954": "Saccharin, artificial sweetener.",
  "E955": "Sucralose, artificial sweetener.",
  "E957": "Thaumatin, natural intense sweetener.",
  "E959": "Neohesperidine DC, sweetener and flavor modifier.",
  "E965": "Maltitol, sugar alcohol sweetener.",
  "E966": "Lactitol, sugar alcohol sweetener.",
  "E967": "Xylitol, sugar alcohol from birch trees.",
  "E968": "Erythritol, sugar alcohol with zero calories.",
  "E999": "Quillaia extract, foaming agent.",
  "E1400": "Dextrin, modified starch thickener.",
  "E1404": "Oxidised starch, thickener and binder.",
  "E1410": "Monostarch phosphate, modified starch thickener.",
  "E1412": "Distarch phosphate, modified starch thickener.",
  "E1414": "Acetylated distarch phosphate, modified thickener.",
  "E1420": "Acetylated starch, modified starch.",
  "E1422": "Acetylated distarch adipate, modified starch.",
  "E1442": "Hydroxy propyl distarch phosphate, thickener.",
  "E1450": "Starch sodium octenyl succinate, emulsifying starch.",
  "E1451": "Acetylated oxidised starch, modified starch.",
};

export function getAdditiveDescription(tag: string): string {
  const code = tag.replace(/^en:/, "").replace(/-.*$/, "").toUpperCase().replace(/[^E0-9A-Z]/g, "");
  return ADDITIVE_DESCRIPTIONS[code] || "Food additive used in processing.";
}

// ─── Nutri-Score to points ───
function nutriScoreToPoints(grade?: string): number {
  if (!grade) return 50;
  switch (grade.toLowerCase()) {
    case "a": return 100;
    case "b": return 80;
    case "c": return 60;
    case "d": return 30;
    case "e": return 0;
    default: return 50;
  }
}

// ─── Organic check ───
function isOrganic(labelsTags?: string[]): boolean {
  if (!labelsTags) return false;
  return labelsTags.some(l => l.toLowerCase().includes("organic"));
}

// ─── Score calculation ───
export interface SkaapScoreBreakdown {
  total: number;
  nutritionPoints: number;
  nutritionContribution: number;
  additivePoints: number;
  additiveContribution: number;
  organicPoints: number;
  organicContribution: number;
  hasHighRiskAdditive: boolean;
  worstAdditiveRisk: AdditiveRiskLevel;
  additiveCount: number;
  isOrganic: boolean;
  nutriScoreGrade?: string;
}

export function calculateSkaapScore(
  nutriScoreGrade?: string,
  additivesTags?: string[],
  labelsTags?: string[],
): SkaapScoreBreakdown {
  // Nutrition (60%)
  const nutritionPoints = nutriScoreToPoints(nutriScoreGrade);
  const nutritionContribution = Math.round(nutritionPoints * 0.60);

  // Additives (30%)
  let additivePoints = 100;
  let hasHighRiskAdditive = false;
  let worstRisk: AdditiveRiskLevel = "none";
  const riskOrder: AdditiveRiskLevel[] = ["none", "limited", "moderate", "high"];

  const additivesArr = additivesTags || [];
  for (const tag of additivesArr) {
    const risk = getAdditiveRisk(tag);
    if (riskOrder.indexOf(risk) > riskOrder.indexOf(worstRisk)) worstRisk = risk;
    switch (risk) {
      case "high":
        additivePoints -= 30;
        hasHighRiskAdditive = true;
        break;
      case "moderate":
        additivePoints -= 15;
        break;
      case "limited":
        additivePoints -= 6;
        break;
      case "none":
        break;
    }
  }
  additivePoints = Math.max(0, additivePoints);
  if (hasHighRiskAdditive) additivePoints = Math.min(additivePoints, 49);
  const additiveContribution = Math.round(additivePoints * 0.30);

  // Organic (10%)
  const organic = isOrganic(labelsTags);
  const organicPoints = organic ? 100 : 0;
  const organicContribution = Math.round(organicPoints * 0.10);

  const total = Math.min(100, Math.max(0, nutritionContribution + additiveContribution + organicContribution));

  return {
    total,
    nutritionPoints,
    nutritionContribution,
    additivePoints,
    additiveContribution,
    organicPoints,
    organicContribution,
    hasHighRiskAdditive,
    worstAdditiveRisk: additivesArr.length === 0 ? "none" : worstRisk,
    additiveCount: additivesArr.length,
    isOrganic: organic,
    nutriScoreGrade,
  };
}

export function getScoreColor(score: number): string {
  if (score >= 75) return "#22C55E";
  if (score >= 50) return "#F59E0B";
  if (score >= 25) return "#FF6D00";
  return "#E8314A";
}

export function getScoreVerdict(score: number): string {
  if (score >= 75) return "Excellent";
  if (score >= 50) return "Good";
  if (score >= 25) return "Mediocre";
  return "Poor";
}

export function getVerdictBanner(score: number): string {
  if (score >= 75) return "This product has a positive health impact";
  if (score >= 50) return "This product has a limited health impact";
  if (score >= 25) return "This product has a moderate health impact";
  return "This product has a significant health impact";
}

// ─── Pre-computed Nutella demo data ───
export const NUTELLA_DEMO = {
  productName: "Nutella",
  brand: "Ferrero",
  quantity: "400g",
  imageUrl: "https://images.openfoodfacts.org/images/products/301/762/042/2003/front_en.625.400.jpg",
  nutriScoreGrade: "d",
  novaGroup: 4,
  additivesTags: ["en:e322", "en:e471", "en:e500"],
  labelsTags: [],
  nutriments: {
    energyKcal100g: 539,
    fat100g: 30.9,
    saturatedFat100g: 10.6,
    carbs100g: 57.5,
    sugars100g: 56.3,
    fiber100g: 3.4,
    protein100g: 6.3,
    salt100g: 0.107,
  },
  nutrientLevels: { fat: "high", saturatedFat: "high", sugars: "high", salt: "low" },
  ingredientsText: "Sugar, palm oil, hazelnuts 13%, fat-reduced cocoa 7.4%, skimmed milk powder 6.6%, whey powder, lecithins (soy), vanillin.",
  allergensTags: ["en:milk", "en:soybeans", "en:nuts"],
};
