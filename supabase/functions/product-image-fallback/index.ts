// Resolves a clean product image. Strategy:
// 1) Try Open Food Facts (then Open Beauty Facts) by barcode for the live front image.
// 2) If neither has one, generate a clean, on-white product photo via Lovable AI (Nano banana).
// Returns: { imageUrl: string, source: 'off' | 'obf' | 'ai' }
// Caches AI generations in-memory per cold start; client also caches in localStorage.

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const aiCache = new Map<string, string>();

async function fetchOFF(barcode: string, host: string): Promise<string | null> {
  try {
    const url = `https://${host}/api/v2/product/${encodeURIComponent(barcode)}.json?fields=image_front_small_url,image_front_url`;
    const r = await fetch(url, {
      headers: { "User-Agent": "skaap-image-resolver/1.0 (hello@useskaap.com)" },
    });
    if (!r.ok) return null;
    const j = await r.json();
    const p = j?.product;
    return p?.image_front_small_url || p?.image_front_url || null;
  } catch {
    return null;
  }
}

async function generateAIImage(name: string, brand?: string): Promise<string | null> {
  const cacheKey = `${brand ?? ""}|${name}`.toLowerCase();
  if (aiCache.has(cacheKey)) return aiCache.get(cacheKey)!;

  const apiKey = Deno.env.get("LOVABLE_API_KEY");
  if (!apiKey) return null;

  const prompt = `Clean product photo of "${brand ? brand + " " : ""}${name}" centered on a pure white background, soft studio lighting, no text overlay, no shadows, no people, packaging realistic and recognizable, square framing.`;

  try {
    const r = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-image",
        messages: [{ role: "user", content: prompt }],
        modalities: ["image", "text"],
      }),
    });
    if (!r.ok) {
      console.error("AI gateway error", r.status, await r.text());
      return null;
    }
    const data = await r.json();
    const imgUrl = data?.choices?.[0]?.message?.images?.[0]?.image_url?.url ?? null;
    if (imgUrl) aiCache.set(cacheKey, imgUrl);
    return imgUrl;
  } catch (e) {
    console.error("AI gen failed", e);
    return null;
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { barcode, name, brand, category } = await req.json();

    if (typeof name !== "string" || name.length === 0 || name.length > 200) {
      return new Response(JSON.stringify({ error: "name required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 1) OFF
    if (typeof barcode === "string" && /^[0-9]{6,14}$/.test(barcode)) {
      const isBeauty = category === "beauty" || category === "cosmetics";
      const hosts = isBeauty
        ? ["world.openbeautyfacts.org", "world.openfoodfacts.org"]
        : ["world.openfoodfacts.org", "world.openbeautyfacts.org"];

      for (const h of hosts) {
        const url = await fetchOFF(barcode, h);
        if (url) {
          return new Response(
            JSON.stringify({
              imageUrl: url,
              source: h.includes("beauty") ? "obf" : "off",
            }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
      }
    }

    // 2) AI fallback
    const ai = await generateAIImage(name, typeof brand === "string" ? brand : undefined);
    if (ai) {
      return new Response(JSON.stringify({ imageUrl: ai, source: "ai" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "no_image_available" }), {
      status: 404,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error(e);
    return new Response(JSON.stringify({ error: "internal_error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
