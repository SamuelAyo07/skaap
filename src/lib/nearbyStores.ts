export interface NearbyStore {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
}

/**
 * Fetches real grocery/supermarket stores near a given location
 * using the OpenStreetMap Overpass API. Works worldwide, no API key needed.
 */
export async function fetchNearbyStores(
  lat: number,
  lng: number,
  radiusMeters = 3000,
  limit = 15
): Promise<NearbyStore[]> {
  // Overpass QL query: supermarkets, grocery stores, convenience stores
  const query = `
    [out:json][timeout:10];
    (
      node["shop"~"supermarket|grocery|convenience|greengrocer|deli|general"](around:${radiusMeters},${lat},${lng});
      way["shop"~"supermarket|grocery|convenience|greengrocer|deli|general"](around:${radiusMeters},${lat},${lng});
    );
    out center ${limit};
  `;

  const res = await fetch("https://overpass-api.de/api/interpreter", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: `data=${encodeURIComponent(query)}`,
  });

  if (!res.ok) throw new Error("Overpass API request failed");

  const data = await res.json();

  return (data.elements || [])
    .map((el: any) => {
      const storeLat = el.lat ?? el.center?.lat;
      const storeLng = el.lon ?? el.center?.lon;
      const tags = el.tags || {};
      const name = tags.name || tags.brand || "Grocery Store";
      const address = [tags["addr:housenumber"], tags["addr:street"], tags["addr:city"]]
        .filter(Boolean)
        .join(" ") || tags["addr:full"] || "";

      if (!storeLat || !storeLng) return null;

      return {
        id: String(el.id),
        name,
        lat: storeLat,
        lng: storeLng,
        address,
      } as NearbyStore;
    })
    .filter(Boolean) as NearbyStore[];
}
