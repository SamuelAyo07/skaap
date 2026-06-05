// Open Beauty Facts → cosmetics_catalog sync
// Pages through OBF search API and upserts into public.cosmetics_catalog.
// Trigger: POST with { pages?: number, pageSize?: number, startPage?: number }
// Default: 20 pages × 100 items = 2,000 products per invocation.
// Call repeatedly (or via cron) to grow the catalog toward 10k–100k items.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

interface OBFProduct {
  code?: string;
  product_name?: string;
  product_name_en?: string;
  brands?: string;
  image_front_url?: string;
  image_url?: string;
  ingredients_text_en?: string;
  ingredients_text?: string;
  allergens_tags?: string[];
  categories_tags?: string[];
  quantity?: string;
  periods_after_opening?: string;
  packaging?: string;
  generic_name?: string;
}

const EU26 = [
  "limonene","linalool","citronellol","geraniol","citral","eugenol","coumarin",
  "farnesol","benzyl alcohol","benzyl benzoate","benzyl salicylate","cinnamal",
  "cinnamyl alcohol","hexyl cinnamal","isoeugenol","alpha-isomethyl ionone",
  "amyl cinnamal","amylcinnamyl alcohol","anise alcohol","benzyl cinnamate",
  "butylphenyl methylpropional","evernia furfuracea","evernia prunastri",
  "hydroxycitronellal","hydroxyisohexyl 3-cyclohexene carboxaldehyde","methyl 2-octynoate",
];

const FORMS = ["cream","lotion","balm","serum","oil","spray","gel","stick",
  "mask","foam","mist","powder","shampoo","conditioner","soap"];

const SKIN = ["sensitive","dry","oily","combination","normal","mature","acne"];

function enrich(p: OBFProduct) {
  const ingredientsText = p.ingredients_text_en || p.ingredients_text || "";
  const inci = ingredientsText
    ? ingredientsText.split(/[,•·]/)
        .map((s) => s.replace(/[\[\]().*]/g, "").trim())
        .filter((s) => s.length > 1 && s.length < 80).slice(0, 60)
    : null;

  const haystack = [
    ...(p.categories_tags || []), p.product_name || "", p.generic_name || "",
  ].join(" ").toLowerCase();

  let form: string | null = null;
  for (const f of FORMS) if (haystack.includes(f)) { form = f; break; }

  const spfMatch = haystack.match(/spf\s*(\d{1,3})/i);
  const spf = spfMatch ? Math.min(100, parseInt(spfMatch[1], 10)) : null;

  const skin = SKIN.filter((s) => haystack.includes(s));
  if (haystack.includes("all skin") || haystack.includes("tous types")) skin.push("all");

  const lowerIng = ingredientsText.toLowerCase();
  const allergens = EU26.filter((a) => lowerIng.includes(a));

  return {
    barcode: p.code,
    product_name: (p.product_name || p.product_name_en || "").slice(0, 300) || null,
    brand: p.brands?.split(",")[0]?.trim() || null,
    image_url: p.image_front_url || p.image_url || null,
    ingredients_text: ingredientsText || null,
    inci_list: inci,
    allergens: p.allergens_tags?.length ? p.allergens_tags : null,
    allergen_highlights: allergens.length ? allergens : null,
    cosmetic_form: form,
    skin_type: skin.length ? Array.from(new Set(skin)) : null,
    spf,
    size: p.quantity || null,
    categories: p.categories_tags?.length ? p.categories_tags.slice(0, 20) : null,
    periods_after_opening: p.periods_after_opening || null,
    packaging: p.packaging || null,
    source: "open_beauty_facts",
    last_synced_at: new Date().toISOString(),
  };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const body = req.method === "POST" ? await req.json().catch(() => ({})) : {};
    const pages = Math.min(Math.max(Number(body.pages) || 20, 1), 100);
    const pageSize = Math.min(Math.max(Number(body.pageSize) || 100, 10), 200);
    const startPage = Math.max(Number(body.startPage) || 1, 1);

    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE);
    let totalUpserted = 0;
    let totalSkipped = 0;

    for (let i = 0; i < pages; i++) {
      const page = startPage + i;
      const url = `https://world.openbeautyfacts.org/cgi/search.pl?action=process&json=1&page_size=${pageSize}&page=${page}&fields=code,product_name,product_name_en,brands,image_front_url,image_url,ingredients_text,ingredients_text_en,allergens_tags,categories_tags,quantity,periods_after_opening,packaging,generic_name`;

      const res = await fetch(url, {
        headers: { "User-Agent": "Skaap/1.0 (cosmetics catalog sync)" },
      });
      if (!res.ok) {
        console.error(`OBF page ${page} failed:`, res.status);
        continue;
      }
      const data = await res.json();
      const products: OBFProduct[] = data.products || [];

      const rows = products
        .map(enrich)
        .filter((r) => r.barcode && r.product_name);

      totalSkipped += products.length - rows.length;
      if (rows.length === 0) continue;

      const { error } = await supabase
        .from("cosmetics_catalog")
        .upsert(rows, { onConflict: "barcode", ignoreDuplicates: false });

      if (error) {
        console.error(`Upsert page ${page} failed:`, error.message);
      } else {
        totalUpserted += rows.length;
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        pages, pageSize, startPage,
        upserted: totalUpserted,
        skipped: totalSkipped,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    console.error("sync-cosmetics-catalog error:", e);
    return new Response(
      JSON.stringify({ success: false, error: (e as Error).message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
