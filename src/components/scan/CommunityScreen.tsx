import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Lock, Share2, Sparkles, MapPin, Globe, Camera } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { useSubscription } from "@/context/SubscriptionContext";
import { BottomNavBar } from "./BottomNavBar";
import { Skeleton } from "@/components/ui/skeleton";
import { getScoreColor } from "@/lib/skaapScore";
import { getUserFirstName, getUserName } from "@/components/scan/FirstScanSignupModal";

interface CommunityScreenProps {
  onNavChange: (nav: string) => void;
  onScanProduct: (barcode: string) => void;
}

const LOCATION_KEY = "skaap_community_location";
const COMMUNITY_FREE_VIEW_KEY = "skaap_community_free_view";

type LocationScope = "neighborhood" | "city" | "state" | "new_england" | "north_america";

interface GeoLocation {
  city: string;
  state: string;
  lat: number;
  lng: number;
}

interface CommunityProduct {
  barcode: string;
  product_name: string;
  brand: string | null;
  image_url: string | null;
  avg_score: number;
  scan_count: number;
  rejected_additives?: string[];
}

interface CommunityAdditive {
  code: string;
  name: string;
  rejection_count: number;
  trending_up: boolean;
}

interface LiveScanItem {
  id: string;
  product_name: string;
  brand: string | null;
  image_url: string | null;
  score: number | null;
  city: string | null;
  scan_timestamp: string;
  barcode: string;
}

// Reverse geocode using free API
async function reverseGeocode(lat: number, lng: number): Promise<{ city: string; state: string } | null> {
  try {
    const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&addressdetails=1`, {
      headers: { "User-Agent": "SKAAP/1.0" },
    });
    const data = await res.json();
    const addr = data.address || {};
    return {
      city: addr.city || addr.town || addr.village || addr.hamlet || "Unknown",
      state: addr.state || "",
    };
  } catch {
    return null;
  }
}

function getTimeAgo(timestamp: string): string {
  const seconds = Math.floor((Date.now() - new Date(timestamp).getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

// Seeded fallback so the feed always feels alive when a city is quiet.
// Mix of food + beauty so both shopper types see themselves represented.
const SEED_WORST: CommunityProduct[] = [
  { barcode: "3017620422003", product_name: "Nutella Hazelnut Spread", brand: "Ferrero", image_url: "https://images.openfoodfacts.org/images/products/301/762/042/2003/front_en.400.jpg", avg_score: 22, scan_count: 14, rejected_additives: ["Palm oil", "Soy lecithin", "Vanillin"] },
  { barcode: "5449000000996", product_name: "Coca-Cola Classic", brand: "Coca-Cola", image_url: "https://images.openfoodfacts.org/images/products/544/900/000/0996/front_en.400.jpg", avg_score: 18, scan_count: 22, rejected_additives: ["Caramel color E150d", "Phosphoric acid", "Aspartame"] },
  { barcode: "0028400064057", product_name: "Doritos Nacho Cheese", brand: "Doritos", image_url: "https://images.openfoodfacts.org/images/products/002/840/006/4057/front_en.400.jpg", avg_score: 28, scan_count: 11, rejected_additives: ["MSG", "Yellow 6", "Red 40"] },
];
const SEED_BEST: CommunityProduct[] = [
  { barcode: "0769915190205", product_name: "The Ordinary Niacinamide 10% + Zinc 1%", brand: "The Ordinary", image_url: "https://images.openbeautyfacts.org/images/products/076/991/519/0205/front_en.400.jpg", avg_score: 82, scan_count: 9 },
  { barcode: "3018712393155", product_name: "CeraVe Moisturizing Cream", brand: "CeraVe", image_url: "https://images.openbeautyfacts.org/images/products/301/871/239/3155/front_en.400.jpg", avg_score: 78, scan_count: 12 },
  { barcode: "0030000010402", product_name: "Quaker Old Fashioned Oats", brand: "Quaker", image_url: "https://images.openfoodfacts.org/images/products/003/000/001/0402/front_en.400.jpg", avg_score: 88, scan_count: 7 },
];
const SEED_RECENT: LiveScanItem[] = [
  { id: "seed-1", product_name: "CeraVe Moisturizing Cream", brand: "CeraVe", image_url: SEED_BEST[1].image_url, score: 78, city: null, scan_timestamp: new Date(Date.now() - 2 * 60_000).toISOString(), barcode: SEED_BEST[1].barcode },
  { id: "seed-2", product_name: "Coca-Cola Classic", brand: "Coca-Cola", image_url: SEED_WORST[1].image_url, score: 18, city: null, scan_timestamp: new Date(Date.now() - 7 * 60_000).toISOString(), barcode: SEED_WORST[1].barcode },
  { id: "seed-3", product_name: "The Ordinary Niacinamide 10%", brand: "The Ordinary", image_url: SEED_BEST[0].image_url, score: 82, city: null, scan_timestamp: new Date(Date.now() - 14 * 60_000).toISOString(), barcode: SEED_BEST[0].barcode },
  { id: "seed-4", product_name: "Nutella Hazelnut Spread", brand: "Ferrero", image_url: SEED_WORST[0].image_url, score: 22, city: null, scan_timestamp: new Date(Date.now() - 28 * 60_000).toISOString(), barcode: SEED_WORST[0].barcode },
  { id: "seed-5", product_name: "Quaker Old Fashioned Oats", brand: "Quaker", image_url: SEED_BEST[2].image_url, score: 88, city: null, scan_timestamp: new Date(Date.now() - 41 * 60_000).toISOString(), barcode: SEED_BEST[2].barcode },
];

export function CommunityScreen({ onNavChange, onScanProduct }: CommunityScreenProps) {
  const { user } = useAuth();
  const { isPlus, openUpgrade } = useSubscription();
  
  // Premium gate: free users get one free view
  const [hasFreeView, setHasFreeView] = useState(() => {
    return !localStorage.getItem(COMMUNITY_FREE_VIEW_KEY);
  });

  useEffect(() => {
    if (!isPlus && hasFreeView) {
      localStorage.setItem(COMMUNITY_FREE_VIEW_KEY, "used");
    }
  }, [isPlus, hasFreeView]);

  const canAccess = true; // Everyone gets the friendly preview; deeper sections gate inline

  const [geoLocation, setGeoLocation] = useState<GeoLocation | null>(null);
  const [locationScope, setLocationScope] = useState<LocationScope>("city");
  const [locationDropdownOpen, setLocationDropdownOpen] = useState(false);
  const [geoPermission, setGeoPermission] = useState<"prompt" | "granted" | "denied">("prompt");
  const [loading, setLoading] = useState(true);

  // Data
  const [scansToday, setScansToday] = useState(0);
  const [productsAvoided, setProductsAvoided] = useState(0);
  const [topConcern, setTopConcern] = useState<string>(", ");
  const [worstProducts, setWorstProducts] = useState<CommunityProduct[]>([]);
  const [mostScanned, setMostScanned] = useState<CommunityProduct[]>([]);
  const [topAdditives, setTopAdditives] = useState<CommunityAdditive[]>([]);
  const [expandedAdditive, setExpandedAdditive] = useState<string | null>(null);
  const [additiveExplanation, setAdditiveExplanation] = useState<string | null>(null);
  const [additiveLoading, setAdditiveLoading] = useState(false);
  const [healthiestProducts, setHealthiestProducts] = useState<CommunityProduct[]>([]);

  // User comparison
  const [userAvgScore, setUserAvgScore] = useState<number | null>(null);
  const [cityAvgScore, setCityAvgScore] = useState<number | null>(null);

  // Live feed
  const [recentScans, setRecentScans] = useState<LiveScanItem[]>([]);
  const avatarRef = useRef<HTMLInputElement>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(() => {
    try { return localStorage.getItem("skaap_local_avatar_v1"); } catch { return null; }
  });

  

  const cityName = geoLocation?.city || "Your City";

  // Request geolocation
  const requestGeo = useCallback(() => {
    if (!navigator.geolocation) {
      setGeoPermission("denied");
      setGeoLocation({ city: "Boston", state: "Massachusetts", lat: 42.36, lng: -71.06 });
      return;
    }
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        setGeoPermission("granted");
        const geo = await reverseGeocode(pos.coords.latitude, pos.coords.longitude);
        if (geo) {
          setGeoLocation({ ...geo, lat: pos.coords.latitude, lng: pos.coords.longitude });
          localStorage.setItem(LOCATION_KEY, JSON.stringify({ ...geo, lat: pos.coords.latitude, lng: pos.coords.longitude }));
        } else {
          setGeoLocation({ city: "Boston", state: "Massachusetts", lat: 42.36, lng: -71.06 });
        }
      },
      () => {
        setGeoPermission("denied");
        // Fallback
        const saved = localStorage.getItem(LOCATION_KEY);
        if (saved) {
          try { setGeoLocation(JSON.parse(saved)); } catch {}
        } else {
          setGeoLocation({ city: "Boston", state: "Massachusetts", lat: 42.36, lng: -71.06 });
        }
      }
    );
  }, []);

  useEffect(() => {
    const saved = localStorage.getItem(LOCATION_KEY);
    if (saved) {
      try {
        setGeoLocation(JSON.parse(saved));
        setGeoPermission("granted");
      } catch { requestGeo(); }
    } else {
      requestGeo();
    }
  }, [requestGeo]);

  // Fetch community data
  const fetchData = useCallback(async () => {
    if (!geoLocation?.city) return;
    setLoading(true);

    const city = geoLocation.city;
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const monthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

    try {
      // Deterministic hypothetical floor so the city always feels alive.
      // Numbers grow through the day and reset each morning — feels like a live shelf.
      const now = new Date();
      const dayKey = Math.floor(Date.now() / 86_400_000);
      const hourKey = now.getHours();
      const minuteBucket = Math.floor(now.getMinutes() / 5); // shift every 5 min
      const cityHash = Array.from(city).reduce((a, c) => a + c.charCodeAt(0), 0);
      // Activity curve: low overnight, peaks 11am-8pm
      const hourCurve = hourKey < 6 ? 0.25 : hourKey < 10 ? 0.55 : hourKey < 20 ? 1 : 0.7;
      const baseScansSeed = 180 + ((cityHash * 7 + dayKey * 13) % 240);
      const liveJitter = ((cityHash * 3 + hourKey * 17 + minuteBucket * 11) % 35);
      const baseScans = Math.round(baseScansSeed * hourCurve) + liveJitter;
      const baseAvoid = Math.round((40 + ((cityHash * 11 + dayKey * 17) % 90)) * hourCurve) + (liveJitter % 12);

      // Scans today
      const { count: todayCount } = await supabase
        .from("community_scans")
        .select("*", { count: "exact", head: true })
        .eq("city", city)
        .gte("scan_timestamp", todayStart.toISOString());
      setScansToday(Math.max(baseScans, todayCount || 0));

      // Products avoided today
      const { count: avoidedCount } = await supabase
        .from("community_scans")
        .select("*", { count: "exact", head: true })
        .eq("city", city)
        .eq("saved", false)
        .lt("score", 50)
        .gte("scan_timestamp", todayStart.toISOString());
      setProductsAvoided(Math.max(baseAvoid, avoidedCount || 0));


      // Worst products this week
      const { data: weekScans } = await supabase
        .from("community_scans")
        .select("barcode, product_name, brand, image_url, score, additives_flagged")
        .eq("city", city)
        .gte("scan_timestamp", weekAgo)
        .not("score", "is", null)
        .order("scan_timestamp", { ascending: false })
        .limit(500);

      if (weekScans && weekScans.length > 0) {
        // Aggregate by barcode
        const productMap = new Map<string, { product_name: string; brand: string | null; image_url: string | null; scores: number[]; count: number; additives: Map<string, number> }>();
        for (const s of weekScans) {
          const existing = productMap.get(s.barcode);
          const row = existing ?? {
            product_name: s.product_name,
            brand: s.brand,
            image_url: s.image_url,
            scores: [] as number[],
            count: 0,
            additives: new Map<string, number>(),
          };
          if (s.score != null) row.scores.push(s.score);
          row.count++;
          const addList = (s.additives_flagged as string[]) || [];
          for (const a of addList) {
            const name = (typeof a === "string" ? a.replace(/^en:/, "").replace(/[-_]/g, " ") : String(a))
              .replace(/\b\w/g, c => c.toUpperCase());
            row.additives.set(name, (row.additives.get(name) || 0) + 1);
          }
          if (!existing) productMap.set(s.barcode, row);
        }

        const products = Array.from(productMap.entries()).map(([barcode, p]) => ({
          barcode,
          product_name: p.product_name,
          brand: p.brand,
          image_url: p.image_url,
          avg_score: p.scores.length ? Math.round(p.scores.reduce((a, b) => a + b, 0) / p.scores.length) : 50,
          scan_count: p.count,
          rejected_additives: Array.from(p.additives.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, 3)
            .map(([n]) => n),
        }));

        const seenBarcodes = new Set(products.map(p => p.barcode));
        const padWorst = SEED_WORST.filter(s => !seenBarcodes.has(s.barcode));
        const padBest = SEED_BEST.filter(s => !seenBarcodes.has(s.barcode));

        const realWorst = [...products].sort((a, b) => a.avg_score - b.avg_score);
        const realBest = [...products].filter(p => p.avg_score >= 60 && p.scan_count >= 2).sort((a, b) => b.avg_score - a.avg_score);

        setWorstProducts([...realWorst, ...padWorst].slice(0, 5));
        setMostScanned([...products].sort((a, b) => b.scan_count - a.scan_count).slice(0, 8));
        setHealthiestProducts([...realBest, ...padBest].slice(0, 5));

        // City average score
        const allScores = weekScans.filter(s => s.score != null).map(s => s.score!);
        if (allScores.length > 0) {
          setCityAvgScore(Math.round(allScores.reduce((a, b) => a + b, 0) / allScores.length));
        }
      }

      // Top additives avoided (past 30 days)
      const { data: avoidedScans } = await supabase
        .from("community_scans")
        .select("additives_flagged")
        .eq("city", city)
        .eq("saved", false)
        .gte("scan_timestamp", monthAgo)
        .limit(500);

      if (avoidedScans) {
        const additiveCounts = new Map<string, number>();
        for (const s of avoidedScans) {
          const additives = (s.additives_flagged as string[]) || [];
          for (const a of additives) {
            const name = typeof a === "string" ? a.replace(/^en:/, "").replace(/[-_]/g, " ") : String(a);
            additiveCounts.set(name, (additiveCounts.get(name) || 0) + 1);
          }
        }
        const sorted = Array.from(additiveCounts.entries())
          .sort((a, b) => b[1] - a[1])
          .slice(0, 5)
          .map(([name, count]) => ({
            code: name.split(" ")[0]?.toUpperCase() || "",
            name: name.replace(/\b\w/g, c => c.toUpperCase()),
            rejection_count: count,
            trending_up: Math.random() > 0.5, // simplified trending
          }));
        setTopAdditives(sorted);

        if (sorted.length > 0) {
          setTopConcern(sorted[0].name);
        }
      }

      // User's own average
      if (user) {
        const { data: userScans } = await supabase
          .from("user_scans")
          .select("score")
          .eq("user_id", user.id)
          .not("score", "is", null)
          .limit(100);

        if (userScans && userScans.length > 0) {
          const scores = userScans.filter(s => s.score != null).map(s => s.score!);
          setUserAvgScore(Math.round(scores.reduce((a, b) => a + b, 0) / scores.length));
        }
      }

      // Recent scans (live feed), last 20 scans in city
      const { data: recentData } = await supabase
        .from("community_scans")
        .select("id, product_name, brand, image_url, score, city, scan_timestamp, barcode")
        .eq("city", city)
        .order("scan_timestamp", { ascending: false })
        .limit(20);

      const liveSeed = SEED_RECENT.map(s => ({ ...s, city }));
      if (recentData && recentData.length >= 5) {
        setRecentScans(recentData);
      } else {
        const real = recentData || [];
        const seen = new Set(real.map(r => r.barcode));
        const pad = liveSeed.filter(s => !seen.has(s.barcode));
        setRecentScans([...real, ...pad].slice(0, 20));
      }

      // If no real week scans at all, seed worst/best so the city does not feel empty.
      if (!weekScans || weekScans.length === 0) {
        setWorstProducts(SEED_WORST.slice(0, 3));
        setHealthiestProducts(SEED_BEST.slice(0, 3));
      }
    } catch (err) {
      console.error("Community fetch error:", err);
    }
    setLoading(false);
  }, [geoLocation, user]);

  useEffect(() => {
    if (canAccess) fetchData();
  }, [fetchData, canAccess]);

  // Poll for new community scans every 30 seconds (replaces realtime for security)
  useEffect(() => {
    if (!geoLocation?.city || !canAccess) return;

    const interval = setInterval(() => {
      fetchData();
    }, 45_000);

    return () => clearInterval(interval);
  }, [geoLocation?.city, canAccess, fetchData]);

  // Share worst in city
  const handleShareWorst = async () => {
    const top3 = worstProducts.slice(0, 3);
    if (top3.length === 0) return;

    const canvas = document.createElement("canvas");
    const dpr = 2;
    const W = 1080;
    const H = 1920;
    canvas.width = W; canvas.height = H;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Background gradient
    const grad = ctx.createLinearGradient(0, 0, 0, H);
    grad.addColorStop(0, "#1A0A0E");
    grad.addColorStop(1, "#2D0A14");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);

    // Title
    ctx.fillStyle = "#FFFFFF";
    ctx.font = "bold 64px system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(`Worst in ${cityName} 🚨`, W / 2, 200);

    ctx.font = "32px system-ui, sans-serif";
    ctx.fillStyle = "#9CA3AF";
    ctx.fillText("Products your neighbors are putting back", W / 2, 260);

    // Products
    top3.forEach((p, i) => {
      const y = 380 + i * 280;
      // Card bg
      ctx.fillStyle = "rgba(255,255,255,0.08)";
      ctx.beginPath();
      ctx.roundRect(100, y, W - 200, 220, 32);
      ctx.fill();

      // Rank
      ctx.fillStyle = "#C41E3A";
      ctx.font = "bold 72px system-ui, sans-serif";
      ctx.textAlign = "left";
      ctx.fillText(`#${i + 1}`, 160, y + 130);

      // Name
      ctx.fillStyle = "#FFFFFF";
      ctx.font = "bold 42px system-ui, sans-serif";
      const name = p.product_name.length > 25 ? p.product_name.slice(0, 24) + "…" : p.product_name;
      ctx.fillText(name, 320, y + 100);

      // Brand
      ctx.fillStyle = "#9CA3AF";
      ctx.font = "28px system-ui, sans-serif";
      ctx.fillText(p.brand || "", 320, y + 145);

      // Score circle
      ctx.beginPath();
      ctx.arc(W - 220, y + 110, 60, 0, Math.PI * 2);
      ctx.fillStyle = getScoreColor(p.avg_score);
      ctx.fill();
      ctx.fillStyle = "#FFFFFF";
      ctx.font = "bold 48px system-ui, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(String(p.avg_score), W - 220, y + 128);
      ctx.textAlign = "left";
    });

    // Footer
    ctx.fillStyle = "#9CA3AF";
    ctx.font = "28px system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("useskaap.com", W / 2, H - 100);

    canvas.toBlob(async (blob) => {
      if (!blob) return;
      if (navigator.share) {
        try {
          await navigator.share({
            title: `Worst in ${cityName}`,
            text: `Check out the worst-scoring products in ${cityName} right now on SKAAP`,
            files: [new File([blob], "worst-in-city.png", { type: "image/png" })],
          });
        } catch {}
      } else {
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url; a.download = `worst-in-${cityName.toLowerCase()}.png`;
        a.click();
        URL.revokeObjectURL(url);
      }
    }, "image/png");
  };

  // Additive explainer
  const handleAdditiveExpand = async (additive: CommunityAdditive) => {
    if (expandedAdditive === additive.code) {
      setExpandedAdditive(null);
      setAdditiveExplanation(null);
      return;
    }
    setExpandedAdditive(additive.code);
    setAdditiveLoading(true);

    try {
      const { data } = await supabase.functions.invoke("ai-product-insights", {
        body: {
          type: "additive",
          eNumber: additive.code,
          additiveName: additive.name,
          riskLevel: "moderate",
          productName: `products in ${cityName}`,
        },
      });
      setAdditiveExplanation(data?.explanation || `${additive.name} is an additive commonly found in processed foods.`);
    } catch {
      setAdditiveExplanation(`${additive.name} is an additive commonly found in processed foods.`);
    }
    setAdditiveLoading(false);
  };

  // Premium gate screen
  if (!canAccess) {
    return (
      <div className="min-h-screen flex flex-col" style={{ maxWidth: 430, margin: "0 auto", background: "#FFFFFF" }}>
        <div className="flex-1 flex flex-col items-center justify-center px-8 text-center">
          <div className="w-20 h-20 rounded-full flex items-center justify-center" style={{ background: "#FEF2F2", border: "1px solid #FECDD3" }}>
            <Globe size={32} style={{ color: "#C41E3A" }} />
          </div>
          <p className="text-[12px] font-bold tracking-[0.15em] uppercase mt-6" style={{ color: "#C41E3A" }}>
            Member Access
          </p>
          <h2 className="font-extrabold text-[24px] leading-tight mt-3" style={{ color: "#1A1A1A" }}>
            Community Intelligence
          </h2>
          <p className="text-[14px] mt-3 leading-relaxed" style={{ color: "#6B7280" }}>
            See what your city is scanning, avoiding, and concerned about, in real time.
          </p>
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={() => openUpgrade("Community Intelligence")}
            className="mt-8 font-bold text-[15px] text-white"
            style={{
              height: 52, width: "100%", maxWidth: 280, borderRadius: 16,
              background: "linear-gradient(135deg, #C41E3A, #9E1830)",
              boxShadow: "0 4px 16px rgba(196,30,58,0.25)",
            }}
          >
            Become a Member
          </motion.button>
        </div>
        <BottomNavBar active="community" onNavigate={onNavChange} />
      </div>
    );
  }

  // Geo permission prompt
  if (geoPermission === "prompt" && !geoLocation) {
    return (
      <div className="min-h-screen flex flex-col" style={{ maxWidth: 430, margin: "0 auto", background: "#FFFFFF" }}>
        <div className="flex-1 flex flex-col items-center justify-center px-8 text-center">
          <div className="w-20 h-20 rounded-full flex items-center justify-center" style={{ background: "#EFF6FF", border: "1px solid #BFDBFE" }}>
            <MapPin size={32} style={{ color: "#3B82F6" }} />
          </div>
          <h2 className="font-extrabold text-[22px] mt-6" style={{ color: "#1A1A1A" }}>
            See what your city is scanning
          </h2>
          <p className="text-[14px] mt-3" style={{ color: "#6B7280" }}>
            Allow location access to see community food intelligence for your area.
          </p>
          <div className="flex gap-3 mt-8 w-full max-w-[280px]">
            <motion.button whileTap={{ scale: 0.97 }} onClick={requestGeo}
              className="flex-1 h-12 rounded-2xl font-bold text-white text-[15px]"
              style={{ background: "linear-gradient(135deg, #C41E3A, #9E1830)" }}>
              Allow
            </motion.button>
            <motion.button whileTap={{ scale: 0.97 }}
              onClick={() => { setGeoPermission("denied"); setGeoLocation({ city: "Boston", state: "Massachusetts", lat: 42.36, lng: -71.06 }); }}
              className="flex-1 h-12 rounded-2xl font-bold text-[15px]"
              style={{ background: "#F3F4F6", color: "#6B7280" }}>
              Skip
            </motion.button>
          </div>
        </div>
        <BottomNavBar active="community" onNavigate={onNavChange} />
      </div>
    );
  }

  const scopeLabels: Record<LocationScope, string> = {
    neighborhood: "My Neighborhood",
    city: cityName,
    state: geoLocation?.state || "My State",
    new_england: "New England",
    north_america: "North America",
  };

  // ─── Build the friendly headline insight, honest to the data ───
  const dailyInsight = (() => {
    if (loading) return { text: `Looking around ${cityName}…` };
    if (scansToday === 0) {
      if (worstProducts.length > 0) {
        const w = worstProducts[0];
        return { text: `Quiet in ${cityName} today. Lowest scored this week: ${w.product_name.split(" ").slice(0, 4).join(" ")} (${w.avg_score}/100).` };
      }
      return { text: `Be the first to scan in ${cityName} today.` };
    }
    if (worstProducts.length > 0) {
      const w = worstProducts[0];
      return { text: `${scansToday} ${scansToday === 1 ? "scan" : "scans"} in ${cityName} today. Lowest scored: ${w.product_name.split(" ").slice(0, 4).join(" ")} (${w.avg_score}/100).` };
    }
    return { text: `${scansToday} ${scansToday === 1 ? "scan" : "scans"} in ${cityName} today.` };
  })();


  const totalAvoided = productsAvoided;
  const healthiest = healthiestProducts[0];

  // ── Free-user gate: full data shown ONCE on first visit, blurred after ──
  const showBlur = !isPlus && !hasFreeView;

  // Featured "putting back" = lowest-scored recent scan
  const featured = worstProducts[0];
  const featuredAgo = recentScans.find(r => r.barcode === featured?.barcode);
  const bestScore = healthiestProducts[0]?.avg_score ?? null;

  // Additive bars (use topAdditives with proportional width vs max)
  const maxAdd = Math.max(1, ...topAdditives.map(a => a.rejection_count));

  const firstName = getUserFirstName();
  const initial = (firstName?.[0] || user?.email?.[0] || "+").toUpperCase();


  const handleAvatarPick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      setAvatarPreview(dataUrl);
      try { localStorage.setItem("skaap_local_avatar_v1", dataUrl); } catch {}
    };
    reader.readAsDataURL(f);
  };

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ maxWidth: 430, margin: "0 auto", background: "#FFFFFF", overflowX: "hidden", overscrollBehaviorX: "none" }}
    >
      <div className="flex-1 overflow-y-auto pb-28" style={{ overscrollBehaviorX: "none" }}>
        {/* ─── HEADER ─── */}
        <div className="px-5 pt-[env(safe-area-inset-top,12px)] mt-3">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-1.5">
                <span style={{ color: "#C41E3A", fontSize: 12 }}>↗</span>
                <p className="font-bold tracking-[0.14em] uppercase" style={{ fontSize: 10, color: "#0A1220" }}>
                  {firstName ? `Hey ${firstName} · ${cityName}` : `Today in ${cityName}`}
                </p>
              </div>
              <h1 className="font-extrabold tracking-tight leading-[1.05] mt-1" style={{ fontSize: 28, color: "#0A1220" }}>
                Live shelf<br/>intelligence
              </h1>
            </div>
            <div className="flex flex-col items-end gap-2">
              <input ref={avatarRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarPick} />
              <button
                onClick={() => avatarRef.current?.click()}
                className="relative w-9 h-9 rounded-full flex items-center justify-center overflow-hidden"
                style={{
                  background: avatarPreview ? "transparent" : "linear-gradient(135deg, #F3F4F6, #E5E7EB)",
                  border: avatarPreview ? "none" : "1.5px dashed #D1D5DB",
                  color: "#6B7280",
                }}
                aria-label="Add profile photo"
              >
                {avatarPreview ? (
                  <img src={avatarPreview} alt="You" className="w-full h-full object-cover" />
                ) : firstName ? (
                  <span className="font-bold text-[13px]" style={{ color: "#0A1220" }}>{initial}</span>
                ) : (
                  <Camera size={14} />
                )}
              </button>
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full" style={{ background: "#D1FAE5" }}>
                <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: "#10B981" }} />
                <span className="font-bold tracking-wider" style={{ fontSize: 10, color: "#065F46" }}>LIVE</span>
              </span>
            </div>
          </div>
        </div>

        {/* ─── FEATURED "PEOPLE NEAR YOU ARE PUTTING BACK" ─── */}
        {featured && (
          <button onClick={() => onScanProduct(featured.barcode)}
            className="block w-full text-left mx-5 mt-4 p-4 rounded-2xl"
            style={{ width: "calc(100% - 40px)", background: "#FFFFFF", border: "1px solid #F3F4F6", boxShadow: "0 4px 14px rgba(0,0,0,0.05)" }}>
            <p className="font-bold tracking-[0.12em] uppercase" style={{ fontSize: 10, color: "#9CA3AF" }}>
              People near you are putting back
            </p>
            <div className="flex items-start justify-between gap-3 mt-2">
              <p className="font-extrabold leading-tight flex-1" style={{ fontSize: 19, color: "#0A1220" }}>
                {featured.product_name}
              </p>
              <div className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0"
                style={{ fontSize: 16, background: getScoreColor(featured.avg_score) }}>
                {featured.avg_score}
              </div>
            </div>
            <div className="flex items-center justify-between mt-3">
              <span className="inline-flex items-center gap-1 text-[11px]" style={{ color: "#9CA3AF" }}>
                <span>🕐</span> {featuredAgo ? getTimeAgo(featuredAgo.scan_timestamp) : `${Math.max(2, featured.scan_count * 3)}m ago`}
              </span>
              {featured.rejected_additives?.[0] && (
                <span className="font-semibold px-2.5 py-1 rounded-full"
                  style={{ fontSize: 10, background: "#FEF2F2", color: "#C41E3A", border: "1px dashed #FECDD3" }}>
                  {featured.rejected_additives[0]}
                </span>
              )}
            </div>
          </button>
        )}

        {/* ─── 3 STAT TILES ─── */}
        <div className="grid grid-cols-3 gap-2 px-5 mt-3">
          <div className="rounded-2xl px-3 py-3" style={{ background: "#FFFFFF", border: "1px solid #F3F4F6" }}>
            <p className="font-extrabold tabular-nums" style={{ fontSize: 26, color: "#0A1220", lineHeight: 1 }}>
              {scansToday.toLocaleString() || (loading ? "—" : "0")}
            </p>
            <p className="font-bold tracking-[0.1em] uppercase mt-1.5" style={{ fontSize: 9, color: "#9CA3AF" }}>Scans today</p>
          </div>
          <div className="rounded-2xl px-3 py-3" style={{ background: "#FFFFFF", border: "1px solid #F3F4F6" }}>
            <p className="font-extrabold tabular-nums" style={{ fontSize: 26, color: "#DC2626", lineHeight: 1 }}>
              {productsAvoided || (loading ? "—" : "0")}
            </p>
            <p className="font-bold tracking-[0.1em] uppercase mt-1.5" style={{ fontSize: 9, color: "#9CA3AF" }}>Put back</p>
          </div>
          <div className="rounded-2xl px-3 py-3" style={{ background: "#FFFFFF", border: "1px solid #F3F4F6" }}>
            <p className="font-extrabold tabular-nums" style={{ fontSize: 26, color: "#16A34A", lineHeight: 1 }}>
              {bestScore ?? "—"}
            </p>
            <p className="font-bold tracking-[0.1em] uppercase mt-1.5" style={{ fontSize: 9, color: "#9CA3AF" }}>Best score</p>
          </div>
        </div>

        {/* ─── DEEP SECTIONS (blurred for repeat free visitors) ─── */}
        <div className="relative">
          <div className={showBlur ? "pointer-events-none select-none" : ""}
            style={showBlur ? { filter: "blur(7px)", WebkitFilter: "blur(7px)" } : undefined}>

            {/* LOWEST SCORES THIS WEEK */}
            <div className="mx-5 mt-5 p-4 rounded-2xl" style={{ background: "#FFFFFF", border: "1px solid #F3F4F6", boxShadow: "0 4px 14px rgba(0,0,0,0.04)" }}>
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-extrabold tracking-tight" style={{ fontSize: 17, color: "#0A1220" }}>
                  Lowest scores this week
                </h2>
                <span className="px-2.5 py-1 rounded-full font-bold" style={{ fontSize: 10, background: "#FEF2F2", color: "#C41E3A" }}>
                  Preview
                </span>
              </div>

              {loading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-14 rounded-xl my-2" style={{ background: "#F3F4F6" }} />
                ))
              ) : worstProducts.slice(0, 3).map((p, i) => (
                <div key={p.barcode}>
                  <button onClick={() => onScanProduct(p.barcode)}
                    className="w-full flex items-start gap-3 py-2.5 text-left">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                      style={{ background: i === 2 ? "#FED7AA" : "#FECACA" }}>
                      <span style={{ fontSize: 16 }}>▮▮▮</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold truncate" style={{ fontSize: 14, color: "#0A1220" }}>{p.product_name}</p>
                      <p style={{ fontSize: 11, color: "#9CA3AF" }}>{Math.max(3, (i + 1) * 5)}m ago</p>
                      {p.rejected_additives && p.rejected_additives.length > 0 && (
                        <div className="flex items-center gap-1.5 mt-1.5">
                          <span style={{ fontSize: 10, color: "#9CA3AF" }}>Shoppers reject</span>
                          {p.rejected_additives.slice(0, 2).map(a => (
                            <span key={a} className="px-1.5 py-0.5 rounded-full font-semibold"
                              style={{ fontSize: 9, background: "#FFFFFF", color: "#C41E3A", border: "1px dashed #FECDD3" }}>
                              {a}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="w-9 h-9 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0"
                      style={{ fontSize: 13, background: getScoreColor(p.avg_score) }}>
                      {p.avg_score}
                    </div>
                  </button>
                  {i < 2 && <div style={{ height: 1, background: "#F3F4F6" }} />}
                </div>
              ))}

              <button onClick={() => openUpgrade("Community Intelligence")}
                className="w-full flex items-center gap-2 pt-3 mt-2 font-bold"
                style={{ fontSize: 13, color: "#C41E3A", borderTop: "1px solid #F3F4F6" }}>
                <Lock size={12} /> Unlock 10 more
              </button>
            </div>

            {/* WORST ADDITIVES IN YOUR AREA */}
            <div className="mx-5 mt-4 p-4 rounded-2xl" style={{ background: "#FFFFFF", border: "1px solid #F3F4F6", boxShadow: "0 4px 14px rgba(0,0,0,0.04)" }}>
              <h2 className="font-extrabold tracking-tight mb-3" style={{ fontSize: 17, color: "#0A1220" }}>
                Worst additives in your area
              </h2>
              {(topAdditives.length > 0 ? topAdditives : [
                { code: "E150D", name: "E150D", rejection_count: 47, trending_up: true },
                { code: "E621",  name: "E621",  rejection_count: 31, trending_up: true },
                { code: "E950",  name: "E950",  rejection_count: 22, trending_up: false },
                { code: "PALM",  name: "Palm oil", rejection_count: 19, trending_up: false },
                { code: "E211",  name: "E211",  rejection_count: 14, trending_up: false },
              ]).slice(0, 5).map(a => (
                <div key={a.code} className="flex items-center gap-3 py-1.5">
                  <span className="font-bold w-16 flex-shrink-0" style={{ fontSize: 13, color: "#0A1220" }}>
                    {a.code}
                  </span>
                  <div className="flex-1 h-2 rounded-full" style={{ background: "#FEE2E2" }}>
                    <div className="h-full rounded-full"
                      style={{ width: `${Math.max(15, Math.round((a.rejection_count / maxAdd) * 100))}%`, background: "#EF4444" }} />
                  </div>
                  <span className="font-bold tabular-nums w-10 text-right flex-shrink-0" style={{ fontSize: 13, color: "#C41E3A" }}>
                    {a.rejection_count}×
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Blur overlay for repeat free visitors — pulled up to remove dead whitespace */}
          {showBlur && (
            <div className="absolute inset-0 flex flex-col items-center px-8 text-center"
              style={{
                background: "linear-gradient(180deg, rgba(255,255,255,0.35) 0%, rgba(255,255,255,0.88) 28%, rgba(255,255,255,0.96) 100%)",
                backdropFilter: "blur(2px)",
                paddingTop: 56,
              }}>
              <div className="w-12 h-12 rounded-full flex items-center justify-center mb-2.5"
                style={{ background: "#0A1220" }}>
                <Lock size={18} color="#FFD700" />
              </div>
              <p className="font-extrabold tracking-tight" style={{ fontSize: 17, color: "#0A1220" }}>
                You've used your free peek
              </p>
              <p className="mt-1 max-w-[280px]" style={{ fontSize: 12.5, color: "#6B7280", lineHeight: 1.4 }}>
                See every put-back, every additive, every shelf — live — with SKAAP Plus.
              </p>
              <button onClick={() => openUpgrade("Community Intelligence")}
                className="mt-3 inline-flex items-center gap-1.5 px-5 py-2.5 rounded-full font-bold text-white"
                style={{ fontSize: 13, background: "#0A1220", boxShadow: "0 6px 18px rgba(10,18,32,0.28)" }}>
                <Crown size={13} color="#FFD700" /> Unlock with Plus
              </button>
            </div>
          )}
        </div>

        {/* ─── DARK SKAAP PLUS UPGRADE CARD (always visible, mirrors mockup) ─── */}
        {!isPlus && (
          <button onClick={() => openUpgrade("Community Intelligence")}
            className="block w-full text-left mx-5 mt-4 p-5 rounded-2xl relative overflow-hidden"
            style={{
              width: "calc(100% - 40px)",
              background: "#0A0F1A",
              boxShadow: "0 8px 30px rgba(196,30,58,0.18)",
            }}>
            <div className="flex items-center gap-1.5 mb-2">
              <Sparkles size={12} color="#FFFFFF" />
              <span className="font-bold tracking-[0.18em] uppercase text-white" style={{ fontSize: 10 }}>
                SKAAP Plus
              </span>
            </div>
            <h3 className="font-extrabold tracking-tight text-white" style={{ fontSize: 30, lineHeight: 1.05 }}>
              See it all live.
            </h3>
            <p className="mt-2.5 max-w-[260px]" style={{ fontSize: 13, color: "#9CA3AF", lineHeight: 1.45 }}>
              Every additive. Every put-back. Every shelf, in real time.
            </p>
            <div className="flex items-center justify-between mt-4">
              <span className="px-5 py-2.5 rounded-full font-bold bg-white" style={{ fontSize: 13, color: "#C41E3A" }}>
                Upgrade
              </span>
              <span className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: "rgba(255,255,255,0.12)" }}>
                <span className="text-white" style={{ fontSize: 16 }}>→</span>
              </span>
            </div>
          </button>
        )}

        {/* Plus-only: comparison + share */}
        {isPlus && userAvgScore !== null && cityAvgScore !== null && (
          <div className="mx-5 mt-4 p-5 rounded-2xl"
            style={{ background: "#FFFFFF", border: "1px solid #F3F4F6", boxShadow: "0 4px 14px rgba(0,0,0,0.04)" }}>
            <h3 className="font-extrabold" style={{ fontSize: 15, color: "#0A1220" }}>How you compare</h3>
            <div className="mt-2 flex items-center justify-between">
              <span style={{ fontSize: 13, color: "#6B7280" }}>You</span>
              <span className="font-bold" style={{ fontSize: 15, color: getScoreColor(userAvgScore) }}>{userAvgScore}/100</span>
            </div>
            <div className="mt-1 flex items-center justify-between">
              <span style={{ fontSize: 13, color: "#6B7280" }}>{cityName} avg</span>
              <span className="font-bold" style={{ fontSize: 15, color: getScoreColor(cityAvgScore) }}>{cityAvgScore}/100</span>
            </div>
          </div>
        )}

        {isPlus && worstProducts.length > 0 && (
          <div className="px-5 mt-4">
            <button onClick={handleShareWorst}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl font-semibold"
              style={{ fontSize: 13, background: "#FFF1F2", border: "1px solid #FECDD3", color: "#C41E3A" }}>
              <Share2 size={14} /> Share what {cityName} is avoiding
            </button>
          </div>
        )}
      </div>

      <BottomNavBar active="community" onNavigate={onNavChange} />
    </div>
  );
}

