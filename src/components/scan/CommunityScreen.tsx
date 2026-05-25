import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MapPin, Scan, Shield, AlertTriangle, ChevronDown, TrendingUp, Share2, Lock, Globe, Activity, Sparkles, Heart, Download } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { useSubscription } from "@/context/SubscriptionContext";
import { BottomNavBar } from "./BottomNavBar";
import { Skeleton } from "@/components/ui/skeleton";
import { getScoreColor } from "@/lib/skaapScore";
import skaapIcon from "@/assets/skaap-icon.png";

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
  { barcode: "3017620422003", product_name: "Nutella Hazelnut Spread", brand: "Ferrero", image_url: "https://images.openfoodfacts.org/images/products/301/762/042/2003/front_en.400.jpg", avg_score: 22, scan_count: 14 },
  { barcode: "5449000000996", product_name: "Coca-Cola Classic", brand: "Coca-Cola", image_url: "https://images.openfoodfacts.org/images/products/544/900/000/0996/front_en.400.jpg", avg_score: 18, scan_count: 22 },
  { barcode: "0028400064057", product_name: "Doritos Nacho Cheese", brand: "Doritos", image_url: "https://images.openfoodfacts.org/images/products/002/840/006/4057/front_en.400.jpg", avg_score: 28, scan_count: 11 },
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
      // Scans today
      const { count: todayCount } = await supabase
        .from("community_scans")
        .select("*", { count: "exact", head: true })
        .eq("city", city)
        .gte("scan_timestamp", todayStart.toISOString());
      setScansToday(todayCount || 0);

      // Products avoided today
      const { count: avoidedCount } = await supabase
        .from("community_scans")
        .select("*", { count: "exact", head: true })
        .eq("city", city)
        .eq("saved", false)
        .lt("score", 50)
        .gte("scan_timestamp", todayStart.toISOString());
      setProductsAvoided(avoidedCount || 0);

      // Worst products this week
      const { data: weekScans } = await supabase
        .from("community_scans")
        .select("barcode, product_name, brand, image_url, score")
        .eq("city", city)
        .gte("scan_timestamp", weekAgo)
        .not("score", "is", null)
        .order("scan_timestamp", { ascending: false })
        .limit(500);

      if (weekScans && weekScans.length > 0) {
        // Aggregate by barcode
        const productMap = new Map<string, { product_name: string; brand: string | null; image_url: string | null; scores: number[]; count: number }>();
        for (const s of weekScans) {
          const existing = productMap.get(s.barcode);
          if (existing) {
            if (s.score != null) existing.scores.push(s.score);
            existing.count++;
          } else {
            productMap.set(s.barcode, {
              product_name: s.product_name,
              brand: s.brand,
              image_url: s.image_url,
              scores: s.score != null ? [s.score] : [],
              count: 1,
            });
          }
        }

        const products = Array.from(productMap.entries()).map(([barcode, p]) => ({
          barcode,
          product_name: p.product_name,
          brand: p.brand,
          image_url: p.image_url,
          avg_score: p.scores.length ? Math.round(p.scores.reduce((a, b) => a + b, 0) / p.scores.length) : 50,
          scan_count: p.count,
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
    }, 30_000);

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

  return (
    <div className="min-h-screen flex flex-col" style={{ maxWidth: 430, margin: "0 auto", background: "#FFFFFF" }}>
      <div className="flex-1 overflow-y-auto pb-28">
        {/* Header */}
        <div className="px-5 pt-[env(safe-area-inset-top,12px)] mt-3">
          <h1 className="font-extrabold text-[26px] tracking-tight" style={{ color: "#1A1A1A" }}>
            What people are eating
          </h1>
          <div className="flex items-center gap-1.5 mt-1">
            <MapPin size={12} style={{ color: "#C41E3A" }} />
            <p className="text-[13px] font-medium" style={{ color: "#6B7280" }}>{cityName}</p>
            {!isPlus && (
              <span className="ml-auto text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: "#FEF2F2", color: "#C41E3A" }}>
                Free preview
              </span>
            )}
          </div>
        </div>

        {/* HERO INSIGHT, single plain-language sentence */}
        <div className="mx-5 mt-5 p-5 rounded-[20px]"
          style={{ background: "#FFFFFF", border: "1px solid #F3F4F6", boxShadow: "0 4px 16px rgba(0,0,0,0.04)" }}>
          <div className="flex items-center gap-1.5">
            <Activity size={14} style={{ color: "#C41E3A" }} />
            <span className="text-[10px] font-bold tracking-[0.12em] uppercase" style={{ color: "#C41E3A" }}>Today in {cityName}</span>
          </div>
          <p className="font-extrabold text-[17px] mt-2 leading-snug" style={{ color: "#0A1220" }}>
            {dailyInsight.text}
          </p>
          <p className="text-[12px] mt-2" style={{ color: "#6B7280" }}>
            Updates with every new scan nearby.
          </p>
        </div>

        {/* THREE SIMPLE STATS */}
        <div className="grid grid-cols-3 gap-2 px-5 mt-4">
          {[
            { label: "Scans today", value: scansToday },
            { label: "Low scores", value: totalAvoided },
            { label: "Top score", value: healthiest ? healthiest.avg_score : "—" },
          ].map((s, i) => (
            <div key={i} className="rounded-2xl py-3 text-center"
              style={{ background: "#F9FAFB", border: "1px solid #F3F4F6" }}>
              <p className="font-extrabold text-[20px]" style={{ color: "#0A1220" }}>
                {typeof s.value === "number" ? s.value.toLocaleString() : s.value}
              </p>
              <p className="text-[10px] font-medium mt-0.5" style={{ color: "#6B7280" }}>{s.label}</p>
            </div>
          ))}
        </div>

        {/* TWO SIMPLE LISTS, Avoid + Try Instead */}
        <div className="px-5 mt-6">
          <h2 className="font-extrabold text-[17px] flex items-center gap-2" style={{ color: "#0A1220" }}>
            <AlertTriangle size={15} style={{ color: "#C41E3A" }} /> Lowest scored this week
          </h2>
          <p className="text-[12px] mt-0.5" style={{ color: "#6B7280" }}>Scores only. You choose.</p>

          <div className="mt-3 space-y-2">
            {loading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-16 rounded-2xl" style={{ background: "#F3F4F6" }} />
              ))
            ) : worstProducts.length === 0 ? (
              <div className="text-center py-6 rounded-2xl" style={{ background: "#F9FAFB" }}>
                <p className="text-[13px]" style={{ color: "#9CA3AF" }}>Nothing yet. Be the first to scan!</p>
              </div>
            ) : (
              worstProducts.slice(0, isPlus ? 5 : 2).map(p => (
                <button key={p.barcode} onClick={() => onScanProduct(p.barcode)}
                  className="w-full flex items-center gap-3 p-3 rounded-2xl text-left"
                  style={{ background: "#FFFFFF", border: "1px solid #F3F4F6" }}>
                  <div className="w-12 h-12 rounded-xl overflow-hidden flex-shrink-0 flex items-center justify-center" style={{ background: "#F3F4F6" }}>
                    {p.image_url ? <img src={p.image_url} alt={p.product_name} className="w-full h-full object-contain p-0.5" loading="lazy" decoding="async" onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }} /> : <Scan size={14} style={{ color: "#D1D5DB" }} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-semibold truncate" style={{ color: "#1A1A1A" }}>{p.product_name}</p>
                    {p.brand && <p className="text-[11px] truncate" style={{ color: "#9CA3AF" }}>{p.brand}</p>}
                  </div>
                  <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 text-white font-bold text-[14px]"
                    style={{ background: getScoreColor(p.avg_score) }}>{p.avg_score}</div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* MOST SCANNED, split by category so food + beauty both feel represented */}
        <div className="px-5 mt-6">
          <h2 className="font-extrabold text-[17px] flex items-center gap-2" style={{ color: "#0A1220" }}>
            <TrendingUp size={15} style={{ color: "#0A1220" }} /> Most scanned near you
          </h2>
          <p className="text-[12px] mt-0.5" style={{ color: "#6B7280" }}>
            What real shoppers are checking right now. Food and beauty, side by side.
          </p>

          {(["food", "beauty"] as const).map(cat => {
            const items = mostScanned.filter(p => {
              const isBeauty = (p.image_url || "").includes("openbeautyfacts");
              return cat === "beauty" ? isBeauty : !isBeauty;
            }).slice(0, isPlus ? 5 : 2);
            if (items.length === 0) return null;
            return (
              <div key={cat} className="mt-4">
                <p className="text-[11px] font-bold uppercase tracking-wider mb-2" style={{ color: "#9CA3AF" }}>
                  {cat === "food" ? "🥫 Food" : "💄 Beauty"}
                </p>
                <div className="space-y-2">
                  {items.map(p => (
                    <button key={p.barcode} onClick={() => onScanProduct(p.barcode)}
                      className="w-full flex items-center gap-3 p-3 rounded-2xl text-left"
                      style={{ background: "#FFFFFF", border: "1px solid #F3F4F6" }}>
                      <div className="w-12 h-12 rounded-xl overflow-hidden flex-shrink-0 flex items-center justify-center" style={{ background: "#F3F4F6" }}>
                        {p.image_url ? (
                          <img src={p.image_url} alt={p.product_name} className="w-full h-full object-contain p-0.5"
                            loading="lazy" decoding="async"
                            onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }} />
                        ) : <Scan size={14} style={{ color: "#D1D5DB" }} />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-semibold truncate" style={{ color: "#1A1A1A" }}>{p.product_name}</p>
                        <p className="text-[11px] truncate" style={{ color: "#9CA3AF" }}>
                          {p.brand ? `${p.brand} · ` : ""}{p.scan_count} {p.scan_count === 1 ? "scan" : "scans"}
                        </p>
                      </div>
                      <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 text-white font-bold text-[14px]"
                        style={{ background: getScoreColor(p.avg_score) }}>{p.avg_score}</div>
                    </button>
                  ))}
                </div>
              </div>
            );
          })}

          {!isPlus && mostScanned.length > 4 && (
            <p className="text-[11px] mt-3 text-center" style={{ color: "#9CA3AF" }}>
              + {mostScanned.length - 4} more on Plus
            </p>
          )}
        </div>

        {/* Plus teaser for free users, single clear gate */}
        {!isPlus && (
          <div className="mx-5 mt-7 p-5 rounded-2xl text-center"
            style={{ background: "linear-gradient(135deg, #FFF1F2, #FEE2E2)", border: "1px solid #FECDD3" }}>
            <Lock size={18} style={{ color: "#C41E3A" }} className="mx-auto" />
            <p className="font-extrabold text-[15px] mt-2" style={{ color: "#7F1D1D" }}>
              Preview only
            </p>
            <p className="text-[12px] mt-1" style={{ color: "#9F1239" }}>
              See it all live.
            </p>
            <motion.button whileTap={{ scale: 0.97 }} onClick={() => openUpgrade("Community Intelligence")}
              className="mt-3 w-full py-2.5 rounded-xl font-bold text-[13px] text-white"
              style={{ background: "linear-gradient(135deg, #C41E3A, #9E1830)" }}>
              Unlock, pay what you want
            </motion.button>
          </div>
        )}

        {/* Plus members get the deeper sections */}
        {isPlus && (
          <>
            <div className="px-5 mt-7">
              <h2 className="font-extrabold text-[17px] flex items-center gap-2" style={{ color: "#0A1220" }}>
                <Shield size={15} style={{ color: "#C41E3A" }} /> Stuff your area is avoiding
              </h2>
              <p className="text-[12px] mt-0.5" style={{ color: "#6B7280" }}>
                The ingredients people in {cityName} are saying no to
              </p>
              <div className="mt-3 space-y-1.5">
                {topAdditives.length === 0 ? (
                  <p className="text-[12px] py-3 text-center" style={{ color: "#9CA3AF" }}>Not enough data yet</p>
                ) : (
                  topAdditives.slice(0, 5).map(a => (
                    <div key={a.code}>
                      <button onClick={() => handleAdditiveExpand(a)}
                        className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left"
                        style={{ background: "#FFFFFF", border: "1px solid #F3F4F6" }}>
                        <span className="px-2 py-1 rounded-lg text-[11px] font-bold flex-shrink-0"
                          style={{ background: "#FFF1F2", color: "#C41E3A" }}>{a.code}</span>
                        <p className="text-[13px] font-semibold truncate flex-1" style={{ color: "#1A1A1A" }}>{a.name}</p>
                        <span className="text-[11px]" style={{ color: "#9CA3AF" }}>{a.rejection_count}×</span>
                      </button>
                      {expandedAdditive === a.code && (
                        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}
                          className="px-4 py-3 mx-2 rounded-b-xl text-[12px] leading-relaxed"
                          style={{ background: "#FAFAFA", color: "#4B5563" }}>
                          {additiveLoading ? "Loading…" : <p>{additiveExplanation}</p>}
                        </motion.div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>

            {userAvgScore !== null && cityAvgScore !== null && (
              <div className="mx-5 mt-7 p-5 rounded-[20px]"
                style={{ background: "#FFFFFF", border: "1px solid #F3F4F6", boxShadow: "0 4px 16px rgba(0,0,0,0.04)" }}>
                <h3 className="font-extrabold text-[16px]" style={{ color: "#0A1220" }}>How you compare</h3>
                <div className="mt-3 flex items-center justify-between">
                  <span className="text-[13px]" style={{ color: "#6B7280" }}>You</span>
                  <span className="font-bold text-[15px]" style={{ color: getScoreColor(userAvgScore) }}>{userAvgScore}/100</span>
                </div>
                <div className="mt-1 flex items-center justify-between">
                  <span className="text-[13px]" style={{ color: "#6B7280" }}>{cityName} avg</span>
                  <span className="font-bold text-[15px]" style={{ color: getScoreColor(cityAvgScore) }}>{cityAvgScore}/100</span>
                </div>
                <p className="text-[12px] mt-3" style={{ color: userAvgScore > cityAvgScore ? "#16A34A" : "#F59E0B" }}>
                  {userAvgScore > cityAvgScore
                    ? `You eat better than the ${cityName} average. Keep it up.`
                    : `You're close to the ${cityName} average. A few smart swaps and you'll pull ahead.`}
                </p>
              </div>
            )}

            {worstProducts.length > 0 && (
              <div className="px-5 mt-5">
                <button onClick={handleShareWorst}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl font-semibold text-[13px]"
                  style={{ background: "#FFF1F2", border: "1px solid #FECDD3", color: "#C41E3A" }}>
                  <Share2 size={14} /> Share what {cityName} is avoiding
                </button>
              </div>
            )}
          </>
        )}
      </div>

      <BottomNavBar active="community" onNavigate={onNavChange} />
    </div>
  );
}
