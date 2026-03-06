import { useState, useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import { Icon } from "leaflet";
import "leaflet/dist/leaflet.css";
import { MapPin } from "lucide-react";
import { motion } from "framer-motion";

// Fix default marker icon
const storeIcon = new Icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});

interface StoreLocation {
  name: string;
  chain: string;
  address: string;
  lat: number;
  lng: number;
}

// Real East Coast US grocery stores
const eastCoastStores: StoreLocation[] = [
  // New York
  { name: "Whole Foods Market - Columbus Circle", chain: "Whole Foods", address: "10 Columbus Cir, New York, NY 10019", lat: 40.7687, lng: -73.9833 },
  { name: "Trader Joe's - Union Square", chain: "Trader Joe's", address: "142 E 14th St, New York, NY 10003", lat: 40.7338, lng: -73.9882 },
  { name: "Kroger - Midtown East", chain: "Kroger", address: "1095 6th Ave, New York, NY 10036", lat: 40.7544, lng: -73.9835 },
  // Miami / Florida
  { name: "Publix - Brickell", chain: "Publix", address: "1776 Brickell Ave, Miami, FL 33129", lat: 25.7572, lng: -80.1918 },
  { name: "Publix - South Beach", chain: "Publix", address: "1920 Bay Rd, Miami Beach, FL 33139", lat: 25.7927, lng: -80.1389 },
  { name: "Whole Foods Market - North Miami", chain: "Whole Foods", address: "12150 Biscayne Blvd, North Miami, FL 33181", lat: 25.8914, lng: -80.1627 },
  // Boston
  { name: "Trader Joe's - Back Bay", chain: "Trader Joe's", address: "899 Boylston St, Boston, MA 02115", lat: 42.3487, lng: -71.0838 },
  { name: "Whole Foods Market - Cambridge", chain: "Whole Foods", address: "340 River St, Cambridge, MA 02139", lat: 42.3646, lng: -71.1047 },
  // Washington DC
  { name: "Whole Foods Market - Georgetown", chain: "Whole Foods", address: "2323 Wisconsin Ave NW, Washington, DC 20007", lat: 38.9219, lng: -77.0707 },
  { name: "Trader Joe's - Capitol Hill", chain: "Trader Joe's", address: "1101 Pennsylvania Ave SE, Washington, DC 20003", lat: 38.8820, lng: -76.9908 },
  // Atlanta
  { name: "Publix - Midtown Atlanta", chain: "Publix", address: "595 Piedmont Ave NE, Atlanta, GA 30308", lat: 33.7716, lng: -84.3820 },
  { name: "Kroger - Buckhead", chain: "Kroger", address: "3330 Piedmont Rd NE, Atlanta, GA 30305", lat: 33.8441, lng: -84.3752 },
  // Charlotte
  { name: "Publix - Uptown Charlotte", chain: "Publix", address: "130 E Stonewall St, Charlotte, NC 28202", lat: 35.2203, lng: -80.8427 },
  // Philadelphia
  { name: "Whole Foods Market - Center City", chain: "Whole Foods", address: "2101 Pennsylvania Ave, Philadelphia, PA 19130", lat: 39.9579, lng: -75.1730 },
  { name: "Trader Joe's - Ardmore", chain: "Trader Joe's", address: "112 Coulter Ave, Ardmore, PA 19003", lat: 40.0078, lng: -75.2911 },
];

const MapController = ({ center }: { center: [number, number] }) => {
  const map = useMap();
  useEffect(() => {
    map.flyTo(center, 11, { duration: 1.5 });
  }, [center, map]);
  return null;
};

const StoreMap = () => {
  const [selectedStore, setSelectedStore] = useState<StoreLocation | null>(null);
  const [center, setCenter] = useState<[number, number]>([39.5, -77.0]);
  const [zip, setZip] = useState("");
  const [filteredStores, setFilteredStores] = useState(eastCoastStores);
  const [activeChain, setActiveChain] = useState<string | null>(null);

  const chains = Array.from(new Set(eastCoastStores.map(s => s.chain)));

  const handleSearch = () => {
    // Simple ZIP-to-city mapping for demo
    const zipMap: Record<string, { lat: number; lng: number; label: string }> = {
      "10": { lat: 40.7580, lng: -73.9855, label: "New York" },
      "33": { lat: 25.7617, lng: -80.1918, label: "Miami" },
      "02": { lat: 42.3601, lng: -71.0589, label: "Boston" },
      "20": { lat: 38.9072, lng: -77.0369, label: "Washington DC" },
      "30": { lat: 33.7490, lng: -84.3880, label: "Atlanta" },
      "28": { lat: 35.2271, lng: -80.8431, label: "Charlotte" },
      "19": { lat: 39.9526, lng: -75.1652, label: "Philadelphia" },
    };
    const prefix = zip.substring(0, 2);
    if (zipMap[prefix]) {
      setCenter([zipMap[prefix].lat, zipMap[prefix].lng]);
    }
  };

  const handleChainFilter = (chain: string) => {
    if (activeChain === chain) {
      setActiveChain(null);
      setFilteredStores(eastCoastStores);
    } else {
      setActiveChain(chain);
      setFilteredStores(eastCoastStores.filter(s => s.chain === chain));
    }
  };

  return (
    <div className="bg-card rounded-3xl shadow-elevated overflow-hidden border border-border">
      {/* Map */}
      <div className="relative h-[400px]">
        <MapContainer
          center={center}
          zoom={6}
          scrollWheelZoom={false}
          className="h-full w-full z-0"
          style={{ borderRadius: '1.5rem 1.5rem 0 0' }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <MapController center={center} />
          {filteredStores.map((store, i) => (
            <Marker
              key={i}
              position={[store.lat, store.lng]}
              icon={storeIcon}
              eventHandlers={{
                click: () => setSelectedStore(store),
              }}
            >
              <Popup>
                <div className="text-xs">
                  <p className="font-bold">{store.name}</p>
                  <p className="text-muted-foreground">{store.address}</p>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>

        {/* Selected store overlay */}
        {selectedStore && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="absolute bottom-4 left-4 right-4 bg-background/95 backdrop-blur-sm rounded-2xl p-4 shadow-elevated z-[1000]"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-primary font-semibold uppercase">{selectedStore.chain}</p>
                <h4 className="font-bold text-sm text-foreground">{selectedStore.name}</h4>
                <p className="text-xs text-muted-foreground mt-0.5">{selectedStore.address}</p>
              </div>
              <button onClick={() => setSelectedStore(null)} className="text-muted-foreground text-xs">✕</button>
            </div>
          </motion.div>
        )}
      </div>

      {/* Controls */}
      <div className="p-5">
        {/* Search */}
        <div className="flex gap-2 mb-4">
          <input
            type="text"
            value={zip}
            onChange={(e) => setZip(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            placeholder="Enter your ZIP code..."
            className="flex-1 bg-muted rounded-xl py-2.5 px-4 text-sm outline-none focus:ring-2 focus:ring-primary/30"
          />
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={handleSearch}
            className="bg-primary text-primary-foreground rounded-xl px-5 py-2.5 text-sm font-semibold"
          >
            Find
          </motion.button>
        </div>

        {/* Chain filters */}
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

        {/* Store list */}
        <div className="space-y-2 max-h-48 overflow-y-auto">
          {filteredStores.slice(0, 5).map((store, i) => (
            <motion.button
              key={i}
              whileHover={{ x: 4 }}
              onClick={() => {
                setSelectedStore(store);
                setCenter([store.lat, store.lng]);
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
            </motion.button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default StoreMap;
