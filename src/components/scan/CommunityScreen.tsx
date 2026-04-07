import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MapPin, Scan, Shield, AlertTriangle, ChevronDown, TrendingUp, Share2, Lock, Globe, Activity, Sparkles } from "lucide-react";
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

  const canAccess = isPlus || hasFreeView;

  const [geoLocation, setGeoLocation] = useState<GeoLocation | null>(null);
  const [locationScope, setLocationScope] = useState<LocationScope>("city");
  const [locationDropdownOpen, setLocationDropdownOpen] = useState(false);
  const [geoPermission, setGeoPermission] = useState<"prompt" | "granted" | "denied">("prompt");
  const [loading, setLoading] = useState(true);

  // Data
  const [scansToday, setScansToday] = useState(0);
  const [productsAvoided, setProductsAvoided] = useState(0);
  const [topConcern, setTopConcern] = useState<string>("—");
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

  const channelRef = useRef<any>(null);

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

        // Worst 5
        setWorstProducts([...products].sort((a, b) => a.avg_score - b.avg_score).slice(0, 5));
        // Most scanned 8
        setMostScanned([...products].sort((a, b) => b.scan_count - a.scan_count).slice(0, 8));

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

      // Recent scans (live feed) — last 20 scans in city
      const { data: recentData } = await supabase
        .from("community_scans")
        .select("id, product_name, brand, image_url, score, city, scan_timestamp, barcode")
        .eq("city", city)
        .order("scan_timestamp", { ascending: false })
        .limit(20);

      if (recentData) {
        setRecentScans(recentData);
      }
    } catch (err) {
      console.error("Community fetch error:", err);
    }
    setLoading(false);
  }, [geoLocation, user]);

  useEffect(() => {
    if (canAccess) fetchData();
  }, [fetchData, canAccess]);

  // Real-time subscription
  useEffect(() => {
    if (!geoLocation?.city || !canAccess) return;

    const cityFilter = `city=eq.${geoLocation.city}`;
    const channelName = `community-live:${geoLocation.city
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")}`;

    const channel = supabase
      .channel(channelName)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "community_scans", filter: cityFilter },
        (payload: any) => {
          if (payload.new?.city !== geoLocation.city) return;

          setScansToday(prev => prev + 1);
          if (!payload.new.saved && payload.new.score < 50) {
            setProductsAvoided(prev => prev + 1);
          }

          // Add to live feed
          const newScan: LiveScanItem = {
            id: payload.new.id,
            product_name: payload.new.product_name,
            brand: payload.new.brand,
            image_url: payload.new.image_url,
            score: payload.new.score,
            city: payload.new.city,
            scan_timestamp: payload.new.scan_timestamp,
            barcode: payload.new.barcode,
          };
          setRecentScans(prev => [newScan, ...prev].slice(0, 20));
        }
      )
      .subscribe();

    channelRef.current = channel;
    return () => { supabase.removeChannel(channel); };
  }, [geoLocation?.city, canAccess]);

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
            See what your city is scanning, avoiding, and concerned about — in real time.
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
            See what your city is scanning 📍
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

  return (
    <div className="min-h-screen flex flex-col" style={{ maxWidth: 430, margin: "0 auto", background: "#FFFFFF" }}>
      <div className="flex-1 overflow-y-auto pb-28">
        {/* Header */}
        <div className="px-5 pt-[env(safe-area-inset-top,12px)] mt-3">
          <div className="flex items-center justify-between">
            <h1 className="font-extrabold text-[24px]" style={{ color: "#1A1A1A" }}>Community</h1>
            {!isPlus && hasFreeView && (
              <span className="text-[10px] font-bold px-2 py-1 rounded-full" style={{ background: "#FEF2F2", color: "#C41E3A" }}>
                Free Preview
              </span>
            )}
          </div>

          {/* Location selector */}
          <div className="relative mt-3">
            <button
              onClick={() => setLocationDropdownOpen(!locationDropdownOpen)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-2xl text-[14px] font-semibold"
              style={{ background: "#F3F4F6", color: "#1A1A1A", border: "1px solid #E5E7EB" }}
            >
              <MapPin size={14} style={{ color: "#C41E3A" }} />
              {scopeLabels[locationScope]}
              <ChevronDown size={14} style={{ color: "#9CA3AF" }} />
            </button>
            {locationDropdownOpen && (
              <motion.div
                initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
                className="absolute top-full left-0 mt-2 rounded-2xl py-2 z-50 shadow-lg"
                style={{ background: "#FFFFFF", border: "1px solid #E5E7EB", minWidth: 200 }}
              >
                {(Object.keys(scopeLabels) as LocationScope[]).map(scope => (
                  <button
                    key={scope}
                    onClick={() => { setLocationScope(scope); setLocationDropdownOpen(false); }}
                    className="w-full text-left px-4 py-2.5 text-[14px] font-medium hover:bg-gray-50"
                    style={{ color: locationScope === scope ? "#C41E3A" : "#1A1A1A" }}
                  >
                    {scopeLabels[scope]}
                  </button>
                ))}
              </motion.div>
            )}
          </div>
        </div>

        {/* SECTION 1 — Live Stats */}
        <div className="flex gap-3 px-5 mt-5">
          {[
            { label: `scans today in ${cityName}`, value: scansToday, icon: <Scan size={18} style={{ color: "#C41E3A" }} />, color: "#C41E3A" },
            { label: "products avoided", value: productsAvoided, icon: <Shield size={18} style={{ color: "#22C55E" }} />, color: "#22C55E" },
            { label: "top concern", value: topConcern, icon: <AlertTriangle size={18} style={{ color: "#F59E0B" }} />, color: "#F59E0B" },
          ].map((stat, i) => (
            <div
              key={i}
              className="flex-1 flex flex-col items-center justify-center rounded-2xl px-2 py-3 text-center"
              style={{ height: 72, background: "#FFFFFF", border: "1px solid #F3F4F6", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}
            >
              {stat.icon}
              <span className="font-extrabold text-[18px] mt-1" style={{ color: stat.color }}>
                {typeof stat.value === "number" ? stat.value.toLocaleString() : stat.value}
              </span>
              <span className="text-[9px] font-medium leading-tight mt-0.5" style={{ color: "#9CA3AF" }}>
                {stat.label}
              </span>
            </div>
          ))}
        </div>

        {/* SECTION 1.5 — Live Scan Feed */}
        <div className="px-5 mt-6">
          <div className="flex items-center gap-2 mb-3">
            <div className="relative flex items-center justify-center">
              <Activity size={16} style={{ color: "#C41E3A" }} />
              <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full animate-pulse" style={{ background: "#22C55E" }} />
            </div>
            <h2 className="font-extrabold text-[18px]" style={{ color: "#1A1A1A" }}>Live Feed</h2>
            <span className="text-[11px] font-medium px-2 py-0.5 rounded-full" style={{ background: "#F0FDF4", color: "#22C55E" }}>
              Real-time
            </span>
          </div>

          <div className="space-y-2 max-h-[280px] overflow-y-auto rounded-2xl" style={{ scrollbarWidth: "none" }}>
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3 p-3 rounded-xl" style={{ background: "#F9FAFB" }}>
                  <Skeleton className="w-10 h-10 rounded-lg" style={{ background: "#E5E7EB" }} />
                  <div className="flex-1 space-y-1.5">
                    <Skeleton className="h-3 w-3/4" style={{ background: "#E5E7EB" }} />
                    <Skeleton className="h-2 w-1/2" style={{ background: "#E5E7EB" }} />
                  </div>
                </div>
              ))
            ) : recentScans.length === 0 ? (
              <div className="text-center py-8 rounded-2xl" style={{ background: "#F9FAFB", border: "1px solid #F3F4F6" }}>
                <Sparkles size={24} style={{ color: "#D1D5DB" }} className="mx-auto" />
                <p className="text-[13px] font-medium mt-2" style={{ color: "#9CA3AF" }}>
                  No scans yet today — be the first in {cityName}!
                </p>
              </div>
            ) : (
              <AnimatePresence initial={false}>
                {recentScans.slice(0, 10).map((scan, i) => {
                  const timeAgo = getTimeAgo(scan.scan_timestamp);
                  const scoreColor = scan.score != null ? getScoreColor(scan.score) : "#D1D5DB";
                  return (
                    <motion.button
                      key={scan.id}
                      initial={{ opacity: 0, x: -20, height: 0 }}
                      animate={{ opacity: 1, x: 0, height: "auto" }}
                      exit={{ opacity: 0, x: 20 }}
                      transition={{ type: "spring", stiffness: 300, damping: 30 }}
                      onClick={() => onScanProduct(scan.barcode)}
                      className="w-full flex items-center gap-3 p-3 rounded-xl text-left"
                      style={{ background: i === 0 ? "#FFFBEB" : "#FFFFFF", border: `1px solid ${i === 0 ? "#FEF3C7" : "#F3F4F6"}` }}
                    >
                      <div className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0" style={{ background: "#F3F4F6" }}>
                        {scan.image_url ? (
                          <img src={scan.image_url} alt={scan.product_name} className="w-full h-full object-contain p-0.5" loading="lazy" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Scan size={14} style={{ color: "#D1D5DB" }} />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-semibold truncate" style={{ color: "#1A1A1A" }}>
                          {scan.product_name}
                        </p>
                        <div className="flex items-center gap-2 mt-0.5">
                          {scan.brand && (
                            <span className="text-[11px] truncate" style={{ color: "#9CA3AF" }}>{scan.brand}</span>
                          )}
                          <span className="text-[10px]" style={{ color: "#D1D5DB" }}>•</span>
                          <span className="text-[10px] flex-shrink-0" style={{ color: "#9CA3AF" }}>{timeAgo}</span>
                        </div>
                      </div>
                      {scan.score != null && (
                        <div
                          className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
                          style={{ background: scoreColor }}
                        >
                          <span className="font-bold text-[14px] text-white">{scan.score}</span>
                        </div>
                      )}
                    </motion.button>
                  );
                })}
              </AnimatePresence>
            )}
          </div>
        </div>

        <div className="px-5 mt-8">
          <h2 className="font-extrabold text-[20px]" style={{ color: "#1A1A1A" }}>
            Worst in {cityName} Right Now 🚨
          </h2>
          <p className="text-[13px] mt-1" style={{ color: "#6B7280" }}>
            Products your neighbors are putting back
          </p>

          <div className="mt-4 space-y-2">
            {loading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex gap-3 p-4 rounded-2xl" style={{ background: "#F9FAFB", border: "1px solid #F3F4F6" }}>
                  <Skeleton className="w-[52px] h-[52px] rounded-xl" style={{ background: "#E5E7EB" }} />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-3 w-3/4" style={{ background: "#E5E7EB" }} />
                    <Skeleton className="h-3 w-1/2" style={{ background: "#E5E7EB" }} />
                  </div>
                </div>
              ))
            ) : worstProducts.length === 0 ? (
              <div className="text-center py-12 rounded-2xl" style={{ background: "#F9FAFB", border: "1px solid #F3F4F6" }}>
                <Scan size={32} style={{ color: "#D1D5DB" }} className="mx-auto" />
                <p className="text-[14px] font-semibold mt-3" style={{ color: "#1A1A1A" }}>No community data yet</p>
                <p className="text-[12px] mt-1" style={{ color: "#9CA3AF" }}>Be the first to scan in {cityName}!</p>
                <motion.button whileTap={{ scale: 0.97 }} onClick={() => onNavChange("scan")}
                  className="mt-4 px-6 py-3 rounded-2xl font-bold text-sm text-white"
                  style={{ background: "linear-gradient(135deg, #C41E3A, #9E1830)" }}>
                  Start Scanning
                </motion.button>
              </div>
            ) : (
              worstProducts.map((p, i) => (
                <motion.button
                  key={p.barcode}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => onScanProduct(p.barcode)}
                  className="w-full flex items-center gap-3 p-4 text-left rounded-2xl"
                  style={{ background: "#FFFFFF", border: "1px solid #F3F4F6" }}
                >
                  <div className="w-[52px] h-[52px] rounded-xl overflow-hidden flex-shrink-0" style={{ background: "#F3F4F6" }}>
                    {p.image_url ? (
                      <img src={p.image_url} alt={p.product_name} className="w-full h-full object-contain p-1" loading="lazy" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Scan size={16} style={{ color: "#D1D5DB" }} />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[15px] font-semibold truncate" style={{ color: "#1A1A1A" }}>{p.product_name}</p>
                    {p.brand && <p className="text-[13px] truncate" style={{ color: "#6B7280" }}>{p.brand}</p>}
                    <p className="text-[11px]" style={{ color: "#9CA3AF" }}>Scanned {p.scan_count} times this week</p>
                  </div>
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{ background: getScoreColor(p.avg_score) }}
                  >
                    <span className="font-bold text-[18px] text-white">{p.avg_score}</span>
                  </div>
                </motion.button>
              ))
            )}
          </div>

          {worstProducts.length > 0 && (
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={handleShareWorst}
              className="w-full mt-4 flex items-center justify-center gap-2 font-semibold text-[15px]"
              style={{
                height: 48, borderRadius: 14,
                background: "#FFF1F2", border: "1px solid #FECDD3", color: "#C41E3A",
              }}
            >
              <Share2 size={16} />
              Share Worst in {cityName} 🚨
            </motion.button>
          )}
        </div>

        {/* SECTION 3 — Most Scanned */}
        <div className="px-5 mt-8">
          <h2 className="font-extrabold text-[20px]" style={{ color: "#1A1A1A" }}>
            Most Scanned in {cityName} This Week
          </h2>
          <p className="text-[13px] mt-1" style={{ color: "#6B7280" }}>
            What your neighbors are checking
          </p>

          <div className="flex gap-3 mt-4 overflow-x-auto pb-2 -mx-5 px-5" style={{ scrollbarWidth: "none" }}>
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex-shrink-0 w-[150px] h-[110px] rounded-2xl" style={{ background: "#F3F4F6" }}>
                  <Skeleton className="w-full h-full rounded-2xl" style={{ background: "#E5E7EB" }} />
                </div>
              ))
            ) : mostScanned.length === 0 ? (
              <p className="text-[13px]" style={{ color: "#9CA3AF" }}>No data yet — start scanning!</p>
            ) : (
              mostScanned.map(p => (
                <motion.button
                  key={p.barcode}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => onScanProduct(p.barcode)}
                  className="flex-shrink-0 flex flex-col items-center p-3 rounded-2xl text-center"
                  style={{ width: 150, height: 110, background: "#FFFFFF", border: "1px solid #F3F4F6" }}
                >
                  <div className="w-10 h-10 rounded-xl overflow-hidden" style={{ background: "#F3F4F6" }}>
                    {p.image_url ? (
                      <img src={p.image_url} alt={p.product_name} className="w-full h-full object-contain p-0.5" loading="lazy" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Scan size={12} style={{ color: "#D1D5DB" }} />
                      </div>
                    )}
                  </div>
                  <p className="text-[12px] font-semibold mt-1.5 line-clamp-2 leading-tight" style={{ color: "#1A1A1A" }}>
                    {p.product_name}
                  </p>
                  <div className="flex items-center gap-1.5 mt-auto">
                    <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold text-white"
                      style={{ background: getScoreColor(p.avg_score) }}>
                      {p.avg_score}
                    </span>
                    <span className="text-[10px]" style={{ color: "#9CA3AF" }}>{p.scan_count} scans</span>
                  </div>
                </motion.button>
              ))
            )}
          </div>
        </div>

        {/* SECTION 4 — Top Additives */}
        <div className="px-5 mt-8">
          <h2 className="font-extrabold text-[20px]" style={{ color: "#1A1A1A" }}>
            What {cityName} Is Saying No To
          </h2>
          <p className="text-[13px] mt-1" style={{ color: "#6B7280" }}>
            Additives most frequently flagged in your area
          </p>

          <div className="mt-4 space-y-1.5">
            {loading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-14 rounded-xl" style={{ background: "#F3F4F6" }} />
              ))
            ) : topAdditives.length === 0 ? (
              <p className="text-[13px] py-4 text-center" style={{ color: "#9CA3AF" }}>
                No additive data yet
              </p>
            ) : (
              topAdditives.map(a => (
                <div key={a.code}>
                  <button
                    onClick={() => handleAdditiveExpand(a)}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left"
                    style={{ background: "#FFFFFF", border: "1px solid #F3F4F6" }}
                  >
                    <span className="px-2 py-1 rounded-lg text-[12px] font-semibold flex-shrink-0"
                      style={{ background: "#FFF1F2", border: "1px solid #FECDD3", color: "#C41E3A" }}>
                      {a.code}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-[14px] font-semibold truncate" style={{ color: "#1A1A1A" }}>{a.name}</p>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <span className="text-[12px]" style={{ color: "#9CA3AF" }}>{a.rejection_count} rejections</span>
                      {a.trending_up && <TrendingUp size={12} style={{ color: "#C41E3A" }} />}
                    </div>
                  </button>
                  {expandedAdditive === a.code && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}
                      className="px-4 py-3 mx-2 rounded-b-xl text-[13px] leading-relaxed"
                      style={{ background: "#FAFAFA", color: "#4B5563", borderTop: "1px solid #F3F4F6" }}
                    >
                      {additiveLoading ? (
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 border-2 border-gray-300 border-t-gray-500 rounded-full animate-spin" />
                          <span style={{ color: "#9CA3AF" }}>Loading...</span>
                        </div>
                      ) : (
                        <>
                          <p>{additiveExplanation}</p>
                          <p className="text-[10px] mt-2 flex items-center gap-1" style={{ color: "#9CA3AF" }}>
                            ✦ AI · Why {cityName} is avoiding this
                          </p>
                        </>
                      )}
                    </motion.div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* SECTION 5 — Community Rank */}
        {(userAvgScore !== null || cityAvgScore !== null) && (
          <div className="mx-5 mt-8 p-5 rounded-[20px]"
            style={{ background: "#FFFFFF", border: "1px solid #F3F4F6", boxShadow: "0 4px 16px rgba(0,0,0,0.04)" }}>
            <h3 className="font-extrabold text-[18px]" style={{ color: "#1A1A1A" }}>How You Compare</h3>

            {userAvgScore !== null && cityAvgScore !== null && (
              <div className="mt-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[14px]" style={{ color: "#6B7280" }}>Your Kitchen Score</span>
                  <span className="font-bold text-[16px]" style={{ color: getScoreColor(userAvgScore) }}>{userAvgScore}/100</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[14px]" style={{ color: "#6B7280" }}>{cityName} Average</span>
                  <span className="font-bold text-[16px]" style={{ color: getScoreColor(cityAvgScore) }}>{cityAvgScore}/100</span>
                </div>

                {/* Progress bars */}
                <div className="space-y-2 mt-2">
                  <div className="h-2 rounded-full overflow-hidden" style={{ background: "#F3F4F6" }}>
                    <div className="h-full rounded-full transition-all" style={{ width: `${userAvgScore}%`, background: getScoreColor(userAvgScore) }} />
                  </div>
                  <div className="h-2 rounded-full overflow-hidden" style={{ background: "#F3F4F6" }}>
                    <div className="h-full rounded-full transition-all" style={{ width: `${cityAvgScore}%`, background: "#D1D5DB" }} />
                  </div>
                </div>

                {userAvgScore > cityAvgScore ? (
                  <p className="text-[14px] font-medium mt-3" style={{ color: "#22C55E" }}>
                    You eat better than {Math.round(((userAvgScore - cityAvgScore) / cityAvgScore) * 100 + 50)}% of {cityName} SKAAP users 🌿
                  </p>
                ) : (
                  <p className="text-[14px] font-medium mt-3" style={{ color: "#F59E0B" }}>
                    The {cityName} average is {cityAvgScore}/100 — you're close. Keep scanning.
                  </p>
                )}
              </div>
            )}
          </div>
        )}

        {/* Free preview footer */}
        {!isPlus && hasFreeView && (
          <div className="mx-5 mt-8 p-4 rounded-2xl text-center"
            style={{ background: "#FFF1F2", border: "1px solid #FECDD3" }}>
            <p className="text-[13px] font-semibold" style={{ color: "#C41E3A" }}>
              This was your free preview of Community Intelligence
            </p>
            <p className="text-[12px] mt-1" style={{ color: "#6B7280" }}>
              Become a member to unlock ongoing access
            </p>
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={() => openUpgrade("Community Intelligence")}
              className="mt-3 px-6 py-2.5 rounded-xl font-bold text-[14px] text-white"
              style={{ background: "linear-gradient(135deg, #C41E3A, #9E1830)" }}
            >
              Become a Member
            </motion.button>
          </div>
        )}
      </div>

      <BottomNavBar active="community" onNavigate={onNavChange} />
    </div>
  );
}
