import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const USDA_API_KEY = Deno.env.get("USDA_API_KEY");
  if (!USDA_API_KEY) {
    return new Response(JSON.stringify({ error: "USDA_API_KEY not configured" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const { query, brandOwner } = await req.json();
    if (!query) {
      return new Response(JSON.stringify({ error: "query is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Build USDA FoodData Central search URL
    const params = new URLSearchParams({
      api_key: USDA_API_KEY,
      query,
      dataType: "Branded,Survey (FNDDS)",
      pageSize: "3",
    });
    if (brandOwner) {
      params.set("brandOwner", brandOwner);
    }

    const url = `https://api.nal.usda.gov/fdc/v1/foods/search?${params.toString()}`;
    const res = await fetch(url);
    if (!res.ok) {
      const errText = await res.text();
      return new Response(JSON.stringify({ error: `USDA API error: ${res.status}`, details: errText }), {
        status: res.status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await res.json();
    const foods = data.foods || [];

    // Extract and normalize nutrient data from the best match
    const results = foods.slice(0, 3).map((food: any) => {
      const nutrients: Record<string, number | undefined> = {};
      (food.foodNutrients || []).forEach((n: any) => {
        const id = n.nutrientId;
        const val = n.value;
        // Map USDA nutrient IDs to our field names
        if (id === 1008) nutrients.energyKcal100g = val;       // Energy (kcal)
        if (id === 1004) nutrients.fat100g = val;               // Total lipid (fat)
        if (id === 1258) nutrients.saturatedFat100g = val;      // Fatty acids, saturated
        if (id === 1005) nutrients.carbs100g = val;             // Carbohydrate
        if (id === 2000) nutrients.sugars100g = val;            // Sugars, total
        if (id === 1079) nutrients.fiber100g = val;             // Fiber, total dietary
        if (id === 1003) nutrients.protein100g = val;           // Protein
        if (id === 1093) nutrients.salt100g = val != null ? val * 2.5 / 1000 : undefined; // Sodium (mg) -> salt (g)
      });

      return {
        fdcId: food.fdcId,
        description: food.description,
        brandOwner: food.brandOwner || food.brandName,
        servingSize: food.servingSize,
        servingSizeUnit: food.servingSizeUnit,
        nutrients,
      };
    });

    return new Response(JSON.stringify({ results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
