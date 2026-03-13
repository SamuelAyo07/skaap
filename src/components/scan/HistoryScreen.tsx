import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Search, X, Barcode, Home, Clock, Heart, Lock } from "lucide-react";
import { getScoreColor } from "@/lib/skaapScore";
import { useSubscription } from "@/context/SubscriptionContext";

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
}

const FREE_SCAN_LIMIT = 5;

export function HistoryScreen({
  history, onBack, onScanProduct, onClearHistory, activeNav, onNavChange,
}: HistoryScreenProps) {
  const { isPlus, openUpgrade } = useSubscription();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");

  const filtered = history.filter(item => {
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

  // Stats
  const weekAgo = Date.now() - 7 * 86400000;
  const weekScans = history.filter(h => h.scannedAt > weekAgo);
  const avgScore = weekScans.length > 0
    ? Math.round(weekScans.reduce((a, b) => a + (b.skaapScore ?? 0), 0) / weekScans.length)
    : 0;
  const bestScore = history.reduce((best, h) => Math.max(best, h.skaapScore ?? 0), 0);

  return (
    <div className="min-h-screen flex flex-col" style={{ maxWidth: 430, margin: "0 auto", background: "#FFFFFF" }}>
      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-[env(safe-area-inset-top,12px)] h-14">
        <button onClick={onBack}><ArrowLeft size={20} style={{ color: "#1B2A4A" }} /></button>
        <h1 className="font-extrabold text-xl tracking-tight" style={{ color: "#1B2A4A" }}>Your History</h1>
        <button onClick={onClearHistory} className="text-[12px] font-semibold" style={{ color: "#E8314A" }}>Clear</button>
      </div>

      {/* Stat cards */}
      <div className="flex gap-2 px-5 mt-2">
        {[
          { val: avgScore || "--", label: "avg this week" },
          { val: history.length, label: "total scans" },
          { val: bestScore || "--", label: "best scan" },
        ].map(s => (
          <div key={s.label} className="flex-1 flex flex-col items-center justify-center py-3 rounded-2xl" style={{ background: "#F9FAFB", border: "1px solid #E5E7EB" }}>
            <span className="font-extrabold text-xl" style={{ color: "#1B2A4A" }}>{s.val}</span>
            <span className="text-[10px]" style={{ color: "#9CA3AF" }}>{s.label}</span>
          </div>
        ))}
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
              background: filter === f.key ? "#E8314A" : "#F3F4F6",
              color: filter === f.key ? "#fff" : "#6B7280",
              border: `1px solid ${filter === f.key ? "#E8314A" : "#E5E7EB"}`,
            }}>
            {f.label}
          </button>
        ))}
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto px-5 mt-3 pb-24">
        {visibleItems.length === 0 ? (
          <div className="text-center py-16">
            <Clock size={32} style={{ color: "#D1D5DB" }} className="mx-auto" />
            <p className="text-sm mt-3" style={{ color: "#9CA3AF" }}>
              {history.length === 0 ? "No scans yet" : "No products match"}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {visibleItems.map(item => (
              <motion.button
                key={item.barcode + item.scannedAt}
                whileTap={{ scale: 0.98 }}
                onClick={() => onScanProduct(item.barcode)}
                className="w-full flex items-center gap-3 px-4 py-3 text-left rounded-2xl"
                style={{ background: "#F9FAFB", border: "1px solid #E5E7EB" }}
              >
                <div className="w-12 h-12 rounded-xl overflow-hidden flex-shrink-0" style={{ background: "#F3F4F6" }}>
                  {item.image ? (
                    <img src={item.image} alt={item.name} className="w-full h-full object-contain p-0.5" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Barcode size={16} style={{ color: "#D1D5DB" }} />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate" style={{ color: "#1B2A4A" }}>{item.name}</p>
                  {item.brand && <p className="text-[11px] truncate" style={{ color: "#9CA3AF" }}>{item.brand}</p>}
                  <p className="text-[10px]" style={{ color: "#D1D5DB" }}>
                    {new Date(item.scannedAt).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                  </p>
                </div>
                {item.skaapScore != null && (
                  <div className="w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{ background: getScoreColor(item.skaapScore), boxShadow: `0 0 16px ${getScoreColor(item.skaapScore)}40` }}>
                    <span className="font-extrabold text-sm text-white">{item.skaapScore}</span>
                  </div>
                )}
              </motion.button>
            ))}
          </div>
        )}

        {/* Gate */}
        {hasGate && (
          <div className="mt-4 relative">
            <div className="absolute inset-0 rounded-2xl" style={{
              background: "linear-gradient(180deg, transparent 0%, rgba(255,255,255,0.95) 50%)",
            }} />
            <div className="relative text-center py-8 rounded-2xl" style={{ background: "#F9FAFB", border: "1px solid #E5E7EB" }}>
              <Lock size={24} style={{ color: "#E8314A" }} className="mx-auto" />
              <h3 className="font-extrabold text-lg mt-3" style={{ color: "#1B2A4A" }}>Unlock Full History</h3>
              <p className="text-[13px] mt-1" style={{ color: "#9CA3AF" }}>
                See every product you've ever scanned
              </p>
              <motion.button whileTap={{ scale: 0.97 }}
                onClick={() => openUpgrade("Unlimited scan history")}
                className="mt-4 px-6 py-3 rounded-2xl font-bold text-sm text-white"
                style={{ background: "linear-gradient(135deg, #E8314A, #c42040)" }}>
                Upgrade to SKAAP Plus
              </motion.button>
            </div>
          </div>
        )}
      </div>

      {/* Bottom nav */}
      <div className="flex items-center justify-around" style={{ height: 83, paddingBottom: 20, borderTop: "1px solid #E5E7EB", background: "#fff" }}>
        {[
          { icon: <Home size={22} />, label: "Home", key: "home" },
          { icon: <Clock size={22} />, label: "History", key: "history" },
          { icon: <Search size={22} />, label: "Search", key: "search" },
          { icon: <Heart size={22} />, label: "Saved", key: "saved" },
        ].map(item => (
          <button key={item.key} onClick={() => onNavChange(item.key)} className="flex flex-col items-center gap-1">
            <span style={{ color: item.key === "history" ? "#E8314A" : "#9CA3AF" }}>{item.icon}</span>
            <span className="text-[10px] font-medium" style={{ color: item.key === "history" ? "#E8314A" : "#9CA3AF" }}>{item.label}</span>
            {item.key === "history" && <div className="w-1 h-1 rounded-full" style={{ background: "#E8314A", marginTop: -2 }} />}
          </button>
        ))}
      </div>
    </div>
  );
}