import { Product, NutritionInfo } from "@/data/products";

interface OpenFoodFactsResponse {
  status: number;
  product?: {
    product_name?: string;
    product_name_en?: string;
    generic_name?: string;
    generic_name_en?: string;
    brands?: string;
    brands_tags?: string[];
    image_front_url?: string;
    image_url?: string;
    quantity?: string;
    code?: string;
    nutriscore_grade?: string;
    ingredients_text?: string;
    ingredients_text_en?: string;
    allergens?: string;
    allergens_from_ingredients?: string;
    allergens_tags?: string[];
    nutriments?: {
      "energy-kcal_100g"?: number;
      fat_100g?: number;
      "saturated-fat_100g"?: number;
      carbohydrates_100g?: number;
      sugars_100g?: number;
      proteins_100g?: number;
      salt_100g?: number;
      fiber_100g?: number;
    };
  };
}

interface PriceResponse {
  items?: Array<{ price?: number }>;
  total?: number;
}

interface ProductLookupMatch {
  barcode: string;
  product: NonNullable<OpenFoodFactsResponse["product"]>;
}

const PRODUCT_CATALOGS = [
  "https://world.openfoodfacts.org",
  "https://world.openbeautyfacts.org",
] as const;

function generateFallbackPrice(seed: string): number {
  const hash = seed.split("").reduce((total, char) => (total * 31 + char.charCodeAt(0)) % 1000, 0);
  return Math.round((1.99 + (hash % 700) / 100) * 100) / 100;
}

function buildBarcodeCandidates(rawBarcode: string): string[] {
  const trimmed = rawBarcode.trim();
  const digitsOnly = trimmed.replace(/\D/g, "");
  const candidates = new Set<string>();

  if (trimmed) candidates.add(trimmed);
  if (digitsOnly) candidates.add(digitsOnly);
  if (digitsOnly.length === 12) candidates.add(`0${digitsOnly}`);
  if (digitsOnly.length === 13 && digitsOnly.startsWith("0")) candidates.add(digitsOnly.slice(1));

  return Array.from(candidates).filter(Boolean);
}

function parseAllergens(product: NonNullable<OpenFoodFactsResponse["product"]>): string[] | undefined {
  const fromTags = (product.allergens_tags || []).map((tag) =>
    tag.replace(/^\w+:/, "").replace(/_/g, " ").replace(/-/g, " ").trim()
  );

  const fromText = `${product.allergens_from_ingredients || ""},${product.allergens || ""}`
    .split(",")
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);

  const allergens = [...new Set([...fromTags, ...fromText])].filter(Boolean);
  return allergens.length ? allergens : undefined;
}

function getProductName(product: NonNullable<OpenFoodFactsResponse["product"]>): string {
  return (
    product.product_name || product.product_name_en ||
    product.generic_name_en || product.generic_name || "Unknown Product"
  );
}

function getBrandName(product: NonNullable<OpenFoodFactsResponse["product"]>): string | undefined {
  if (product.brands?.trim()) return product.brands;
  const firstBrandTag = product.brands_tags?.[0];
  if (!firstBrandTag) return undefined;
  return firstBrandTag.replace(/^\w+:/, "").replace(/-/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
}

async function fetchProductMatch(baseUrl: string, barcode: string): Promise<ProductLookupMatch | null> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    const response = await fetch(`${baseUrl}/api/v0/product/${encodeURIComponent(barcode)}.json`, { signal: controller.signal });
    clearTimeout(timeout);
    if (!response.ok) return null;

    const data: OpenFoodFactsResponse = await response.json();
    if (data.status !== 1 || !data.product) return null;

    return { barcode, product: data.product };
  } catch {
    return null;
  }
}

async function fetchPrice(barcode: string): Promise<number> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3000);
    const res = await fetch(
      `https://prices.openfoodfacts.org/api/v1/prices?product_code=${encodeURIComponent(barcode)}`,
      { signal: controller.signal }
    );
    clearTimeout(timeout);
    if (!res.ok) return generateFallbackPrice(barcode);

    const data: PriceResponse = await res.json();
    if (data.items && data.items.length > 0 && data.items[0].price != null) {
      return data.items[0].price;
    }
    return generateFallbackPrice(barcode);
  } catch {
    return generateFallbackPrice(barcode);
  }
}

export async function lookupBarcode(rawBarcode: string): Promise<Product | null> {
  try {
    const candidates = buildBarcodeCandidates(rawBarcode);

    // Try all candidates across all catalogs in parallel for speed
    const attempts = candidates.flatMap(candidate =>
      PRODUCT_CATALOGS.map(catalog => fetchProductMatch(catalog, candidate))
    );

    const results = await Promise.all(attempts);
    const match = results.find(r => r !== null) || null;

    if (!match) return null;

    const price = await fetchPrice(match.barcode);
    const p = match.product;
    const n = p.nutriments;

    const nutrition: NutritionInfo | undefined = n
      ? {
          calories: n["energy-kcal_100g"],
          fat: n.fat_100g,
          saturatedFat: n["saturated-fat_100g"],
          carbs: n.carbohydrates_100g,
          sugars: n.sugars_100g,
          protein: n.proteins_100g,
          salt: n.salt_100g,
          fiber: n.fiber_100g,
        }
      : undefined;

    return {
      id: match.barcode,
      name: getProductName(p),
      brand: getBrandName(p),
      weight: p.quantity || "",
      price,
      image: p.image_front_url || p.image_url || "/placeholder.svg",
      barcode: match.barcode,
      nutriScore: p.nutriscore_grade || undefined,
      ingredients: p.ingredients_text_en || p.ingredients_text || undefined,
      allergens: parseAllergens(p),
      nutrition,
    };
  } catch {
    return null;
  }
}
