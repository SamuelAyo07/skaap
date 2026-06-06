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
  // Current SKAAP Plus pricing
  supporter: { price: "price_1TdtdGBJzpMoZjm49JkDL91g", mode: "subscription" }, // $4.99/mo
  champion:  { price: "price_1TdtdoBJzpMoZjm4tO8D2Rp3", mode: "subscription" }, // $39.99/yr
  // Legacy aliases — map to current pricing so old clients keep working
  member:    { price: "price_1TdtdoBJzpMoZjm4tO8D2Rp3", mode: "subscription" },
  builder:   { price: "price_1TdtdoBJzpMoZjm4tO8D2Rp3", mode: "subscription" },
  monthly:   { price: "price_1TdtdGBJzpMoZjm49JkDL91g", mode: "subscription" },
  annual:    { price: "price_1TdtdoBJzpMoZjm4tO8D2Rp3", mode: "subscription" },
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
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "not_authenticated", message: "Please sign in to upgrade." }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 },
      );
    }

    const token = authHeader.replace("Bearer ", "");
    const { data, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError || !data.user?.email) {
      return new Response(
        JSON.stringify({ error: "not_authenticated", message: "Your session expired. Please sign in again." }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 },
      );
    }
    const user = data.user;

    const body = await req.json().catch(() => ({}));
    const requested = (typeof body?.tier === "string" ? body.tier : body?.billing) as TierKey | undefined;

    if (!requested || !TIERS[requested]) {
      return new Response(
        JSON.stringify({ error: "invalid_tier", message: "Invalid plan selected. Please try again." }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 },
      );
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
          // 200 so the client receives `data` (supabase-js treats non-2xx as a thrown error and discards the body).
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 },
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

    console.log("[create-checkout] creating session", { tier: requested, email: user.email, customerId });
    const session = await stripe.checkout.sessions.create(sessionParams);
    console.log("[create-checkout] session created", { id: session.id });

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("[create-checkout] error:", message, error);
    return new Response(
      JSON.stringify({ error: "checkout_failed", message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 },
    );
  }
});
