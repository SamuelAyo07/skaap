// Reads beauty personalization (skin goals / type / allergies) saved by PersonalizationCard.
// Used by scan results to surface matches and avoids for beauty products.

const STORAGE_KEY = "skaap_personalization_v1";

export interface SkinPrefs {
  skinGoals: string[];
  skinType: string[];
  skinAllergies: string[];
  notes: string;
}

export function getSkinPrefs(): SkinPrefs {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { skinGoals: [], skinType: [], skinAllergies: [], notes: "" };
    const p = JSON.parse(raw);
    return {
      skinGoals: p.skinGoals || [],
      skinType: p.skinType || [],
      skinAllergies: p.skinAllergies || [],
      notes: p.notes || "",
    };
  } catch {
    return { skinGoals: [], skinType: [], skinAllergies: [], notes: "" };
  }
}

// Loose ingredient keyword maps. Plain English, kid-friendly hints.
// Match = ingredient that supports a goal. Avoid = ingredient flagged by user.
const GOAL_INGREDIENTS: Record<string, { kw: string[]; why: string }> = {
  "Hydration":       { kw: ["hyaluronic", "glycerin", "panthenol", "squalane", "ceramide", "aloe"], why: "hydrating ingredients" },
  "Anti-aging":      { kw: ["retinol", "retinal", "bakuchiol", "peptide", "coenzyme q10", "vitamin c", "ascorbic"], why: "anti-aging actives" },
  "Acne":            { kw: ["salicylic", "benzoyl peroxide", "niacinamide", "zinc", "azelaic", "tea tree"], why: "acne-fighters" },
  "Brightening":     { kw: ["vitamin c", "ascorbic", "niacinamide", "alpha arbutin", "kojic", "tranexamic", "licorice"], why: "brightening actives" },
  "Redness":         { kw: ["centella", "cica", "madecassoside", "allantoin", "oat", "bisabolol"], why: "calming ingredients" },
  "Dark spots":      { kw: ["vitamin c", "ascorbic", "alpha arbutin", "kojic", "tranexamic", "niacinamide"], why: "dark-spot fighters" },
  "Pores":           { kw: ["niacinamide", "salicylic", "clay", "charcoal", "bha"], why: "pore-refining" },
  "Firmness":        { kw: ["peptide", "retinol", "collagen", "vitamin c"], why: "firming actives" },
  "Sensitivity care":{ kw: ["centella", "cica", "panthenol", "allantoin", "oat", "ceramide", "bisabolol"], why: "calming for sensitive skin" },
  "Barrier repair":  { kw: ["ceramide", "cholesterol", "fatty acid", "panthenol", "squalane", "niacinamide"], why: "barrier-repair lipids" },
};

const ALLERGY_INGREDIENTS: Record<string, string[]> = {
  "Fragrance":      ["fragrance", "parfum", "perfume", "linalool", "limonene", "citronellol", "geraniol"],
  "Parabens":       ["paraben"],
  "Sulfates":       ["sulfate", "sodium lauryl", "sodium laureth", "sls", "sles"],
  "Essential oils": ["essential oil", "lavender oil", "tea tree oil", "peppermint oil", "eucalyptus oil"],
  "Nickel":         ["nickel"],
  "Lanolin":        ["lanolin"],
  "Formaldehyde":   ["formaldehyde", "quaternium-15", "dmdm hydantoin", "imidazolidinyl urea", "diazolidinyl urea"],
  "Nut oils":       ["almond oil", "argan oil", "walnut", "macadamia", "hazelnut", "peanut"],
};

// Skin-type guidance, fired only when there's a clear conflict in the formula.
const SKIN_TYPE_AVOIDS: Record<string, { kw: string[]; why: string }> = {
  "Oily":        { kw: ["mineral oil", "coconut oil", "isopropyl myristate"], why: "may feel heavy on oily skin" },
  "Dry":         { kw: ["alcohol denat", "denatured alcohol", "sd alcohol"], why: "drying alcohol" },
  "Sensitive":   { kw: ["fragrance", "parfum", "alcohol denat", "menthol", "eucalyptus"], why: "may irritate sensitive skin" },
  "Acne-prone":  { kw: ["coconut oil", "isopropyl myristate", "lanolin"], why: "can clog acne-prone pores" },
  "Mature":      { kw: ["alcohol denat", "denatured alcohol"], why: "drying for mature skin" },
};

export interface BeautyMatch {
  matches: { goal: string; ingredient: string; why: string }[];
  avoids:  { reason: string; ingredient: string; severity: "high" | "med" }[];
}

export function analyzeBeautyMatch(ingredientsText: string | undefined, prefs: SkinPrefs): BeautyMatch {
  const out: BeautyMatch = { matches: [], avoids: [] };
  if (!ingredientsText) return out;
  const text = ingredientsText.toLowerCase();

  for (const goal of prefs.skinGoals) {
    const map = GOAL_INGREDIENTS[goal];
    if (!map) continue;
    const hit = map.kw.find(k => text.includes(k));
    if (hit) out.matches.push({ goal, ingredient: hit, why: map.why });
  }

  for (const allergy of prefs.skinAllergies) {
    const kws = ALLERGY_INGREDIENTS[allergy] || [];
    const hit = kws.find(k => text.includes(k));
    if (hit) out.avoids.push({ reason: allergy, ingredient: hit, severity: "high" });
  }

  for (const type of prefs.skinType) {
    const map = SKIN_TYPE_AVOIDS[type];
    if (!map) continue;
    const hit = map.kw.find(k => text.includes(k));
    if (hit && !out.avoids.find(a => a.ingredient === hit)) {
      out.avoids.push({ reason: map.why, ingredient: hit, severity: "med" });
    }
  }

  return out;
}

export function hasAnySkinPrefs(prefs: SkinPrefs): boolean {
  return prefs.skinGoals.length + prefs.skinType.length + prefs.skinAllergies.length > 0;
}
