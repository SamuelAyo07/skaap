// On-demand product info fetcher with session cache
// Only called when user taps the "Info" button — never on scan

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
  // New fields for Yuka-style result screen
  ecoscoreGrade?: string;
  ecoscoreScore?: number;
  categoriesTags?: string[];
  servingSize?: string;
}

const sessionCache = new Map<string, ProductFullInfo | null>();

async function tryFetch(url: string): Promise<ProductFullInfo | null> {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;

    const data = await res.json();
    if (data.status !== 1 || !data.product) return null;

    const p = data.product;
    const n = p.nutriments || {};
    const nl = p.nutrient_levels || {};

  return {
      productName: p.product_name || "Unknown Product",
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
      ingredientsText: p.ingredients_text_en || p.ingredients_text || undefined,
      allergensTags: p.allergens_tags?.length ? p.allergens_tags : undefined,
      additivesTags: p.additives_tags?.length ? p.additives_tags : undefined,
      labelsTags: p.labels_tags?.length ? p.labels_tags : undefined,
      ecoscoreGrade: p.ecoscore_grade || undefined,
      ecoscoreScore: p.ecoscore_score != null ? Number(p.ecoscore_score) : undefined,
      categoriesTags: p.categories_tags?.length ? p.categories_tags : undefined,
      servingSize: p.serving_size || undefined,
    };
  } catch {
    return null;
  }
}

/**
 * Count how many of the 6 key nutrient fields are missing/null.
 * If more than 3 are empty, we try USDA as a fallback.
 */
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

/**
 * Fill empty nutrient fields in the product info with USDA data.
 * Never overwrites existing Open Food Facts data.
 */
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

export async function fetchProductInfo(barcode: string): Promise<ProductFullInfo | null> {
  if (sessionCache.has(barcode)) {
    return sessionCache.get(barcode)!;
  }

  // Try Open Food Facts first, then Open Beauty Facts for cosmetics/skincare
  const encoded = encodeURIComponent(barcode);
  let info = await tryFetch(`https://world.openfoodfacts.org/api/v0/product/${encoded}.json`);
  if (!info) {
    info = await tryFetch(`https://world.openbeautyfacts.org/api/v0/product/${encoded}.json`);
  }

  // If product found but has >3 empty nutrient fields, try USDA fallback
  if (info && countEmptyNutrients(info) > 3) {
    info = await fillFromUSDA(info);
  }

  sessionCache.set(barcode, info);
  return info;
}
