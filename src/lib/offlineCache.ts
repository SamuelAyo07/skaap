/**
 * Tiny TTL-aware localStorage cache for fast offline rehydration of
 * scan history and nearby store lists. Survives connectivity loss
 * even when the service worker hasn't seen the request yet.
 */

type CacheEnvelope<T> = {
  v: 1;
  t: number; // saved at
  ttl: number; // ms
  d: T;
};

const PREFIX = "skaap_oc_";

export function cacheSet<T>(key: string, data: T, ttlMs = 1000 * 60 * 60 * 24 * 7): void {
  try {
    const env: CacheEnvelope<T> = { v: 1, t: Date.now(), ttl: ttlMs, d: data };
    localStorage.setItem(PREFIX + key, JSON.stringify(env));
  } catch {
    /* quota — silently drop */
  }
}

export function cacheGet<T>(key: string, opts?: { allowStale?: boolean }): T | null {
  try {
    const raw = localStorage.getItem(PREFIX + key);
    if (!raw) return null;
    const env = JSON.parse(raw) as CacheEnvelope<T>;
    if (!env || env.v !== 1) return null;
    const fresh = Date.now() - env.t < env.ttl;
    if (!fresh && !opts?.allowStale) return null;
    return env.d;
  } catch {
    return null;
  }
}

export function cacheAge(key: string): number | null {
  try {
    const raw = localStorage.getItem(PREFIX + key);
    if (!raw) return null;
    const env = JSON.parse(raw) as CacheEnvelope<unknown>;
    return Date.now() - env.t;
  } catch {
    return null;
  }
}

export function cacheDelete(key: string): void {
  try {
    localStorage.removeItem(PREFIX + key);
  } catch {
    /* ignore */
  }
}

/**
 * Wrap a network fetcher with an offline-first cache:
 * - Always returns cached data instantly when available (stale-while-revalidate).
 * - On network success, refreshes the cache.
 * - On network failure (offline / 4G hiccup), falls back to stale cache.
 */
export async function cachedFetch<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttlMs = 1000 * 60 * 60 * 24 * 7,
): Promise<{ data: T | null; fromCache: boolean; stale: boolean }> {
  const cached = cacheGet<T>(key);
  const stale = cacheGet<T>(key, { allowStale: true });

  try {
    const fresh = await fetcher();
    cacheSet(key, fresh, ttlMs);
    return { data: fresh, fromCache: false, stale: false };
  } catch (err) {
    if (cached) return { data: cached, fromCache: true, stale: false };
    if (stale) return { data: stale, fromCache: true, stale: true };
    throw err;
  }
}

// Stable keys used across the app
export const OfflineKeys = {
  scanHistory: (userId: string | "guest") => `scan_history:${userId}`,
  nearbyStores: (lat: number, lng: number) =>
    `nearby_stores:${lat.toFixed(2)}:${lng.toFixed(2)}`,
  lastProduct: (barcode: string) => `product:${barcode}`,
} as const;
