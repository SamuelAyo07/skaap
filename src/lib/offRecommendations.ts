// Healthier Alternatives via Open Food Facts category search
// Finds products in the same category with a better Nutri-Score

export interface OFFRecommendation {
  barcode: string;
  productName: string;
  brand?: string;
  imageSmallUrl?: string;
  nutriScoreGrade: string;
  skaapScoreEstimate: number;
}

const NUTRI_SCORE_ORDER = ["a", "b", "c", "d", "e"];

function nutriScoreRank(grade?: string): number {
  if (!grade) return 5;
  return NUTRI_SCORE_ORDER.indexOf(grade.toLowerCase());
}

function estimateScore(grade: string): number {
  switch (grade.toLowerCase()) {
    case "a": return 88;
    case "b": return 72;
    case "c": return 55;
    case "d": return 35;
    case "e": return 18;
    default: return 50;
  }
}

const recCache = new Map<string, OFFRecommendation[]>();

export async function fetchHealthierAlternatives(
  categoriesTags: string[] | undefined,
  currentNutriScore: string | undefined,
  currentBarcode: string,
): Promise<OFFRecommendation[]> {
  if (!categoriesTags?.length) return [];
  
  const cacheKey = currentBarcode;
  if (recCache.has(cacheKey)) return recCache.get(cacheKey)!;

  const currentRank = nutriScoreRank(currentNutriScore);
  // If already "a", no better alternatives
  if (currentRank === 0) return [];

  // Use the most specific category (last tag) for better results
  const category = categoriesTags[categoriesTags.length - 1];
  const encoded = encodeURIComponent(category);

  try {
    const res = await fetch(
      `https://world.openfoodfacts.org/cgi/search.pl?action=process&tagtype_0=categories&tag_contains_0=contains&tag_0=${encoded}&sort_by=nutriscore_score&page_size=20&json=1&fields=code,product_name,brands,image_front_small_url,nutriscore_grade`
    );
    if (!res.ok) return [];

    const data = await res.json();
    const products = data.products || [];

    const results: OFFRecommendation[] = [];
    for (const p of products) {
      if (!p.product_name || !p.nutriscore_grade) continue;
      if (p.code === currentBarcode) continue;
      const rank = nutriScoreRank(p.nutriscore_grade);
      if (rank >= currentRank) continue; // Must be strictly better

      results.push({
        barcode: p.code,
        productName: p.product_name,
        brand: p.brands || undefined,
        imageSmallUrl: p.image_front_small_url || undefined,
        nutriScoreGrade: p.nutriscore_grade,
        skaapScoreEstimate: estimateScore(p.nutriscore_grade),
      });

      if (results.length >= 3) break;
    }

    recCache.set(cacheKey, results);
    return results;
  } catch {
    return [];
  }
}
