import { useState, useEffect, useRef } from "react";
import { fetchNearbyStores, NearbyStore } from "@/lib/nearbyStores";

const STORE_CACHE_KEY = "skaap_nearby_store";
const STORE_CACHE_TTL = 10 * 60 * 1000; // 10 min

interface CachedStore {
  store: NearbyStore;
  ts: number;
  lat: number;
  lng: number;
}

function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3;
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;
  const a = Math.sin(Δφ / 2) ** 2 + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function useNearbyStore() {
  const [currentStore, setCurrentStore] = useState<NearbyStore | null>(null);
  const [loading, setLoading] = useState(false);
  const fetchedRef = useRef(false);

  useEffect(() => {
    if (fetchedRef.current) return;
    fetchedRef.current = true;

    // Check cache first
    try {
      const raw = localStorage.getItem(STORE_CACHE_KEY);
      if (raw) {
        const cached: CachedStore = JSON.parse(raw);
        if (Date.now() - cached.ts < STORE_CACHE_TTL) {
          setCurrentStore(cached.store);
          return;
        }
      }
    } catch {}

    if (!navigator.geolocation) return;

    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const { latitude, longitude } = pos.coords;
          // Search within 200m — if you're inside a store, it'll be very close
          const stores = await fetchNearbyStores(latitude, longitude, 200, 5);
          if (stores.length > 0) {
            // Pick the closest one
            const sorted = stores
              .map((s) => ({ ...s, dist: haversineDistance(latitude, longitude, s.lat, s.lng) }))
              .sort((a, b) => a.dist - b.dist);
            const closest = sorted[0];
            // Only show if within ~150m (likely inside)
            if (closest.dist < 150) {
              setCurrentStore(closest);
              localStorage.setItem(
                STORE_CACHE_KEY,
                JSON.stringify({ store: closest, ts: Date.now(), lat: latitude, lng: longitude })
              );
            }
          }
        } catch {}
        setLoading(false);
      },
      () => setLoading(false),
      { enableHighAccuracy: true, timeout: 5000, maximumAge: 60000 }
    );
  }, []);

  return { currentStore, loading };
}
