import { supabase } from "@/integrations/supabase/client";

let sessionId: string | null = null;

function getSessionId(): string {
  if (!sessionId) {
    sessionId = sessionStorage.getItem("skaap_session") || crypto.randomUUID();
    sessionStorage.setItem("skaap_session", sessionId);
  }
  return sessionId;
}

export type AnalyticsEvent =
  | "page_view"
  | "scan_started"
  | "scan_success"
  | "scan_failed"
  | "product_info_viewed"
  | "add_to_cart"
  | "remove_from_cart"
  | "checkout_started"
  | "order_completed"
  | "store_selected"
  | "location_granted"
  | "location_denied"
  | "demo_mode_used"
  | "cta_clicked";

export async function trackEvent(
  eventType: AnalyticsEvent,
  eventData: Record<string, any> = {},
  page?: string
) {
  try {
    await (supabase as any).from("analytics_events").insert({
      session_id: getSessionId(),
      event_type: eventType,
      event_data: eventData,
      page: page || window.location.pathname + window.location.search,
      user_agent: navigator.userAgent,
      screen_width: window.innerWidth,
    });
  } catch {
    // Silent fail, analytics should never break the app
  }
}
