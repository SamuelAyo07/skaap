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
      case "product_image": {
        const { productName, brandName } = params;
        // Use image generation model
        const imgResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${LOVABLE_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "google/gemini-3.1-flash-image-preview",
            messages: [
              { role: "system", content: "You are a product photography AI. Generate a clean, professional product photo." },
              { role: "user", content: `Generate a realistic product photo of "${productName}"${brandName ? ` by ${brandName}` : ""}. Show the product on a clean white background, well-lit, studio-quality product photography style.` },
            ],
            modalities: ["image", "text"],
          }),
        });

        if (!imgResponse.ok) {
          throw new Error(`AI image gateway returned ${imgResponse.status}`);
        }

        const imgData = await imgResponse.json();
        const imageUrl = imgData.choices?.[0]?.message?.images?.[0]?.image_url?.url;
        if (!imageUrl) throw new Error("No image generated");

        return new Response(JSON.stringify({ result: imageUrl }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      case "image_recognition": {
        const { imageBase64 } = params;
        systemPrompt = "You are a food nutrition AI that identifies foods from photos. Return ONLY valid JSON, no other text.";
        userPrompt = `Identify this food item from the image and estimate its nutritional content per 100g. Return a JSON object:
{"name": "Food name", "category": "Fruit/Vegetable/Grain/etc", "calories_per_100g": 50, "protein_per_100g": 1.0, "fiber_per_100g": 2.5, "sugar_per_100g": 10.0, "fat_per_100g": 0.3, "health_tip": "One helpful tip about this food (max 20 words)", "score": 78, "emoji": "🍎"}
Score should be 0-100 based on nutritional value (high fiber/protein = good, high sugar/fat = bad). Be accurate with standard USDA nutritional data.`;
        break;
      }
      case "personalized-recs": {
        const { scanHistory, kitchenScore } = params;
        systemPrompt = `You are a personalized nutrition coach for the SKAAP food scanning app. You analyze a user's scan history to give actionable, warm, friendly advice. Never use words like "dangerous", "toxic", "terrible". Be encouraging and positive. Return ONLY valid JSON, no other text.`;
        userPrompt = `Based on this user's recent scan history and kitchen score of ${kitchenScore}/100, provide personalized food recommendations.

Recent scans (newest first):
${scanHistory}

Return a JSON object with this exact structure:
{
  "summary": "A warm 1-sentence overview of their eating habits (max 20 words)",
  "strengths": ["1 strength they have", "another strength"],
  "improvements": ["1 area to improve", "another area"],
  "swaps": [
    {"current": "Product they scanned", "suggestion": "Healthier alternative", "reason": "Why in 8 words max", "impact": "high"},
    {"current": "Another product", "suggestion": "Better option", "reason": "Short reason", "impact": "medium"}
  ],
  "weeklyTip": "A specific actionable tip for their next grocery trip (max 25 words)",
  "goalSuggestion": "A personal challenge like 'Try 3 Nutri-Score A products this week' (max 15 words)"
}

Provide 2-3 strengths, 2-3 improvements, and 3-5 swaps. Focus on swaps for their worst-scoring products. Set impact to "high" for ultra-processed/high-additive products, "medium" for moderate issues, "low" for minor tweaks.`;
        break;
      }
      default:
        return new Response(JSON.stringify({ error: "Unknown type" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }

    const model = type === "personalized-recs" || type === "image_recognition" ? "google/gemini-2.5-flash" : "google/gemini-2.5-flash-lite";

    // Build messages - for image recognition, include the image
    const messages: any[] = [{ role: "system", content: systemPrompt }];
    if (type === "image_recognition" && params.imageBase64) {
      messages.push({
        role: "user",
        content: [
          { type: "text", text: userPrompt },
          { type: "image_url", image_url: { url: params.imageBase64 } },
        ],
      });
    } else {
      messages.push({ role: "user", content: userPrompt });
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        messages,
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
