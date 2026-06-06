import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { MapPin, Navigation, ChevronRight, Sparkles, Bell, Store } from "lucide-react";
import { fetchNearbyStores, type NearbyStore } from "@/lib/nearbyStores";
import { trackEvent } from "@/lib/analytics";

// Fallback store images (cycled for visual variety)
import storeTraderJoes from "@/assets/store-traderjoes-boston.jpg";
import storeWholeFoods from "@/assets/store-wholefoods-cambridge.jpg";
import storeStarMarket from "@/assets/store-starmarket-boston.jpg";
import storeWalmart from "@/assets/store-walmart.jpg";
import storeFreshco from "@/assets/store-freshco.jpg";
import storeRcs from "@/assets/store-rcs.jpg";

const storeImages = [storeTraderJoes, storeWholeFoods, storeStarMarket, storeWalmart, storeFreshco, storeRcs];

interface HomeScreenProps {
  onSelectStore: () => void;
}

function getDistance(lat1: number, lng1: number, lat2: number, lng2: number) {
  const R = 3959; // miles
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

type Phase = "locating" | "ready";

interface DisplayStore extends NearbyStore {
  image: string;
  dist?: number;
}

const HomeScreen = ({ onSelectStore }: HomeScreenProps) => {
  const [phase, setPhase] = useState<Phase>("locating");
  const [stores, setStores] = useState<DisplayStore[]>([]);
  const [distances, setDistances] = useState<Record<string, number>>({});
  const [nearestName, setNearestName] = useState("");
  const [notifRequested, setNotifRequested] = useState(false);
  const [locationError, setLocationError] = useState(false);

  useEffect(() => {
    if (!navigator.geolocation) {
      setLocationError(true);
      setPhase("ready");
      return;
    }

    const timeout = setTimeout(() => {
      setLocationError(true);
      setPhase("ready");
    }, 8000);

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        clearTimeout(timeout);
        trackEvent("location_granted");
        const { latitude, longitude } = pos.coords;

        try {
          const realStores = await fetchNearbyStores(latitude, longitude, 5000, 15);

          if (realStores.length === 0) {
            // Try wider radius
            const widerStores = await fetchNearbyStores(latitude, longitude, 15000, 15);
            processStores(widerStores, latitude, longitude);
          } else {
            processStores(realStores, latitude, longitude);
          }
        } catch (err) {
          console.error("Failed to fetch nearby stores:", err);
          setLocationError(true);
          setPhase("ready");
        }
      },
      () => {
        clearTimeout(timeout);
        trackEvent("location_denied");
        setLocationError(true);
        setPhase("ready");
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );

    return () => clearTimeout(timeout);
  }, []);

  const processStores = (rawStores: NearbyStore[], lat: number, lng: number) => {
    const withDist: DisplayStore[] = rawStores.map((s, i) => ({
      ...s,
      dist: getDistance(lat, lng, s.lat, s.lng),
      image: storeImages[i % storeImages.length],
    }));
    withDist.sort((a, b) => (a.dist ?? 999) - (b.dist ?? 999));

    const distMap: Record<string, number> = {};
    withDist.forEach((s) => {
      if (s.dist != null) distMap[s.id] = s.dist;
    });

    setDistances(distMap);
    setStores(withDist);
    if (withDist.length > 0) setNearestName(withDist[0].name);
    setPhase("ready");
  };

  const requestNotifications = async () => {
    if ("Notification" in window) {
      const permission = await Notification.requestPermission();
      setNotifRequested(true);
      if (permission === "granted") {
        new Notification("Skaap 🐑", {
          body: "You'll get alerts for deals at nearby stores!",
          icon: "/skaap-icon-192.png",
        });
      }
    }
  };

  const visibleStores = stores.slice(0, 8);

  if (phase === "locating") {
    return (
      <div className="flex flex-col items-center justify-center h-screen px-6 bg-background">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center"
        >
          <div className="relative mb-8">
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
            <div className="w-14 h-14 rounded-full bg-foreground flex items-center justify-center">
              <Navigation size={22} className="text-background" />
            </div>
          </div>
          <h2 className="text-xl font-bold text-foreground tracking-tight mb-1.5">Finding nearby stores</h2>
          <p className="text-xs text-muted-foreground text-center max-w-[220px]">
            Searching for real stores around you…
          </p>
        </motion.div>
      </div>
    );
  }

  // No stores found or location denied
  if (visibleStores.length === 0) {
    return (
      <div className="px-4 pt-10 pb-20 bg-background min-h-[100dvh]">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-3">
          <h1 className="text-2xl font-bold text-foreground tracking-tight leading-tight">{getGreeting()}</h1>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center text-center py-16 px-4"
        >
          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
            <Store size={28} className="text-muted-foreground" />
          </div>
          <h3 className="font-bold text-foreground mb-1.5 tracking-tight">
            {locationError ? "Enable location to find stores" : "No stores found nearby"}
          </h3>
          <p className="text-xs text-muted-foreground max-w-[260px] leading-relaxed">
            {locationError
              ? "Allow location access in your browser settings, then refresh to discover real stores around you."
              : "Try again from a different location, Skaap works with any grocery store worldwide."}
          </p>
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={onSelectStore}
            className="mt-6 bg-foreground text-background px-6 py-2.5 rounded-full text-sm font-semibold"
          >
            Try Demo Mode Instead
          </motion.button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="px-4 pt-8 pb-20 bg-background min-h-[100dvh]">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-2.5"
      >
        <p className="text-[11px] text-muted-foreground mb-0.5">
          {nearestName ? `${nearestName} is closest` : "Pick a store to start"}
        </p>
        <h1 className="text-[22px] font-bold text-foreground tracking-tight leading-tight">
          {getGreeting()}
        </h1>
      </motion.div>

      {/* Push notification banner */}
      {!notifRequested && "Notification" in window && Notification.permission === "default" && (
        <motion.button
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          whileTap={{ scale: 0.97 }}
          onClick={requestNotifications}
          className="w-full flex items-center gap-3 bg-primary/10 rounded-xl p-3 mb-3 text-left"
        >
          <div className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
            <Bell size={16} className="text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[13px] font-semibold text-foreground">Enable deal alerts</p>
            <p className="text-[11px] text-muted-foreground">Get notified about deals at nearby stores</p>
          </div>
          <ChevronRight size={14} className="text-muted-foreground flex-shrink-0" />
        </motion.button>
      )}

      {/* Nearest store, hero card */}
      <motion.button
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.08, type: "spring", stiffness: 200, damping: 24 }}
        whileTap={{ scale: 0.97 }}
        onClick={onSelectStore}
        className="w-full rounded-2xl overflow-hidden shadow-hero bg-card mb-3 text-left group"
      >
        <div className="relative h-32">
          <img
            src={visibleStores[0].image}
            alt={visibleStores[0].name}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-foreground/80 via-foreground/20 to-transparent" />
          
          {nearestName && (
            <div className="absolute top-3 left-3">
              <span className="text-[10px] font-semibold text-background bg-accent rounded-full px-2.5 py-0.5 uppercase tracking-wider flex items-center gap-1">
                <Sparkles size={9} /> Nearest
              </span>
            </div>
          )}
          
          <div className="absolute bottom-0 left-0 right-0 p-4">
            <h3 className="text-background font-bold text-lg tracking-tight">{visibleStores[0].name}</h3>
            <div className="flex items-center justify-between mt-1">
              <div className="flex items-center gap-1">
                <MapPin size={11} className="text-background/60" />
                <p className="text-background/60 text-[11px]">
                  {visibleStores[0].address || "Tap to start scanning"}
                </p>
              </div>
              <div className="flex items-center gap-1 bg-background/15 backdrop-blur-md rounded-full px-2.5 py-0.5">
                {distances[visibleStores[0].id] != null && (
                  <span className="text-background text-[11px] font-medium">
                    {distances[visibleStores[0].id].toFixed(1)} mi
                  </span>
                )}
                <ChevronRight size={11} className="text-background/70" />
              </div>
            </div>
          </div>
        </div>
      </motion.button>

      {/* Section label */}
      {visibleStores.length > 1 && (
        <motion.p
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
          className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest mb-2 px-0.5"
        >
          Nearby
        </motion.p>
      )}

      {/* Other stores */}
      <div className="space-y-1.5">
        {visibleStores.slice(1).map((store, i) => (
          <motion.button
            key={store.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.32 + i * 0.06, type: "spring", stiffness: 260, damping: 22 }}
            whileHover={{ x: 4, backgroundColor: "hsl(var(--muted) / 0.8)" }}
            whileTap={{ scale: 0.96 }}
            onClick={onSelectStore}
            className="w-full flex items-center gap-3 bg-muted/50 rounded-xl p-3 text-left group"
          >
            <motion.img
              src={store.image}
              alt={store.name}
              className="w-12 h-12 rounded-lg object-cover flex-shrink-0"
              whileHover={{ scale: 1.1 }}
              transition={{ type: "spring", stiffness: 300 }}
            />
            <div className="flex-1 min-w-0">
              <h3 className="text-[13px] font-semibold text-foreground truncate tracking-tight">{store.name}</h3>
              <div className="flex items-center gap-1 mt-0.5">
                <MapPin size={9} className="text-muted-foreground flex-shrink-0" />
                <p className="text-[11px] text-muted-foreground truncate">
                  {store.address || "Grocery store"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1 flex-shrink-0">
              {distances[store.id] != null && (
                <span className="text-[11px] text-muted-foreground font-medium">
                  {distances[store.id].toFixed(1)} mi
                </span>
              )}
              <motion.div
                animate={{ x: [0, 3, 0] }}
                transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 2 + i * 0.5 }}
              >
                <ChevronRight size={13} className="text-muted-foreground/40 group-hover:text-foreground transition-colors" />
              </motion.div>
            </div>
          </motion.button>
        ))}
      </div>
    </div>
  );
};

export default HomeScreen;
