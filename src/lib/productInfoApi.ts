// On-demand product info fetcher with session cache
// Only called when user taps the "Info" button — never on scan

export interface ProductFullInfo {
  productName: string;
  brand?: string;
  imageUrl?: string;
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
}

const sessionCache = new Map<string, ProductFullInfo | null>();

export async function fetchProductInfo(barcode: string): Promise<ProductFullInfo | null> {
  if (sessionCache.has(barcode)) {
    return sessionCache.get(barcode)!;
  }

  try {
    const res = await fetch(
      `https://world.openfoodfacts.org/api/v0/product/${encodeURIComponent(barcode)}.json`
    );
    if (!res.ok) {
      sessionCache.set(barcode, null);
      return null;
    }

    const data = await res.json();
    if (data.status !== 1 || !data.product) {
      sessionCache.set(barcode, null);
      return null;
    }

    const p = data.product;
    const n = p.nutriments || {};
    const nl = p.nutrient_levels || {};

    const info: ProductFullInfo = {
      productName: p.product_name || "Unknown Product",
      brand: p.brands || undefined,
      imageUrl: p.image_front_url || p.image_url || undefined,
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
    };

    sessionCache.set(barcode, info);
    return info;
  } catch {
    sessionCache.set(barcode, null);
    return null;
  }
}
