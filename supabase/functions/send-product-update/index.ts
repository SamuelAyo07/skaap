// Admin-only edge function: blasts a product update email to every saved address.
// Auth: requires a valid JWT and that the caller's email matches ADMIN_EMAILS below.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const GATEWAY_URL = "https://connector-gateway.lovable.dev/resend";
const ADMIN_EMAILS = new Set(["oyedemisam@icloud.com", "oyedemisam@gmail.com"]);

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");
    if (!RESEND_API_KEY) throw new Error("RESEND_API_KEY not configured");

    // Verify caller
    const authHeader = req.headers.get("Authorization") ?? "";
    const token = authHeader.replace("Bearer ", "");
    if (!token) return json({ error: "Unauthorized" }, 401);

    const supaUser = createClient(SUPABASE_URL, SERVICE_ROLE);
    const { data: userData, error: userErr } = await supaUser.auth.getUser(token);
    if (userErr || !userData.user?.email || !ADMIN_EMAILS.has(userData.user.email)) {
      return json({ error: "Forbidden — admin only" }, 403);
    }

    const body = await req.json().catch(() => ({}));
    const subject = (body.subject ?? "").toString().trim();
    const html = (body.html ?? "").toString().trim();
    const dryRun = Boolean(body.dryRun);
    const testTo = typeof body.testTo === "string" ? body.testTo.trim() : "";
    if (!subject || !html) return json({ error: "subject and html are required" }, 400);

    // Collect recipients
    let recipients: string[] = [];
    if (testTo) {
      recipients = [testTo];
    } else {
      const { data: profiles } = await supaUser
        .from("profiles")
        .select("email")
        .not("email", "is", null);
      const { data: contacts } = await supaUser
        .from("contact_submissions")
        .select("email")
        .not("email", "is", null);
      const set = new Set<string>();
      for (const r of [...(profiles ?? []), ...(contacts ?? [])]) {
        const e = (r.email ?? "").toString().trim().toLowerCase();
        if (!e || e.includes("privaterelay.appleid.com")) continue;
        set.add(e);
      }
      recipients = Array.from(set);
    }

    if (dryRun) return json({ ok: true, dryRun: true, recipients, count: recipients.length });

    const wrappedHtml = `<!doctype html><html><body style="margin:0;padding:0;background:#F7F7F7;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#1B2A4A">
      <table width="100%" cellpadding="0" cellspacing="0" style="background:#F7F7F7;padding:32px 16px"><tr><td align="center">
        <table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,.06)">
          <tr><td style="padding:24px 32px;border-bottom:1px solid #F3F4F6">
            <div style="font-size:18px;font-weight:800;color:#C41E3A">SKAAP</div>
            <div style="font-size:11px;color:#9CA3AF;margin-top:2px">Know what's in your food</div>
          </td></tr>
          <tr><td style="padding:32px">${html}</td></tr>
          <tr><td style="padding:20px 32px;background:#FAFAFA;font-size:11px;color:#9CA3AF;text-align:center">
            You're receiving this because you signed up at useskaap.com ·
            <a href="https://useskaap.com" style="color:#C41E3A;text-decoration:none">useskaap.com</a>
          </td></tr>
        </table>
      </td></tr></table></body></html>`;

    // Send in parallel with small batch limit
    const results: Array<{ to: string; ok: boolean; error?: string }> = [];
    const send = async (to: string) => {
      try {
        const res = await fetch(`${GATEWAY_URL}/emails`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${LOVABLE_API_KEY}`,
            "X-Connection-Api-Key": RESEND_API_KEY,
          },
          body: JSON.stringify({
            from: "SKAAP <onboarding@resend.dev>",
            to: [to],
            subject,
            html: wrappedHtml,
          }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) results.push({ to, ok: false, error: JSON.stringify(data) });
        else results.push({ to, ok: true });
      } catch (e) {
        results.push({ to, ok: false, error: e instanceof Error ? e.message : "unknown" });
      }
    };
    // simple chunked parallelism
    const chunk = 5;
    for (let i = 0; i < recipients.length; i += chunk) {
      await Promise.all(recipients.slice(i, i + chunk).map(send));
    }

    const sent = results.filter(r => r.ok).length;
    return json({ ok: true, sent, total: recipients.length, results });
  } catch (e) {
    console.error("send-product-update error:", e);
    return json({ error: e instanceof Error ? e.message : "Unknown error" }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
