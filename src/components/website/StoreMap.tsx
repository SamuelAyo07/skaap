import { useMemo, useState } from "react";
import { MapPin } from "lucide-react";

interface StoreLocation {
  name: string;
  chain: string;
  address: string;
  lat: number;
  lng: number;
}

const eastCoastStores: StoreLocation[] = [
  { name: "Whole Foods Market - Columbus Circle", chain: "Whole Foods", address: "10 Columbus Cir, New York, NY 10019", lat: 40.7687, lng: -73.9833 },
  { name: "Trader Joe's - Union Square", chain: "Trader Joe's", address: "142 E 14th St, New York, NY 10003", lat: 40.7338, lng: -73.9882 },
  { name: "Kroger - Midtown East", chain: "Kroger", address: "1095 6th Ave, New York, NY 10036", lat: 40.7544, lng: -73.9835 },
  { name: "Publix - Brickell", chain: "Publix", address: "1776 Brickell Ave, Miami, FL 33129", lat: 25.7572, lng: -80.1918 },
  { name: "Publix - South Beach", chain: "Publix", address: "1920 Bay Rd, Miami Beach, FL 33139", lat: 25.7927, lng: -80.1389 },
  { name: "Whole Foods Market - North Miami", chain: "Whole Foods", address: "12150 Biscayne Blvd, North Miami, FL 33181", lat: 25.8914, lng: -80.1627 },
  { name: "Trader Joe's - Back Bay", chain: "Trader Joe's", address: "899 Boylston St, Boston, MA 02115", lat: 42.3487, lng: -71.0838 },
  { name: "Whole Foods Market - Cambridge", chain: "Whole Foods", address: "340 River St, Cambridge, MA 02139", lat: 42.3646, lng: -71.1047 },
  { name: "Whole Foods Market - Georgetown", chain: "Whole Foods", address: "2323 Wisconsin Ave NW, Washington, DC 20007", lat: 38.9219, lng: -77.0707 },
  { name: "Trader Joe's - Capitol Hill", chain: "Trader Joe's", address: "1101 Pennsylvania Ave SE, Washington, DC 20003", lat: 38.882, lng: -76.9908 },
  { name: "Publix - Midtown Atlanta", chain: "Publix", address: "595 Piedmont Ave NE, Atlanta, GA 30308", lat: 33.7716, lng: -84.382 },
  { name: "Kroger - Buckhead", chain: "Kroger", address: "3330 Piedmont Rd NE, Atlanta, GA 30305", lat: 33.8441, lng: -84.3752 },
  { name: "Publix - Uptown Charlotte", chain: "Publix", address: "130 E Stonewall St, Charlotte, NC 28202", lat: 35.2203, lng: -80.8427 },
  { name: "Whole Foods Market - Center City", chain: "Whole Foods", address: "2101 Pennsylvania Ave, Philadelphia, PA 19130", lat: 39.9579, lng: -75.173 },
  { name: "Trader Joe's - Ardmore", chain: "Trader Joe's", address: "112 Coulter Ave, Ardmore, PA 19003", lat: 40.0078, lng: -75.2911 },
];

const StoreMap = () => {
  const [selectedStore, setSelectedStore] = useState<StoreLocation | null>(null);
  const [center, setCenter] = useState<{ lat: number; lng: number }>({ lat: 39.5, lng: -77.0 });
  const [zip, setZip] = useState("");
  const [activeChain, setActiveChain] = useState<string | null>(null);

  const chains = useMemo(() => Array.from(new Set(eastCoastStores.map((s) => s.chain))), []);

  const filteredStores = useMemo(() => {
    if (!activeChain) return eastCoastStores;
    return eastCoastStores.filter((s) => s.chain === activeChain);
  }, [activeChain]);

  const mapSrc = useMemo(() => {
    const q = selectedStore
      ? encodeURIComponent(selectedStore.address)
      : `${center.lat},${center.lng}`;
    return `https://www.google.com/maps/embed?pb=!1m14!1m12!1m3!1d50000!2d${center.lng}!3d${center.lat}!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!5e0!3m2!1sen!2sus&q=${q}`;
  }, [center, selectedStore]);

  const zipMap: Record<string, { lat: number; lng: number }> = {
    "10": { lat: 40.758, lng: -73.9855 },
    "33": { lat: 25.7617, lng: -80.1918 },
    "02": { lat: 42.3601, lng: -71.0589 },
    "20": { lat: 38.9072, lng: -77.0369 },
    "30": { lat: 33.749, lng: -84.388 },
    "28": { lat: 35.2271, lng: -80.8431 },
    "19": { lat: 39.9526, lng: -75.1652 },
  };

  const handleSearch = () => {
    const prefix = zip.trim().substring(0, 2);
    const location = zipMap[prefix];
    if (location) {
      setCenter(location);
      setSelectedStore(null);
    }
  };

  const handleChainFilter = (chain: string) => {
    setActiveChain(activeChain === chain ? null : chain);
    setSelectedStore(null);
  };

  return (
    <div className="bg-card rounded-3xl shadow-elevated overflow-hidden border border-border">
      <div className="relative h-[400px] bg-muted/30">
        <iframe
          key={mapSrc}
          title="Store map"
          src={mapSrc}
          loading="lazy"
          allowFullScreen
          referrerPolicy="no-referrer-when-downgrade"
          className="h-full w-full border-0"
          style={{ borderRadius: "1.5rem 1.5rem 0 0" }}
        />

        {selectedStore && (
          <div className="absolute bottom-4 left-4 right-4 bg-background/95 backdrop-blur-sm rounded-2xl p-4 shadow-elevated z-10">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-primary font-semibold uppercase">{selectedStore.chain}</p>
                <h4 className="font-bold text-sm text-foreground">{selectedStore.name}</h4>
                <p className="text-xs text-muted-foreground mt-0.5">{selectedStore.address}</p>
              </div>
              <button onClick={() => setSelectedStore(null)} className="text-muted-foreground text-xs" aria-label="Close selected store">
                ✕
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="p-5">
        <div className="flex gap-2 mb-4">
          <input
            type="text"
            value={zip}
            onChange={(e) => setZip(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            placeholder="Enter your ZIP code..."
            className="flex-1 bg-muted rounded-xl py-2.5 px-4 text-sm outline-none focus:ring-2 focus:ring-primary/30"
          />
          <button
            onClick={handleSearch}
            className="bg-primary text-primary-foreground rounded-xl px-5 py-2.5 text-sm font-semibold"
          >
            Find
          </button>
        </div>

        <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
          {chains.map((chain) => (
            <button
              key={chain}
              onClick={() => handleChainFilter(chain)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                activeChain === chain
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:text-foreground"
              }`}
            >
              {chain}
            </button>
          ))}
        </div>

        <div className="space-y-2 max-h-48 overflow-y-auto">
          {filteredStores.slice(0, 5).map((store) => (
            <button
              key={store.name}
              onClick={() => {
                setSelectedStore(store);
                setCenter({ lat: store.lat, lng: store.lng });
              }}
              className={`w-full flex items-center justify-between p-2.5 rounded-xl text-left transition-colors ${
                selectedStore?.name === store.name ? "bg-primary/5 border border-primary/20" : "hover:bg-muted"
              }`}
            >
              <div className="flex items-center gap-2">
                <MapPin size={14} className="text-primary flex-shrink-0" />
                <div>
                  <span className="text-sm font-medium text-foreground block">{store.name}</span>
                  <span className="text-xs text-muted-foreground">{store.address}</span>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default StoreMap;
