import { Product, NutritionInfo } from "@/data/products";

interface OpenFoodFactsResponse {
  status: number;
  product?: {
    product_name?: string;
    brands?: string;
    image_front_url?: string;
    image_url?: string;
    quantity?: string;
    code?: string;
    nutriscore_grade?: string;
    ingredients_text?: string;
    ingredients_text_en?: string;
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
  items?: Array<{
    price?: number;
  }>;
  total?: number;
}

function generateFallbackPrice(): number {
  return Math.round((Math.random() * 8 + 1.99) * 100) / 100;
}

async function fetchPrice(barcode: string): Promise<number> {
  try {
    const res = await fetch(
      `https://prices.openfoodfacts.org/api/v1/prices?product_code=${encodeURIComponent(barcode)}`
    );
    if (!res.ok) return generateFallbackPrice();
    const data: PriceResponse = await res.json();
    if (data.items && data.items.length > 0 && data.items[0].price != null) {
      return data.items[0].price;
    }
    return generateFallbackPrice();
  } catch {
    return generateFallbackPrice();
  }
}

export async function lookupBarcode(barcode: string): Promise<Product | null> {
  try {
    const [productRes, price] = await Promise.all([
      fetch(`https://world.openfoodfacts.org/api/v0/product/${encodeURIComponent(barcode)}.json`),
      fetchPrice(barcode),
    ]);

    if (!productRes.ok) return null;

    const data: OpenFoodFactsResponse = await productRes.json();
    if (data.status !== 1 || !data.product) return null;

    const p = data.product;
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
      id: barcode,
      name: p.product_name || "Unknown Product",
      brand: p.brands || undefined,
      weight: p.quantity || "",
      price,
      image: p.image_front_url || p.image_url || "/placeholder.svg",
      barcode,
      nutriScore: p.nutriscore_grade || undefined,
      ingredients: p.ingredients_text_en || p.ingredients_text || undefined,
      nutrition,
    };
  } catch {
    return null;
  }
}
