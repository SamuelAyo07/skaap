import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Lightweight in-memory IP rate limit (per cold start)
const ipHits = new Map<string, { count: number; reset: number }>();
function checkRate(ip: string, limit = 30, windowMs = 60_000): boolean {
  const now = Date.now();
  const e = ipHits.get(ip);
  if (!e || now > e.reset) {
    ipHits.set(ip, { count: 1, reset: now + windowMs });
    return true;
  }
  if (e.count >= limit) return false;
  e.count++;
  return true;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() || "unknown";
  if (!checkRate(ip)) {
    return new Response(JSON.stringify({ error: "Rate limited" }), {
      status: 429,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Require authenticated user (prevents anonymous quota abuse)
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
  );
  const token = authHeader.replace("Bearer ", "");
  const { data: claims, error: authErr } = await supabase.auth.getClaims(token);
  if (authErr || !claims?.claims?.sub) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
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
    if (!query || typeof query !== "string" || query.length > 200) {
      return new Response(JSON.stringify({ error: "valid query is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const params = new URLSearchParams({
      api_key: USDA_API_KEY,
      query,
      dataType: "Branded,Survey (FNDDS)",
      pageSize: "3",
    });
    if (brandOwner && typeof brandOwner === "string") {
      params.set("brandOwner", brandOwner.slice(0, 100));
    }

    const url = `https://api.nal.usda.gov/fdc/v1/foods/search?${params.toString()}`;
    const res = await fetch(url);
    if (!res.ok) {
      return new Response(JSON.stringify({ error: `USDA API error: ${res.status}` }), {
        status: res.status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await res.json();
    const foods = data.foods || [];

    const results = foods.slice(0, 3).map((food: any) => {
      const nutrients: Record<string, number | undefined> = {};
      (food.foodNutrients || []).forEach((n: any) => {
        const id = n.nutrientId;
        const val = n.value;
        if (id === 1008) nutrients.energyKcal100g = val;
        if (id === 1004) nutrients.fat100g = val;
        if (id === 1258) nutrients.saturatedFat100g = val;
        if (id === 1005) nutrients.carbs100g = val;
        if (id === 2000) nutrients.sugars100g = val;
        if (id === 1079) nutrients.fiber100g = val;
        if (id === 1003) nutrients.protein100g = val;
        if (id === 1093) nutrients.salt100g = val != null ? val * 2.5 / 1000 : undefined;
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
    console.error("usda-lookup error:", error);
    return new Response(JSON.stringify({ error: "Lookup failed. Please try again." }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
