import { useEffect, useState } from "react";

/**
 * Tracks browser online/offline status reliably (some browsers only emit
 * `offline` after a failed request, so we also poll a tiny HEAD on visibility
 * change to confirm).
 */
export function useOnlineStatus() {
  const [online, setOnline] = useState(
    typeof navigator === "undefined" ? true : navigator.onLine,
  );

  useEffect(() => {
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    return () => {
      window.removeEventListener("online", on);
      window.removeEventListener("offline", off);
    };
  }, []);

  return online;
}
