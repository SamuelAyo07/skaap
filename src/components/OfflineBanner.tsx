import { WifiOff } from "lucide-react";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";

/**
 * Thin iOS-style "no connection" banner. Renders fixed under the status bar.
 * Cached scan history, last products, and nearby city stay visible thanks to
 * localStorage + Workbox runtime caching.
 */
export function OfflineBanner() {
  const online = useOnlineStatus();
  if (online) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed left-0 right-0 z-[9999] flex items-center justify-center gap-2 px-4 py-2 text-[13px] font-medium"
      style={{
        top: "env(safe-area-inset-top, 0px)",
        background: "rgba(20,20,22,0.88)",
        color: "#fff",
        backdropFilter: "saturate(180%) blur(20px)",
        WebkitBackdropFilter: "saturate(180%) blur(20px)",
        borderBottom: "0.5px solid rgba(255,255,255,0.12)",
        letterSpacing: -0.01,
      }}
    >
      <WifiOff size={14} strokeWidth={2.25} />
      <span>You're offline · showing your last saved scans</span>
    </div>
  );
}
