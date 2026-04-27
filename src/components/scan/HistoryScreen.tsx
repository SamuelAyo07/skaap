import { useState } from "react";
import { motion } from "framer-motion";
import { Search, X, Barcode, Clock, Lock, Heart } from "lucide-react";
import { getScoreColor } from "@/lib/skaapScore";
import { useSubscription } from "@/context/SubscriptionContext";
import { BottomNavBar } from "./BottomNavBar";
import { HealthSnapshot } from "./HealthSnapshot";
import { ShareRewardsCard } from "./ShareRewardsCard";
import { getUserStats } from "@/lib/skaapUserStats";

interface ScanHistoryItem {
  barcode: string;
  name: string;
  brand?: string;
  image?: string;
  nutriScore?: string;
  skaapScore?: number;
  scannedAt: number;
}

interface HistoryScreenProps {
  history: ScanHistoryItem[];
  onBack: () => void;
  onScanProduct: (barcode: string) => void;
  onClearHistory: () => void;
  activeNav: string;
  onNavChange: (nav: string) => void;
  savedItems?: { barcode: string; name: string; brand?: string; image?: string; skaapScore?: number; scannedAt?: number }[];
}

const FREE_SCAN_LIMIT = 5;

function timeAgo(ts: number): string {
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} min ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} hour${hours > 1 ? "s" : ""} ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days} day${days > 1 ? "s" : ""} ago`;
  const months = Math.floor(days / 30);
  return `${months} month${months > 1 ? "s" : ""} ago`;
}

function getVerdict(score?: number): { label: string; color: string; bg: string } {
  if (score == null) return { label: "Not rated", color: "#9CA3AF", bg: "#F3F4F6" };
  if (score >= 75) return { label: "Excellent", color: "#15803D", bg: "#F0FDF4" };
  if (score >= 50) return { label: "Good", color: "#CA8A04", bg: "#FFFBEB" };
  if (score >= 25) return { label: "Poor", color: "#EA580C", bg: "#FFF7ED" };
  return { label: "Bad", color: "#DC2626", bg: "#FEF2F2" };
}

export function HistoryScreen({
  history, onBack, onScanProduct, onClearHistory, activeNav, onNavChange, savedItems = [],
}: HistoryScreenProps) {
  const { isPlus, openUpgrade } = useSubscription();
  const [tab, setTab] = useState<"history" | "favorites">("history");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");

  const items = tab === "favorites"
    ? savedItems.map(s => ({ barcode: s.barcode, name: s.name, brand: s.brand, image: s.image, skaapScore: s.skaapScore, scannedAt: s.scannedAt || Date.now() }))
    : history;

  const filtered = items.filter(item => {
    const matchSearch = !search ||
      item.name.toLowerCase().includes(search.toLowerCase()) ||
      (item.brand && item.brand.toLowerCase().includes(search.toLowerCase()));
    let matchScore = true;
    if (filter === "excellent") matchScore = (item.skaapScore ?? 0) >= 75;
    if (filter === "good") matchScore = (item.skaapScore ?? 0) >= 50 && (item.skaapScore ?? 0) < 75;
    if (filter === "poor") matchScore = (item.skaapScore ?? 0) < 50;
    return matchSearch && matchScore;
  });

  const visibleItems = isPlus ? filtered : filtered.slice(0, FREE_SCAN_LIMIT);
  const hasGate = !isPlus && filtered.length > FREE_SCAN_LIMIT;

  return (
    <div className="min-h-screen flex flex-col" style={{ maxWidth: 430, margin: "0 auto", background: "#FFFFFF" }}>
      {/* Tabs: Favorites / History */}
      <div className="flex items-center px-5 pt-[env(safe-area-inset-top,12px)] mt-2 gap-0">
        <button
          onClick={() => setTab("favorites")}
          className="flex-1 text-center py-3 font-bold text-[16px] transition-colors"
          style={{
            color: tab === "favorites" ? "#1B2A4A" : "#9CA3AF",
            borderBottom: tab === "favorites" ? "2px solid #C41E3A" : "2px solid transparent",
          }}
        >
          Favorites
        </button>
        <button
          onClick={() => setTab("history")}
          className="flex-1 text-center py-3 font-bold text-[16px] transition-colors"
          style={{
            color: tab === "history" ? "#1B2A4A" : "#9CA3AF",
            borderBottom: tab === "history" ? "2px solid #C41E3A" : "2px solid transparent",
          }}
        >
          History
        </button>
      </div>

      {/* Search */}
      <div className="px-5 mt-3">
        <div className="flex items-center gap-2 px-4 h-11 rounded-2xl" style={{ background: "#F3F4F6", border: "1px solid #E5E7EB" }}>
          <Search size={16} style={{ color: "#9CA3AF" }} />
          <input
            type="text" placeholder="Search products..."
            value={search} onChange={e => setSearch(e.target.value)}
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-gray-400"
            style={{ color: "#1B2A4A" }}
          />
          {search && <button onClick={() => setSearch("")}><X size={14} style={{ color: "#9CA3AF" }} /></button>}
        </div>
      </div>

      {/* Filter pills */}
      <div className="flex gap-2 px-5 mt-3">
        {[
          { key: "all", label: "All" },
          { key: "excellent", label: "Excellent" },
          { key: "good", label: "Good" },
          { key: "poor", label: "Poor" },
        ].map(f => (
          <button key={f.key} onClick={() => setFilter(f.key)}
            className="px-3.5 py-1.5 rounded-full text-[12px] font-semibold transition-all"
            style={{
              background: filter === f.key ? "#C41E3A" : "#F3F4F6",
              color: filter === f.key ? "#fff" : "#6B7280",
              border: `1px solid ${filter === f.key ? "#C41E3A" : "#E5E7EB"}`,
            }}>
            {f.label}
          </button>
        ))}
      </div>

      {/* Health Snapshot */}
      <HealthSnapshot stats={getUserStats()} />

      {/* Share Rewards (relocated from scan home for simplicity) */}
      <div className="px-5 mt-3">
        <ShareRewardsCard onShare={() => onNavChange("scan")} />
      </div>
      {/* List */}
      <div className="flex-1 overflow-y-auto px-5 mt-3 pb-24">
        {visibleItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10">
            {tab === "favorites" ? (
              <>
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: "spring", stiffness: 200, damping: 15 }}
                  className="w-20 h-20 rounded-full flex items-center justify-center"
                  style={{ background: "linear-gradient(135deg, #FEE2E2, #FECACA)" }}
                >
                  <Heart size={32} style={{ color: "#C41E3A" }} />
                </motion.div>
                <p className="text-[17px] font-extrabold mt-5" style={{ color: "#1B2A4A" }}>Save your favorites</p>
                <p className="text-[13px] mt-1.5 max-w-[260px] text-center leading-relaxed" style={{ color: "#6B7280" }}>
                  Tap ♥ on any product to save it here for quick access
                </p>
              </>
            ) : items.length === 0 ? (
              <>
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: "spring", stiffness: 200, damping: 15 }}
                  className="w-20 h-20 rounded-full flex items-center justify-center"
                  style={{ background: "linear-gradient(135deg, #EEF2FF, #DBEAFE)" }}
                >
                  <Barcode size={32} style={{ color: "#4F46E5" }} />
                </motion.div>
                <p className="text-[17px] font-extrabold mt-5" style={{ color: "#1B2A4A" }}>Your scan history is empty</p>
                <p className="text-[13px] mt-1.5 max-w-[260px] text-center leading-relaxed" style={{ color: "#6B7280" }}>
                  Scan any barcode or take a photo to instantly know what's in your food
                </p>
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={() => onNavChange("scan")}
                  className="mt-5 flex items-center gap-2 px-6 py-3 rounded-2xl font-bold text-[14px] text-white"
                  style={{ background: "linear-gradient(135deg, #B01830, #7a1220)" }}
                >
                  <Barcode size={18} color="white" />
                  Scan your first product
                </motion.button>
              </>
            ) : (
              <>
                <div className="w-16 h-16 rounded-full mx-auto flex items-center justify-center" style={{ background: "#F3F4F6" }}>
                  <Search size={24} style={{ color: "#9CA3AF" }} />
                </div>
                <p className="text-[15px] font-bold mt-4" style={{ color: "#1B2A4A" }}>No products match</p>
                <p className="text-[13px] mt-1" style={{ color: "#6B7280" }}>Try a different search or filter</p>
              </>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            {visibleItems.map((item, idx) => {
              const verdict = getVerdict(item.skaapScore);
              return (
                <motion.button
                  key={item.barcode + (item.scannedAt || idx)}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => onScanProduct(item.barcode)}
                  className="w-full flex items-center gap-3 px-4 py-3 text-left rounded-2xl"
                  style={{ background: "#F9FAFB", border: "1px solid #E5E7EB" }}
                >
                  {/* Product image */}
                  <div className="w-12 h-12 rounded-xl overflow-hidden flex-shrink-0" style={{ background: "#F3F4F6" }}>
                    {item.image ? (
                      <img src={item.image} alt={item.name} className="w-full h-full object-contain p-0.5" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Barcode size={16} style={{ color: "#D1D5DB" }} />
                      </div>
                    )}
                  </div>

                  {/* Name + brand + time */}
                  <div className="flex-1 min-w-0">
                    <p className="text-[14px] font-semibold truncate" style={{ color: "#1B2A4A" }}>{item.name}</p>
                    {item.brand && <p className="text-[12px] truncate" style={{ color: "#9CA3AF" }}>{item.brand}</p>}
                    <p className="text-[10px] mt-0.5" style={{ color: "#D1D5DB" }}>
                      {timeAgo(item.scannedAt)}
                    </p>
                  </div>

                  {/* Verdict badge */}
                  <span
                    className="text-[11px] font-bold px-2.5 py-1 rounded-full flex-shrink-0"
                    style={{ background: verdict.bg, color: verdict.color }}
                  >
                    {verdict.label}
                  </span>
                </motion.button>
              );
            })}
          </div>
        )}

        {/* Gate */}
        {hasGate && (
          <div className="mt-4 relative">
            <div className="absolute inset-0 rounded-2xl" style={{
              background: "linear-gradient(180deg, transparent 0%, rgba(255,255,255,0.95) 50%)",
            }} />
            <div className="relative text-center py-8 rounded-2xl" style={{ background: "#F9FAFB", border: "1px solid #E5E7EB" }}>
              <Lock size={24} style={{ color: "#C41E3A" }} className="mx-auto" />
              <h3 className="font-extrabold text-lg mt-3" style={{ color: "#1B2A4A" }}>Unlock Full History</h3>
              <p className="text-[13px] mt-1" style={{ color: "#9CA3AF" }}>
                See every product you've ever scanned
              </p>
              <motion.button whileTap={{ scale: 0.97 }}
                onClick={() => openUpgrade("Unlimited scan history")}
                className="mt-4 px-6 py-3 rounded-2xl font-bold text-sm text-white"
                style={{ background: "linear-gradient(135deg, #C41E3A, #9E1830)" }}>
                Upgrade to SKAAP Plus
              </motion.button>
            </div>
          </div>
        )}
      </div>

      {/* Bottom nav */}
      <BottomNavBar active="history" onNavigate={onNavChange} />
    </div>
  );
}
