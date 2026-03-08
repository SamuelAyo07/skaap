import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MapPin, Navigation, ChevronRight, Loader2 } from "lucide-react";
import skaapIcon from "@/assets/skaap-icon.png";
import storeTraderJoes from "@/assets/store-traderjoes-boston.jpg";
import storeWholeFoods from "@/assets/store-wholefoods-cambridge.jpg";
import storeStarMarket from "@/assets/store-starmarket-boston.jpg";

interface HomeScreenProps {
  onSelectStore: () => void;
}

const demoStores = [
  { id: "1", name: "Trader Joe's", address: "899 Boylston St, Boston", image: storeTraderJoes, lat: 42.3487, lng: -71.0838 },
  { id: "2", name: "Whole Foods Market", address: "340 River St, Cambridge", image: storeWholeFoods, lat: 42.3646, lng: -71.1047 },
  { id: "3", name: "Star Market", address: "33 Kilmarnock St, Boston", image: storeStarMarket, lat: 42.3429, lng: -71.0994 },
];

function getDistance(lat1: number, lng1: number, lat2: number, lng2: number) {
  const R = 3959; // miles
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

type Phase = "locating" | "ready";

const HomeScreen = ({ onSelectStore }: HomeScreenProps) => {
  const [phase, setPhase] = useState<Phase>("locating");
  const [sortedStores, setSortedStores] = useState(demoStores);
  const [distances, setDistances] = useState<Record<string, number>>({});
  const [nearestName, setNearestName] = useState("");

  useEffect(() => {
    if (!navigator.geolocation) {
      setSortedStores(demoStores);
      setPhase("ready");
      return;
    }

    const timeout = setTimeout(() => setPhase("ready"), 4000); // fallback after 4s

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        clearTimeout(timeout);
        const { latitude, longitude } = pos.coords;
        const withDist = demoStores.map((s) => ({
          ...s,
          dist: getDistance(latitude, longitude, s.lat, s.lng),
        }));
        withDist.sort((a, b) => a.dist - b.dist);
        const distMap: Record<string, number> = {};
        withDist.forEach((s) => (distMap[s.id] = s.dist));
        setDistances(distMap);
        setSortedStores(withDist);
        setNearestName(withDist[0].name);
        setPhase("ready");
      },
      () => {
        clearTimeout(timeout);
        setPhase("ready");
      },
      { enableHighAccuracy: false, timeout: 3500, maximumAge: 60000 }
    );

    return () => clearTimeout(timeout);
  }, []);

  // Locating screen
  if (phase === "locating") {
    return (
      <div className="flex flex-col items-center justify-center h-screen px-8 bg-background">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center"
        >
          <div className="relative mb-8">
            <motion.div
              animate={{ scale: [1, 1.3, 1], opacity: [0.3, 0.1, 0.3] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="absolute inset-0 rounded-full bg-primary/20 -m-4"
            />
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
              <Navigation size={28} className="text-primary" />
            </div>
          </div>
          <h2 className="text-xl font-bold text-foreground mb-2">Finding your store…</h2>
          <p className="text-sm text-muted-foreground text-center">
            Using your location to find the nearest SKAAP store
          </p>
          <Loader2 size={20} className="text-primary animate-spin mt-6" />
        </motion.div>
      </div>
    );
  }

  return (
    <div className="px-5 pt-14 pb-24 bg-background min-h-screen">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-3 mb-8"
      >
        <img src={skaapIcon} alt="SKAAP" className="w-10 h-10 rounded-xl" />
        <div>
          <h1 className="text-lg font-bold text-foreground leading-tight">Good to see you</h1>
          <p className="text-xs text-muted-foreground">
            {nearestName ? `${nearestName} is closest` : "Pick a store to start"}
          </p>
        </div>
      </motion.div>

      {/* Nearest store — hero card */}
      <motion.button
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        whileTap={{ scale: 0.98 }}
        onClick={onSelectStore}
        className="w-full rounded-[20px] overflow-hidden shadow-elevated bg-card mb-3 text-left"
      >
        <div className="relative h-44">
          <img
            src={sortedStores[0].image}
            alt={sortedStores[0].name}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
          <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between">
            <div>
              {nearestName && (
                <span className="text-[10px] font-semibold text-primary bg-primary/20 backdrop-blur-sm rounded-full px-2.5 py-0.5 mb-1.5 inline-block uppercase tracking-wider">
                  Nearest
                </span>
              )}
              <h3 className="text-white font-bold text-lg leading-tight">{sortedStores[0].name}</h3>
              <div className="flex items-center gap-1.5 mt-0.5">
                <MapPin size={11} className="text-white/70" />
                <p className="text-white/70 text-xs">{sortedStores[0].address}</p>
              </div>
            </div>
            <div className="flex items-center gap-1 bg-white/20 backdrop-blur-sm rounded-full px-3 py-1.5">
              {distances[sortedStores[0].id] != null && (
                <span className="text-white text-xs font-medium">
                  {distances[sortedStores[0].id].toFixed(1)} mi
                </span>
              )}
              <ChevronRight size={14} className="text-white" />
            </div>
          </div>
        </div>
      </motion.button>

      {/* Other stores */}
      {sortedStores.length > 1 && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mt-5 mb-3 px-1"
        >
          Other stores
        </motion.p>
      )}

      <div className="space-y-2">
        {sortedStores.slice(1).map((store, i) => (
          <motion.button
            key={store.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 + i * 0.08 }}
            whileTap={{ scale: 0.98 }}
            onClick={onSelectStore}
            className="w-full flex items-center gap-3.5 bg-card rounded-2xl p-3 shadow-card text-left"
          >
            <img
              src={store.image}
              alt={store.name}
              className="w-14 h-14 rounded-xl object-cover flex-shrink-0"
            />
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-semibold text-foreground truncate">{store.name}</h3>
              <div className="flex items-center gap-1 mt-0.5">
                <MapPin size={10} className="text-muted-foreground flex-shrink-0" />
                <p className="text-xs text-muted-foreground truncate">{store.address}</p>
              </div>
            </div>
            <div className="flex items-center gap-1 flex-shrink-0">
              {distances[store.id] != null && (
                <span className="text-xs text-muted-foreground font-medium">
                  {distances[store.id].toFixed(1)} mi
                </span>
              )}
              <ChevronRight size={16} className="text-muted-foreground/50" />
            </div>
          </motion.button>
        ))}
      </div>
    </div>
  );
};

export default HomeScreen;
