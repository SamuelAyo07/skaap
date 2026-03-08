import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MapPin, Navigation, ChevronRight, Loader2, Sparkles } from "lucide-react";
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
  const R = 3959;
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

    const timeout = setTimeout(() => setPhase("ready"), 4000);

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

  if (phase === "locating") {
    return (
      <div className="flex flex-col items-center justify-center h-screen px-8 bg-background">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center"
        >
          <div className="relative mb-10">
            <motion.div
              animate={{ scale: [1, 1.6, 1], opacity: [0.15, 0.05, 0.15] }}
              transition={{ duration: 2.5, repeat: Infinity }}
              className="absolute inset-0 rounded-full bg-foreground/10 -m-6"
            />
            <motion.div
              animate={{ scale: [1, 1.3, 1], opacity: [0.2, 0.08, 0.2] }}
              transition={{ duration: 2.5, repeat: Infinity, delay: 0.3 }}
              className="absolute inset-0 rounded-full bg-foreground/10 -m-3"
            />
            <div className="w-16 h-16 rounded-full bg-foreground flex items-center justify-center">
              <Navigation size={24} className="text-background" />
            </div>
          </div>
          <h2 className="text-2xl font-bold text-foreground tracking-tight mb-2">Finding your store</h2>
          <p className="text-sm text-muted-foreground text-center max-w-[240px]">
            Using your location to find the nearest store
          </p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="px-5 pt-14 pb-24 bg-background min-h-screen">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <p className="text-sm text-muted-foreground mb-1">
          {nearestName ? `${nearestName} is closest` : "Pick a store to start"}
        </p>
        <h1 className="text-[28px] font-bold text-foreground tracking-tight leading-tight">
          Good morning
        </h1>
      </motion.div>

      {/* Nearest store — hero card */}
      <motion.button
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.08, type: "spring", stiffness: 200, damping: 24 }}
        whileTap={{ scale: 0.97 }}
        onClick={onSelectStore}
        className="w-full rounded-3xl overflow-hidden shadow-hero bg-card mb-4 text-left group"
      >
        <div className="relative h-48">
          <img
            src={sortedStores[0].image}
            alt={sortedStores[0].name}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-foreground/80 via-foreground/20 to-transparent" />
          
          {/* Nearest pill */}
          {nearestName && (
            <div className="absolute top-4 left-4">
              <span className="text-[11px] font-semibold text-background bg-accent rounded-full px-3 py-1 uppercase tracking-wider flex items-center gap-1">
                <Sparkles size={10} /> Nearest
              </span>
            </div>
          )}
          
          <div className="absolute bottom-0 left-0 right-0 p-5">
            <h3 className="text-background font-bold text-xl tracking-tight">{sortedStores[0].name}</h3>
            <div className="flex items-center justify-between mt-1.5">
              <div className="flex items-center gap-1.5">
                <MapPin size={12} className="text-background/60" />
                <p className="text-background/60 text-xs">{sortedStores[0].address}</p>
              </div>
              <div className="flex items-center gap-1.5 bg-background/15 backdrop-blur-md rounded-full px-3 py-1">
                {distances[sortedStores[0].id] != null && (
                  <span className="text-background text-xs font-medium">
                    {distances[sortedStores[0].id].toFixed(1)} mi
                  </span>
                )}
                <ChevronRight size={12} className="text-background/70" />
              </div>
            </div>
          </div>
        </div>
      </motion.button>

      {/* Section label */}
      {sortedStores.length > 1 && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mt-6 mb-3 px-1"
        >
          Nearby
        </motion.p>
      )}

      {/* Other stores */}
      <div className="space-y-2">
        {sortedStores.slice(1).map((store, i) => (
          <motion.button
            key={store.id}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.24 + i * 0.06, type: "spring", stiffness: 200, damping: 24 }}
            whileTap={{ scale: 0.97 }}
            onClick={onSelectStore}
            className="w-full flex items-center gap-4 bg-muted/50 rounded-2xl p-3.5 text-left group"
          >
            <img
              src={store.image}
              alt={store.name}
              className="w-14 h-14 rounded-xl object-cover flex-shrink-0"
            />
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-semibold text-foreground truncate tracking-tight">{store.name}</h3>
              <div className="flex items-center gap-1 mt-0.5">
                <MapPin size={10} className="text-muted-foreground flex-shrink-0" />
                <p className="text-xs text-muted-foreground truncate">{store.address}</p>
              </div>
            </div>
            <div className="flex items-center gap-1.5 flex-shrink-0">
              {distances[store.id] != null && (
                <span className="text-xs text-muted-foreground font-medium">
                  {distances[store.id].toFixed(1)} mi
                </span>
              )}
              <ChevronRight size={14} className="text-muted-foreground/40 group-hover:text-foreground transition-colors" />
            </div>
          </motion.button>
        ))}
      </div>
    </div>
  );
};

export default HomeScreen;
