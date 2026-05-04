import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

type Props = {
  barcode?: string;
  name: string;
  brand?: string;
  fallbackImage?: string; // Local imported asset (e.g., the curated PNGs)
  category?: "food" | "beauty" | "cosmetics";
  className?: string;
  alt?: string;
};

const CACHE_KEY = "skaap.productImageCache.v1";
const TTL_MS = 1000 * 60 * 60 * 24 * 14; // 14 days

type CacheEntry = { url: string; ts: number };

function readCache(): Record<string, CacheEntry> {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function writeCache(cache: Record<string, CacheEntry>) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
  } catch {
    /* quota exceeded — silently ignore */
  }
}

function cacheKey(barcode?: string, name?: string, brand?: string) {
  return (barcode || `${brand ?? ""}|${name ?? ""}`).toLowerCase();
}

/**
 * Always renders a clean product image. Resolution order:
 *   1. localStorage cache (14d TTL)
 *   2. Local fallback asset if it's a valid imported URL (instant render)
 *   3. Edge function: live OFF/OBF image, AI-generated fallback otherwise
 */
export function ProductImage({
  barcode,
  name,
  brand,
  fallbackImage,
  category = "food",
  className = "w-full h-full object-contain p-1.5",
  alt,
}: Props) {
  const [src, setSrc] = useState<string | undefined>(() => {
    const cache = readCache();
    const key = cacheKey(barcode, name, brand);
    const entry = cache[key];
    if (entry && Date.now() - entry.ts < TTL_MS) return entry.url;
    return fallbackImage;
  });
  const [resolved, setResolved] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const key = cacheKey(barcode, name, brand);
    const cache = readCache();
    const entry = cache[key];
    if (entry && Date.now() - entry.ts < TTL_MS) {
      setResolved(true);
      return;
    }

    (async () => {
      try {
        const { data, error } = await supabase.functions.invoke(
          "product-image-fallback",
          { body: { barcode, name, brand, category } }
        );
        if (cancelled) return;
        if (!error && data?.imageUrl) {
          setSrc(data.imageUrl);
          const next = readCache();
          next[key] = { url: data.imageUrl, ts: Date.now() };
          writeCache(next);
        }
      } catch {
        /* keep fallback */
      } finally {
        if (!cancelled) setResolved(true);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [barcode, name, brand, category]);

  return (
    <img
      src={src || "/placeholder.svg"}
      alt={alt || name}
      className={className}
      loading="lazy"
      onError={(e) => {
        (e.target as HTMLImageElement).src = fallbackImage || "/placeholder.svg";
      }}
      data-resolved={resolved}
    />
  );
}
