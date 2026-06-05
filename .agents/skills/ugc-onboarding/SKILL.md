---
name: ugc-onboarding
description: End-to-end flow to onboard a Skaap UGC creator — grant lifetime SKAAP Plus, send the branded UGC welcome email, and trigger the in-app celebration toast. Trigger when the user asks to onboard, comp, gift, or grant lifetime access to a UGC creator, influencer, ambassador, or partner.
---

# UGC Creator Onboarding

Use this when the user says something like "onboard our UGC", "give X lifetime Plus", "comp this creator", or "send the UGC welcome".

## Required inputs
- **Full name** (for greeting)
- **Email address** (must already exist in `auth.users` — verify first)

## Steps (run in this order)

### 1. Verify the account exists
```sql
SELECT id, email FROM auth.users WHERE email = '<email>' LIMIT 1;
```
If no row, stop and tell the user the creator must sign up at https://useskaap.com first.

### 2. Grant lifetime SKAAP Plus
Insert into `user_subscriptions` via the insert tool (not migration):
```sql
INSERT INTO public.user_subscriptions (
  user_id, plan, status, current_period_end, stripe_customer_id, stripe_subscription_id
) VALUES (
  '<user_id>', 'plus', 'active', now() + interval '100 years', NULL, NULL
)
ON CONFLICT (user_id) DO UPDATE SET
  plan = 'plus',
  status = 'active',
  current_period_end = now() + interval '100 years';
```
No Stripe billing. `is_plus_user()` will return true immediately.

### 3. Send the branded welcome email
Template: `ugc-welcome` (lives at `supabase/functions/_shared/transactional-email-templates/ugc-welcome.tsx`, registered in `registry.ts`).

Invoke via:
```ts
await supabase.functions.invoke('send-transactional-email', {
  body: {
    templateName: 'ugc-welcome',
    recipientEmail: '<email>',
    idempotencyKey: `ugc-welcome-${slug(name)}-${YYYY-MM-DD}`,
    templateData: { name: '<first name>' },
  },
})
```
Or from the dashboard, call `supabase--curl_edge_functions` against `send-transactional-email` with the same body.

Verify it enqueued by checking `supabase--edge_function_logs` for `send-transactional-email` → look for `Transactional email enqueued { templateName: "ugc-welcome" }`.

### 4. In-app celebration (automatic)
The `celebratePlus()` helper in `src/context/SubscriptionContext.tsx` auto-fires a Sonner toast (`✦ Welcome to SKAAP Plus`) the first time the user's session detects `isPlus = true`. No action needed — the localStorage key `skaap_plus_welcomed_<userId>` guarantees it fires once.

### 5. Confirm to the user
Tell the requester:
- Account verified ✓
- Lifetime Plus active ✓
- Welcome email enqueued ✓
- In-app celebration will fire on next app open ✓

## Tone of the email
Warm, direct, gratitude-led. No upsell, no metrics, no marketing CTAs. Subject: `You're officially a Skaap creator — lifetime Plus unlocked ✦`. Reuse this template for every UGC creator — only `templateData.name` changes.

## Do NOT
- Create a new email template per creator — reuse `ugc-welcome`.
- Add the user to a marketing list.
- Charge them or create a Stripe customer.
- Skip the idempotency key (prevents duplicate sends on retry).
