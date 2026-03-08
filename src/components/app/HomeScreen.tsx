import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MapPin, Navigation, ChevronRight, Sparkles, Bell } from "lucide-react";
import skaapIcon from "@/assets/skaap-icon.png";
import storeTraderJoes from "@/assets/store-traderjoes-boston.jpg";
import storeWholeFoods from "@/assets/store-wholefoods-cambridge.jpg";
import storeStarMarket from "@/assets/store-starmarket-boston.jpg";
import storeWalmart from "@/assets/store-walmart.jpg";
import storeFreshco from "@/assets/store-freshco.jpg";
import storeSuperstore from "@/assets/store-superstore.png";
import storeRcs from "@/assets/store-rcs.jpg";

interface HomeScreenProps {
  onSelectStore: () => void;
}

const demoStores = [
  // Boston area
  { id: "1", name: "Trader Joe's", address: "899 Boylston St, Boston", image: storeTraderJoes, lat: 42.3487, lng: -71.0838 },
  { id: "2", name: "Whole Foods Market", address: "340 River St, Cambridge", image: storeWholeFoods, lat: 42.3646, lng: -71.1047 },
  { id: "3", name: "Star Market", address: "33 Kilmarnock St, Boston", image: storeStarMarket, lat: 42.3429, lng: -71.0994 },
  { id: "4", name: "Stop & Shop", address: "1100 Massachusetts Ave, Cambridge", image: storeSuperstore, lat: 42.3736, lng: -71.1189 },
  { id: "5", name: "Market Basket", address: "400 Somerville Ave, Somerville", image: storeFreshco, lat: 42.3803, lng: -71.0968 },
  { id: "b1", name: "Wegmans", address: "138 Chestnut Hill Ave, Brighton", image: storeSuperstore, lat: 42.3385, lng: -71.1527 },
  { id: "b2", name: "Aldi", address: "175 Allstate Rd, Dorchester", image: storeFreshco, lat: 42.3012, lng: -71.0544 },
  // New York area
  { id: "6", name: "Whole Foods", address: "10 Columbus Cir, New York", image: storeWholeFoods, lat: 40.7687, lng: -73.9833 },
  { id: "7", name: "Trader Joe's", address: "142 E 14th St, New York", image: storeTraderJoes, lat: 40.7338, lng: -73.9882 },
  { id: "8", name: "Walmart Supercenter", address: "570 Gateway Dr, Brooklyn", image: storeWalmart, lat: 40.6586, lng: -73.8830 },
  { id: "n1", name: "Wegmans", address: "Brooklyn Navy Yard, Brooklyn", image: storeSuperstore, lat: 40.7005, lng: -73.9712 },
  { id: "n2", name: "Trader Joe's", address: "436 W 14th St, New York", image: storeTraderJoes, lat: 40.7407, lng: -74.0062 },
  { id: "n3", name: "Target", address: "517 E 117th St, New York", image: storeWalmart, lat: 40.7971, lng: -73.9381 },
  { id: "n4", name: "Aldi", address: "132-01 31st Ave, Flushing", image: storeFreshco, lat: 40.7703, lng: -73.8413 },
  // Miami area
  { id: "9", name: "Publix", address: "1776 Brickell Ave, Miami", image: storeRcs, lat: 25.7572, lng: -80.1918 },
  { id: "10", name: "Whole Foods", address: "12150 Biscayne Blvd, N Miami", image: storeWholeFoods, lat: 25.8914, lng: -80.1627 },
  { id: "m1", name: "Sedano's", address: "2709 W Flagler St, Miami", image: storeFreshco, lat: 25.7665, lng: -80.2478 },
  { id: "m2", name: "Walmart", address: "3200 NW 79th St, Miami", image: storeWalmart, lat: 25.8366, lng: -80.2564 },
  // DC area
  { id: "11", name: "Whole Foods", address: "2323 Wisconsin Ave NW, DC", image: storeWholeFoods, lat: 38.9219, lng: -77.0707 },
  { id: "12", name: "Trader Joe's", address: "1101 Pennsylvania Ave SE, DC", image: storeTraderJoes, lat: 38.882, lng: -76.9908 },
  { id: "d1", name: "Giant Food", address: "300 H St NE, DC", image: storeSuperstore, lat: 38.9003, lng: -76.9972 },
  { id: "d2", name: "Safeway", address: "1701 Corcoran St NW, DC", image: storeRcs, lat: 38.9119, lng: -77.0385 },
  // Atlanta
  { id: "13", name: "Kroger", address: "3330 Piedmont Rd NE, Atlanta", image: storeSuperstore, lat: 33.8441, lng: -84.3752 },
  { id: "14", name: "Publix", address: "595 Piedmont Ave NE, Atlanta", image: storeRcs, lat: 33.7716, lng: -84.382 },
  { id: "a1", name: "Whole Foods", address: "650 Ponce De Leon Ave, Atlanta", image: storeWholeFoods, lat: 33.7725, lng: -84.3651 },
  { id: "a2", name: "Trader Joe's", address: "931 Monroe Dr NE, Atlanta", image: storeTraderJoes, lat: 33.7797, lng: -84.3641 },
  // Philadelphia
  { id: "15", name: "Whole Foods", address: "2101 Pennsylvania Ave, Philly", image: storeWholeFoods, lat: 39.9579, lng: -75.173 },
  { id: "p1", name: "Trader Joe's", address: "2121 Market St, Philly", image: storeTraderJoes, lat: 39.9537, lng: -75.1744 },
  { id: "p2", name: "Acme Markets", address: "1400 S Penn Square, Philly", image: storeSuperstore, lat: 39.9506, lng: -75.1658 },
  // Chicago
  { id: "c1", name: "Whole Foods", address: "1550 N Kingsbury St, Chicago", image: storeWholeFoods, lat: 41.9097, lng: -87.6528 },
  { id: "c2", name: "Trader Joe's", address: "44 E Ontario St, Chicago", image: storeTraderJoes, lat: 41.8934, lng: -87.6255 },
  { id: "c3", name: "Mariano's", address: "333 E Benton Pl, Chicago", image: storeSuperstore, lat: 41.8891, lng: -87.6176 },
  // Los Angeles
  { id: "l1", name: "Trader Joe's", address: "263 S La Brea Ave, LA", image: storeTraderJoes, lat: 34.0635, lng: -118.3445 },
  { id: "l2", name: "Whole Foods", address: "6350 W 3rd St, LA", image: storeWholeFoods, lat: 34.0695, lng: -118.3563 },
  { id: "l3", name: "Ralph's", address: "260 S La Brea Ave, LA", image: storeSuperstore, lat: 34.0634, lng: -118.3445 },
  // San Francisco
  { id: "s1", name: "Trader Joe's", address: "401 Bay St, San Francisco", image: storeTraderJoes, lat: 37.8061, lng: -122.4170 },
  { id: "s2", name: "Whole Foods", address: "399 4th St, San Francisco", image: storeWholeFoods, lat: 37.7824, lng: -122.3998 },
  // Seattle
  { id: "se1", name: "Whole Foods", address: "2210 Westlake Ave, Seattle", image: storeWholeFoods, lat: 47.6185, lng: -122.3382 },
  { id: "se2", name: "Trader Joe's", address: "112 W Galer St, Seattle", image: storeTraderJoes, lat: 47.6351, lng: -122.3578 },
  // Houston
  { id: "h1", name: "H-E-B", address: "5895 San Felipe St, Houston", image: storeRcs, lat: 29.7507, lng: -95.4903 },
  { id: "h2", name: "Kroger", address: "3300 Montrose Blvd, Houston", image: storeSuperstore, lat: 29.7405, lng: -95.3914 },
  // Denver
  { id: "de1", name: "King Soopers", address: "2750 S Colorado Blvd, Denver", image: storeSuperstore, lat: 39.6714, lng: -104.9412 },
  { id: "de2", name: "Whole Foods", address: "2375 E 1st Ave, Denver", image: storeWholeFoods, lat: 39.7193, lng: -104.9541 },
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

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

type Phase = "locating" | "ready";

const HomeScreen = ({ onSelectStore }: HomeScreenProps) => {
  const [phase, setPhase] = useState<Phase>("locating");
  const [sortedStores, setSortedStores] = useState(demoStores);
  const [distances, setDistances] = useState<Record<string, number>>({});
  const [nearestName, setNearestName] = useState("");
  const [notifRequested, setNotifRequested] = useState(false);

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

  const visibleStores = sortedStores.slice(0, 8);

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
          <h2 className="text-xl font-bold text-foreground tracking-tight mb-1.5">Finding your store</h2>
          <p className="text-xs text-muted-foreground text-center max-w-[220px]">
            Using your location to find the nearest store
          </p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="px-4 pt-12 pb-20 bg-background min-h-screen">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-5"
      >
        <p className="text-xs text-muted-foreground mb-0.5">
          {nearestName ? `${nearestName} is closest` : "Pick a store to start"}
        </p>
        <h1 className="text-2xl font-bold text-foreground tracking-tight leading-tight">
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

      {/* Nearest store — hero card */}
      <motion.button
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.08, type: "spring", stiffness: 200, damping: 24 }}
        whileTap={{ scale: 0.97 }}
        onClick={onSelectStore}
        className="w-full rounded-2xl overflow-hidden shadow-hero bg-card mb-3 text-left group"
      >
        <div className="relative h-40">
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
                <p className="text-background/60 text-[11px]">{visibleStores[0].address}</p>
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

      {/* ─── Deals Section ─── */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.15 }}
        className="mt-4 mb-4"
      >
        <div className="flex items-center gap-1.5 mb-2 px-0.5">
          <motion.span
            animate={{ scale: [1, 1.2, 1], rotate: [0, -10, 10, 0] }}
            transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
            className="text-sm"
          >
            🔥
          </motion.span>
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">
            Deals near you
          </p>
          <motion.span
            animate={{ opacity: [0.4, 1, 0.4] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="ml-auto text-[9px] text-accent font-bold uppercase tracking-wider"
          >
            Live
          </motion.span>
        </div>
        <div className="flex gap-2.5 overflow-x-auto pb-2 -mx-1 px-1 scrollbar-hide">
          {[
            { emoji: "🥑", item: "Avocados", deal: "2 for $3", store: visibleStores[0]?.name || "Store", color: "bg-green-500/10 text-green-700", borderColor: "border-green-500/20" },
            { emoji: "🍞", item: "Sourdough Bread", deal: "$2.99", store: visibleStores[1]?.name || "Store", color: "bg-amber-500/10 text-amber-700", borderColor: "border-amber-500/20" },
            { emoji: "🥛", item: "Oat Milk", deal: "Buy 1 Get 1", store: visibleStores[2]?.name || "Store", color: "bg-blue-500/10 text-blue-700", borderColor: "border-blue-500/20" },
            { emoji: "🍌", item: "Organic Bananas", deal: "$0.59/lb", store: visibleStores[0]?.name || "Store", color: "bg-yellow-500/10 text-yellow-700", borderColor: "border-yellow-500/20" },
            { emoji: "🧀", item: "Cheddar Block", deal: "30% off", store: visibleStores[3]?.name || "Store", color: "bg-orange-500/10 text-orange-700", borderColor: "border-orange-500/20" },
          ].map((deal, i) => (
            <motion.button
              key={i}
              initial={{ opacity: 0, scale: 0.8, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ delay: 0.2 + i * 0.08, type: "spring", stiffness: 300, damping: 20 }}
              whileHover={{ y: -4, scale: 1.03 }}
              whileTap={{ scale: 0.92, rotate: -2 }}
              onClick={onSelectStore}
              className={`flex-shrink-0 w-[140px] bg-muted/50 rounded-xl p-3 text-left border ${deal.borderColor} relative overflow-hidden group`}
            >
              {/* Shimmer effect */}
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -skew-x-12"
                initial={{ x: "-100%" }}
                animate={{ x: "200%" }}
                transition={{ duration: 3, repeat: Infinity, repeatDelay: 5 + i * 2, ease: "easeInOut" }}
              />
              <motion.span
                className="text-2xl block"
                whileHover={{ scale: 1.3, rotate: 15 }}
                transition={{ type: "spring", stiffness: 400 }}
              >
                {deal.emoji}
              </motion.span>
              <p className="text-[12px] font-semibold text-foreground mt-1.5 truncate">{deal.item}</p>
              <motion.span
                className={`inline-block text-[10px] font-bold rounded-full px-2 py-0.5 mt-1 ${deal.color}`}
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ duration: 2, repeat: Infinity, delay: i * 0.5 }}
              >
                {deal.deal}
              </motion.span>
              <p className="text-[9px] text-muted-foreground mt-1 truncate">{deal.store}</p>
            </motion.button>
          ))}
        </div>
      </motion.div>

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
                <p className="text-[11px] text-muted-foreground truncate">{store.address}</p>
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
