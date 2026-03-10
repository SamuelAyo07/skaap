import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { type, ...params } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    let systemPrompt = "";
    let userPrompt = "";

    switch (type) {
      case "summary": {
        const { productName, brandName, nutriScore, novaGroup, additiveCount, worstRisk, isOrganic, nutrientLevels } = params;
        systemPrompt = "You are a food nutrition expert writing for everyday shoppers. Return ONLY 2 short sentences. No preamble. No formatting.";
        userPrompt = `Write exactly 2 short sentences, maximum 20 words each, about this food product. Be factual and helpful. Never use the words dangerous, toxic, avoid, or bad. Use simple language a 12-year-old understands. Product: ${productName} by ${brandName}. Nutri-Score: ${nutriScore || "unknown"}. NOVA Group: ${novaGroup || "unknown"}. Number of additives: ${additiveCount}. Worst additive risk: ${worstRisk}. Is organic: ${isOrganic}. High nutrient concerns: ${nutrientLevels}. First sentence: what this product is nutritionally. Second sentence: the most important thing the shopper should know.`;
        break;
      }
      case "additive": {
        const { eNumber, additiveName, riskLevel, productName } = params;
        systemPrompt = "You are a food safety expert. Return ONLY 2 sentences. No preamble. No formatting.";
        userPrompt = `Explain this food additive in 2 sentences for everyday shoppers. Be calm and factual. Never say dangerous or toxic. Additive: ${eNumber} ${additiveName}. Risk level: ${riskLevel}. Found in: ${productName}. Return only the explanation. 2 sentences maximum.`;
        break;
      }
      case "dietary": {
        const { ingredientsText, allergensTags } = params;
        systemPrompt = "You are a dietary classification expert. You must return ONLY valid JSON, no other text.";
        userPrompt = `Classify these ingredients into dietary categories. Return a JSON object with confidence scores (0-1) for each category.

Ingredients: ${ingredientsText}
Known allergens: ${(allergensTags || []).join(", ")}

Return exactly this JSON format:
{"vegan": 0.0, "vegetarian": 0.0, "gluten_free": 0.0, "dairy_free": 0.0, "nut_free": 0.0}

Each value should be a confidence score between 0 and 1.`;
        break;
      }
      case "recommendations": {
        const { productName, nutriScore, category, additiveCount } = params;
        systemPrompt = "You are a nutrition advisor. Return ONLY valid JSON, no other text.";
        userPrompt = `Suggest 3 healthier alternatives to "${productName}" (Nutri-Score: ${nutriScore || "unknown"}, category: ${category || "food"}, additives: ${additiveCount}).

Return a JSON array of exactly 3 objects:
[{"name": "Product Name", "reason": "One sentence why it's better", "estimatedScore": "A or B"}]

Focus on widely available products with better nutritional profiles. Keep reasons under 12 words.`;
        break;
      }
      default:
        return new Response(JSON.stringify({ error: "Unknown type" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-lite",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        stream: false,
      }),
    });

    if (!response.ok) {
      const status = response.status;
      if (status === 429) {
        return new Response(JSON.stringify({ error: "Rate limited" }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (status === 402) {
        return new Response(JSON.stringify({ error: "Payment required" }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error(`AI gateway returned ${status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";

    return new Response(JSON.stringify({ result: content }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("ai-product-insights error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
