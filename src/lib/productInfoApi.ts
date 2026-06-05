// On-demand product info fetcher with session cache
// Only called when user taps the "Info" button, never on scan

import { supabase } from "@/integrations/supabase/client";

export interface ProductFullInfo {
  productName: string;
  brand?: string;
  imageUrl?: string;
  imageSmallUrl?: string;
  quantity?: string;
  nutriScoreGrade?: string;
  novaGroup?: number;
  nutriments?: {
    energyKcal100g?: number;
    fat100g?: number;
    saturatedFat100g?: number;
    carbs100g?: number;
    sugars100g?: number;
    fiber100g?: number;
    protein100g?: number;
    salt100g?: number;
  };
  nutrientLevels?: {
    fat?: string;
    saturatedFat?: string;
    sugars?: string;
    salt?: string;
  };
  ingredientsText?: string;
  allergensTags?: string[];
  additivesTags?: string[];
  labelsTags?: string[];
  usdaFallback?: boolean;
  ecoscoreGrade?: string;
  ecoscoreScore?: number;
  categoriesTags?: string[];
  servingSize?: string;
  aiGeneratedImage?: boolean;
  // ===== Cosmetics-specific enrichment (Open Beauty Facts) =====
  isCosmetic?: boolean;
  inciList?: string[];          // parsed INCI ingredients
  cosmeticForm?: string;        // cream / lotion / balm / serum / oil / spray / gel / stick
  skinType?: string[];          // dry / oily / sensitive / combination / all
  spf?: number;                 // SPF value if sun protection
  allergenHighlights?: string[];// EU 26 allergens detected (fragrance allergens etc.)
  periodsAfterOpening?: string; // e.g. "12 M"
  packaging?: string;
}




const sessionCache = new Map<string, ProductFullInfo | null>();

async function tryFetch(url: string, isBeauty = false): Promise<ProductFullInfo | null> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeout);
    if (!res.ok) return null;

    const data = await res.json();
    if (data.status !== 1 || !data.product) return null;

    const p = data.product;
    const n = p.nutriments || {};
    const nl = p.nutrient_levels || {};

    const ingredientsText: string | undefined = p.ingredients_text_en || p.ingredients_text || undefined;
    const categoriesTags: string[] | undefined = p.categories_tags?.length ? p.categories_tags : undefined;

    const base: ProductFullInfo = {
      productName: p.product_name || p.product_name_en || "Unknown Product",
      brand: p.brands || undefined,
      imageUrl: p.image_front_url || p.image_url || undefined,
      imageSmallUrl: p.image_front_small_url || undefined,
      quantity: p.quantity || undefined,
      nutriScoreGrade: p.nutriscore_grade || undefined,
      novaGroup: p.nova_group ? Number(p.nova_group) : undefined,
      nutriments: {
        energyKcal100g: n["energy-kcal_100g"],
        fat100g: n.fat_100g,
        saturatedFat100g: n["saturated-fat_100g"],
        carbs100g: n.carbohydrates_100g,
        sugars100g: n.sugars_100g,
        fiber100g: n.fiber_100g,
        protein100g: n.proteins_100g,
        salt100g: n.salt_100g,
      },
      nutrientLevels: {
        fat: nl.fat,
        saturatedFat: nl["saturated-fat"],
        sugars: nl.sugars,
        salt: nl.salt,
      },
      ingredientsText,
      allergensTags: p.allergens_tags?.length ? p.allergens_tags : undefined,
      additivesTags: p.additives_tags?.length ? p.additives_tags : undefined,
      labelsTags: p.labels_tags?.length ? p.labels_tags : undefined,
      ecoscoreGrade: p.ecoscore_grade || undefined,
      ecoscoreScore: p.ecoscore_score != null ? Number(p.ecoscore_score) : undefined,
      categoriesTags,
      servingSize: p.serving_size || undefined,
    };

    // ===== Cosmetics enrichment =====
    if (isBeauty) {
      base.isCosmetic = true;
      base.periodsAfterOpening = p.periods_after_opening || undefined;
      base.packaging = p.packaging || undefined;

      // Parse INCI list from ingredients_text (comma-separated, ALL CAPS-ish)
      if (ingredientsText) {
        base.inciList = ingredientsText
          .split(/[,•·]/)
          .map((s: string) => s.replace(/[\[\]().*]/g, "").trim())
          .filter((s: string) => s.length > 1 && s.length < 80)
          .slice(0, 60);
      }

      // Cosmetic form from categories or product name
      const haystack = [...(categoriesTags || []), base.productName || "", p.generic_name || ""]
        .join(" ").toLowerCase();
      const forms = [
        ["cream", "cream"], ["lotion", "lotion"], ["balm", "balm"], ["serum", "serum"],
        ["oil", "oil"], ["spray", "spray"], ["gel", "gel"], ["stick", "stick"],
        ["mask", "mask"], ["foam", "foam"], ["mist", "mist"], ["powder", "powder"],
        ["shampoo", "shampoo"], ["conditioner", "conditioner"], ["soap", "soap"],
      ];
      for (const [needle, label] of forms) {
        if (haystack.includes(needle)) { base.cosmeticForm = label; break; }
      }

      // SPF detection
      const spfMatch = haystack.match(/spf\s*(\d{1,3})/i);
      if (spfMatch) base.spf = Math.min(100, parseInt(spfMatch[1], 10));

      // Skin type
      const skinTypes: string[] = [];
      for (const t of ["sensitive", "dry", "oily", "combination", "normal", "mature", "acne"]) {
        if (haystack.includes(t)) skinTypes.push(t);
      }
      if (haystack.includes("all skin") || haystack.includes("tous types")) skinTypes.push("all");
      if (skinTypes.length) base.skinType = Array.from(new Set(skinTypes));

      // EU 26 fragrance allergens highlight (subset of common ones)
      const eu26 = [
        "limonene", "linalool", "citronellol", "geraniol", "citral", "eugenol",
        "coumarin", "farnesol", "benzyl alcohol", "benzyl benzoate", "benzyl salicylate",
        "cinnamal", "cinnamyl alcohol", "hexyl cinnamal", "isoeugenol", "alpha-isomethyl ionone",
        "amyl cinnamal", "amylcinnamyl alcohol", "anise alcohol", "benzyl cinnamate",
        "butylphenyl methylpropional", "evernia furfuracea", "evernia prunastri",
        "hydroxycitronellal", "hydroxyisohexyl 3-cyclohexene carboxaldehyde", "methyl 2-octynoate",
      ];
      const lowerIng = (ingredientsText || "").toLowerCase();
      const hits = eu26.filter((a) => lowerIng.includes(a));
      if (hits.length) base.allergenHighlights = hits;
    }

    return base;
  } catch {
    return null;
  }
}


function countEmptyNutrients(info: ProductFullInfo): number {
  const n = info.nutriments;
  if (!n) return 6;
  let empty = 0;
  if (n.energyKcal100g == null) empty++;
  if (n.fat100g == null) empty++;
  if (n.sugars100g == null) empty++;
  if (n.protein100g == null) empty++;
  if (n.fiber100g == null) empty++;
  if (n.salt100g == null) empty++;
  return empty;
}

async function fillFromUSDA(info: ProductFullInfo): Promise<ProductFullInfo> {
  try {
    const query = [info.productName, info.brand].filter(Boolean).join(" ");
    const { data, error } = await supabase.functions.invoke("usda-lookup", {
      body: { query, brandOwner: info.brand || undefined },
    });

    if (error || !data?.results?.length) return info;

    const best = data.results[0];
    const usda = best.nutrients;
    if (!usda) return info;

    const merged = { ...info };
    const n = { ...(merged.nutriments || {}) };
    let filled = false;

    if (n.energyKcal100g == null && usda.energyKcal100g != null) { n.energyKcal100g = usda.energyKcal100g; filled = true; }
    if (n.fat100g == null && usda.fat100g != null) { n.fat100g = usda.fat100g; filled = true; }
    if (n.saturatedFat100g == null && usda.saturatedFat100g != null) { n.saturatedFat100g = usda.saturatedFat100g; filled = true; }
    if (n.carbs100g == null && usda.carbs100g != null) { n.carbs100g = usda.carbs100g; filled = true; }
    if (n.sugars100g == null && usda.sugars100g != null) { n.sugars100g = usda.sugars100g; filled = true; }
    if (n.fiber100g == null && usda.fiber100g != null) { n.fiber100g = usda.fiber100g; filled = true; }
    if (n.protein100g == null && usda.protein100g != null) { n.protein100g = usda.protein100g; filled = true; }
    if (n.salt100g == null && usda.salt100g != null) { n.salt100g = usda.salt100g; filled = true; }

    if (filled) {
      merged.nutriments = n;
      merged.usdaFallback = true;
    }

    return merged;
  } catch {
    return info;
  }
}

/**
 * Generate an AI product image when none exists.
 * Returns a base64 data URL or null on failure.
 */
async function generateProductImage(productName: string, brand?: string): Promise<string | null> {
  try {
    const { data, error } = await supabase.functions.invoke("ai-product-insights", {
      body: {
        type: "product_image",
        productName,
        brandName: brand,
      },
    });
    if (error || !data?.result) return null;
    return data.result;
  } catch {
    return null;
  }
}

export async function fetchProductInfo(barcode: string): Promise<ProductFullInfo | null> {
  if (sessionCache.has(barcode)) {
    return sessionCache.get(barcode)!;
  }

  const encoded = encodeURIComponent(barcode);

  // Parallel lookup: Open Food Facts + Open Beauty Facts simultaneously
  const [offResult, obbResult] = await Promise.all([
    tryFetch(`https://world.openfoodfacts.org/api/v0/product/${encoded}.json`),
    tryFetch(`https://world.openbeautyfacts.org/api/v0/product/${encoded}.json`),
  ]);

  let info = offResult || obbResult;

  // If product found but has >3 empty nutrient fields, try USDA fallback
  if (info && countEmptyNutrients(info) > 3) {
    info = await fillFromUSDA(info);
  }

  // If product found but no image, generate one with AI
  if (info && !info.imageUrl) {
    const aiImage = await generateProductImage(info.productName, info.brand);
    if (aiImage) {
      info.imageUrl = aiImage;
      info.imageSmallUrl = aiImage;
      info.aiGeneratedImage = true;
    }
  }

  sessionCache.set(barcode, info);
  return info;
}
