/**
 * Guarded service-worker registration.
 *
 * Per Lovable PWA skill:
 * - Never register in dev, Lovable preview, or inside an iframe.
 * - Support `?sw=off` kill switch.
 * - Unregister any stale `/sw.js` in refused contexts.
 */
export async function registerSkaapSW(): Promise<void> {
  if (typeof window === "undefined") return;
  if (!("serviceWorker" in navigator)) return;

  const url = new URL(window.location.href);
  const host = window.location.hostname;
  const inIframe = window.self !== window.top;
  const killSwitch = url.searchParams.get("sw") === "off";
  const isPreview =
    host.startsWith("id-preview--") ||
    host.startsWith("preview--") ||
    host === "lovableproject.com" ||
    host.endsWith(".lovableproject.com") ||
    host === "lovableproject-dev.com" ||
    host.endsWith(".lovableproject-dev.com") ||
    host === "beta.lovable.dev" ||
    host.endsWith(".beta.lovable.dev");

  if (!import.meta.env.PROD || inIframe || isPreview || killSwitch) {
    // Refuse — and tear down any stale registration so old cached HTML stops serving.
    try {
      const regs = await navigator.serviceWorker.getRegistrations();
      await Promise.allSettled(
        regs
          .filter((r) => (r.active?.scriptURL || "").endsWith("/sw.js"))
          .map((r) => r.unregister()),
      );
    } catch {
      /* ignore */
    }
    return;
  }

  try {
    const { registerSW } = await import("virtual:pwa-register");
    registerSW({
      immediate: true,
      onRegisteredSW(swUrl, reg) {
        // Hourly update check so users get fixes without a hard reload.
        if (reg) {
          setInterval(() => reg.update().catch(() => {}), 60 * 60 * 1000);
        }
      },
    });
  } catch {
    /* ignore */
  }
}
