import { Product } from "@/data/products";

interface OpenFoodFactsResponse {
  status: number;
  product?: {
    product_name?: string;
    brands?: string;
    image_front_url?: string;
    image_url?: string;
    quantity?: string;
    code?: string;
  };
}

export async function lookupBarcode(barcode: string): Promise<Product | null> {
  try {
    const res = await fetch(
      `https://world.openfoodfacts.org/api/v0/product/${encodeURIComponent(barcode)}.json`
    );
    if (!res.ok) return null;

    const data: OpenFoodFactsResponse = await res.json();
    if (data.status !== 1 || !data.product) return null;

    const p = data.product;
    return {
      id: barcode,
      name: [p.brands, p.product_name].filter(Boolean).join(" — ") || "Unknown Product",
      weight: p.quantity || "",
      price: 0,
      image: p.image_front_url || p.image_url || "/placeholder.svg",
      barcode,
    };
  } catch {
    return null;
  }
}
