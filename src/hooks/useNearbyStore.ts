import { useState, useEffect, useRef } from "react";

const CITY_CACHE_KEY = "skaap_nearby_city";
const CITY_CACHE_TTL = 30 * 60 * 1000; // 30 min

interface CachedCity {
  city: string;
  ts: number;
}

/**
 * Returns the user's current city name via reverse geocoding.
 * No store names — just the city for context.
 */
export function useNearbyStore() {
  const [currentCity, setCurrentCity] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const fetchedRef = useRef(false);

  useEffect(() => {
    if (fetchedRef.current) return;
    fetchedRef.current = true;

    // Check cache first
    try {
      const raw = localStorage.getItem(CITY_CACHE_KEY);
      if (raw) {
        const cached: CachedCity = JSON.parse(raw);
        if (Date.now() - cached.ts < CITY_CACHE_TTL) {
          setCurrentCity(cached.city);
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
          // Reverse geocode to get city name only
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&zoom=10&addressdetails=1`,
            { headers: { "User-Agent": "SKAAP/1.0" } }
          );
          if (res.ok) {
            const data = await res.json();
            const addr = data.address || {};
            const city = addr.city || addr.town || addr.village || addr.municipality || addr.county || "";
            if (city) {
              setCurrentCity(city);
              localStorage.setItem(CITY_CACHE_KEY, JSON.stringify({ city, ts: Date.now() }));
            }
          }
        } catch {}
        setLoading(false);
      },
      () => setLoading(false),
      { enableHighAccuracy: false, timeout: 5000, maximumAge: 300000 }
    );
  }, []);

  return { currentCity, loading };
}
