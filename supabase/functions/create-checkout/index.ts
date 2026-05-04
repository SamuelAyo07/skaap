import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// 4 supporter tiers
type TierKey = "supporter" | "member" | "champion" | "builder" | "monthly" | "annual";

const TIERS: Record<TierKey, { price: string; mode: "subscription" | "payment" }> = {
  // New 4-tier structure
  supporter: { price: "price_1TQD12BJzpMoZjm4heo7GrL8", mode: "subscription" }, // $2.99/mo
  member:    { price: "price_1TQD1XBJzpMoZjm4Zh9GHBkN", mode: "payment" },      // $10/yr one-time
  champion:  { price: "price_1TQD1tBJzpMoZjm43jRsOxee", mode: "payment" },      // $20/yr one-time
  builder:   { price: "price_1TQD2JBJzpMoZjm4hkQIGFhW", mode: "payment" },      // $49/yr one-time
  // Legacy aliases (kept so old clients still work)
  monthly:   { price: "price_1TAWbrBJzpMoZjm46lHSgk3R", mode: "subscription" },
  annual:    { price: "price_1TAWcHBJzpMoZjm4wSgXzi0n", mode: "subscription" },
};

const ALLOWED_ORIGINS = [
  "https://skaap.lovable.app",
  "https://useskaap.com",
  "https://www.useskaap.com",
];

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 405,
    });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_ANON_KEY") ?? ""
  );

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header");

    const token = authHeader.replace("Bearer ", "");
    const { data, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(userError.message);
    const user = data.user;
    if (!user?.email) throw new Error("User not authenticated");

    const body = await req.json();
    // Accept either { tier } (new) or { billing } (legacy)
    const requested = (typeof body?.tier === "string" ? body.tier : body?.billing) as TierKey | undefined;

    if (!requested || !TIERS[requested]) {
      return new Response(JSON.stringify({ error: "Invalid tier. Use one of: supporter, member, champion, builder." }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    const tier = TIERS[requested];

    const origin = req.headers.get("origin") || "";
    const safeOrigin = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2025-08-27.basil",
    });

    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    const customerId = customers.data.length > 0 ? customers.data[0].id : undefined;

    // Enforce one active subscription per email/account.
    // If this customer already has an active or trialing subscription, send them
    // to the billing portal instead of letting them stack a second subscription.
    if (customerId) {
      const existingSubs = await stripe.subscriptions.list({
        customer: customerId,
        status: "all",
        limit: 10,
      });
      const hasActive = existingSubs.data.some(
        (s) => s.status === "active" || s.status === "trialing" || s.status === "past_due",
      );
      if (hasActive) {
        return new Response(
          JSON.stringify({
            error: "already_subscribed",
            message:
              "This email already has an active SKAAP subscription. Manage it from your account instead of creating a new one.",
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 409 },
        );
      }
    }

    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      customer: customerId,
      customer_email: customerId ? undefined : user.email,
      line_items: [{ price: tier.price, quantity: 1 }],
      mode: tier.mode,
      allow_promotion_codes: true,
      success_url: `${safeOrigin}/scan?upgraded=true&tier=${requested}`,
      cancel_url: `${safeOrigin}/scan`,
      metadata: { tier: requested, user_id: user.id },
    };

    if (tier.mode === "subscription") {
      sessionParams.subscription_data = { trial_period_days: 7, metadata: { tier: requested, user_id: user.id } };
    }

    const session = await stripe.checkout.sessions.create(sessionParams);

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
