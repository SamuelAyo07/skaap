import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ScanLine, Search, Flame, TrendingUp,
  ChevronRight, Barcode, Heart, Sparkles, Lightbulb,
} from "lucide-react";
import skaapIcon from "@/assets/skaap-icon.png";
import { getUserStats, refreshStreak, type UserStats } from "@/lib/skaapUserStats";
import { getScoreColor } from "@/lib/skaapScore";
import { ShareRewardsCard } from "@/components/scan/ShareRewardsCard";
import { SocialLinks } from "@/components/scan/SocialLinks";

const HISTORY_KEY = "skaap_scan_history";
const BASKET_KEY = "skaap_basket";
const LAST_SCAN_KEY = "skaap_last_scan";

// ─── Daily tips database ───
const DAILY_TIPS = [
  { emoji: "🧪", title: "Additives to watch", body: "E171 (titanium dioxide) is banned in the EU but still allowed in the US. SKAAP flags these for you." },
  { emoji: "🥦", title: "NOVA matters", body: "NOVA 4 (ultra-processed) foods are linked to higher inflammation. Look for NOVA 1-2 alternatives." },
  { emoji: "🅰️", title: "Nutri-Score decoded", body: "Nutri-Score A doesn't always mean healthy — it compares within categories. A cookie can score B." },
  { emoji: "🧂", title: "Hidden sodium", body: "Bread, cereal, and sauces can contain more sodium than chips. Check the per-serving numbers." },
  { emoji: "🍬", title: "Sugar aliases", body: "Dextrose, maltose, and corn syrup are all sugar. Products can have 5+ types to look smaller on labels." },
  { emoji: "🌿", title: "Organic ≠ additive-free", body: "Organic products can still contain approved additives. Always check the full ingredient list." },
  { emoji: "🏭", title: "Processing matters", body: "The same ingredient can be healthy raw but harmful when ultra-processed. Context is everything." },
  { emoji: "🔬", title: "Emulsifiers alert", body: "E433 and E466 may affect gut bacteria. They're common in ice cream and plant milks." },
  { emoji: "🥛", title: "Calcium check", body: "Many plant milks have added calcium but poor absorption. Shake well — it settles at the bottom." },
  { emoji: "🍎", title: "Fiber is king", body: "Most adults get only 15g of the recommended 25-30g daily fiber. Whole foods are the best source." },
  { emoji: "🧈", title: "Trans fats hide", body: "Products can say '0g trans fat' with up to 0.5g per serving. Check for 'partially hydrogenated' oils." },
  { emoji: "🥤", title: "Drink smart", body: "A single soda can contain 39g of sugar — nearly your entire daily limit in one drink." },
  { emoji: "🐟", title: "Omega balance", body: "Most diets have too much omega-6 vs omega-3. Aim for fatty fish, flaxseed, or walnuts twice a week." },
  { emoji: "🫙", title: "Preservatives 101", body: "Sodium benzoate (E211) + vitamin C can form benzene. Check if both are in your flavored drinks." },
  { emoji: "🌾", title: "'Whole grain' tricks", body: "If 'whole wheat' isn't the FIRST ingredient, the product may be mostly refined flour." },
];

function getDailyTip() {
  const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000);
  return DAILY_TIPS[dayOfYear % DAILY_TIPS.length];
}

interface HistoryItem {
  barcode: string;
  name: string;
  brand?: string;
  image?: string;
  nutriScore?: string;
  skaapScore?: number;
  scannedAt: number;
}

interface BasketItem {
  barcode: string;
  name: string;
  brand?: string;
  image?: string;
  skaapScore?: number;
}

interface LastScan {
  barcode: string;
  name: string;
  brand?: string;
  image?: string;
  score?: number;
  nutriScore?: string;
  scannedAt: number;
}

function getHistory(): HistoryItem[] {
  try { return JSON.parse(localStorage.getItem(HISTORY_KEY) || "[]"); } catch { return []; }
}

function getBasket(): BasketItem[] {
  try { return JSON.parse(localStorage.getItem(BASKET_KEY) || "[]"); } catch { return []; }
}

function getLastScan(): LastScan | null {
  try {
    const raw = localStorage.getItem(LAST_SCAN_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

function getTimeGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

function getMotivation(stats: UserStats): string {
  if (stats.total_scans === 0) return "Scan your first product to start";
  if (stats.current_streak >= 7) return `🔥 ${stats.current_streak}-day streak! You're on fire`;
  if (stats.kitchen_score >= 70) return "Your kitchen is looking healthy!";
  if (stats.total_scans >= 50) return "You're becoming a food intelligence pro";
  if (stats.total_scans >= 10) return "Keep scanning — knowledge is power";
  return "Every scan makes you smarter about food";
}

interface StandaloneHomeProps {
  onScan: () => void;
  onSearch: () => void;
  onHistory: () => void;
  onSaved: () => void;
  onRecs: () => void;
  onCommunity: () => void;
  onScanProduct: (barcode: string) => void;
  onImageScan: () => void;
}

export function StandaloneHome({
  onScan, onSearch, onHistory, onSaved, onRecs, onCommunity, onScanProduct, onImageScan,
}: StandaloneHomeProps) {
  const [stats, setStats] = useState<UserStats>(refreshStreak());
  const [lastScan] = useState<LastScan | null>(getLastScan);
  const [recentHistory] = useState<HistoryItem[]>(() => getHistory().slice(0, 4));
  const [savedCount] = useState(() => getBasket().length);
  const [tipExpanded, setTipExpanded] = useState(false);

  useEffect(() => { setStats(refreshStreak()); }, []);

  const greeting = getTimeGreeting();
  const motivation = getMotivation(stats);
  const tip = getDailyTip();

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, x: -40 }}
      transition={{ duration: 0.25 }}
      className="flex flex-col"
      style={{ maxWidth: 430, margin: "0 auto", background: "#FFFFFF", height: "100dvh" }}
    >
      {/* Ambient glow */}
      <div className="absolute top-0 right-0 w-72 h-72 rounded-full pointer-events-none" style={{ background: "radial-gradient(circle, rgba(196,30,58,0.06) 0%, transparent 70%)", filter: "blur(60px)" }} />

      {/* Header */}
      <div className="relative z-10 px-5 pt-[env(safe-area-inset-top,12px)]">
        <div className="flex items-center justify-between h-14">
          <div className="flex items-center gap-2.5">
            <img src={skaapIcon} alt="SKAAP" className="w-8 h-8 rounded-xl" width="32" height="32" />
            <span className="font-extrabold text-[22px] tracking-tight" style={{ color: "#0A1220", letterSpacing: "-0.5px" }}>SKAAP</span>
          </div>
          <div className="flex items-center gap-2">
            {savedCount > 0 && (
              <motion.button whileTap={{ scale: 0.9 }} onClick={onSaved}
                className="w-10 h-10 rounded-full flex items-center justify-center relative" style={{ background: "#F3F4F6" }}>
                <Heart size={20} style={{ color: "#C41E3A" }} fill="#C41E3A" />
                <span className="absolute -top-0.5 -right-0.5 rounded-full flex items-center justify-center text-[9px] font-bold text-white" style={{ background: "#C41E3A", width: 18, height: 18 }}>{savedCount}</span>
              </motion.button>
            )}
          </div>
        </div>

        {/* Greeting */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="mt-2">
          <h1 className="font-extrabold text-[24px] leading-tight tracking-tight" style={{ color: "#0A1220" }}>{greeting}</h1>
          <p className="text-[13px] mt-0.5 font-medium" style={{ color: "#4B5563" }}>{motivation}</p>
        </motion.div>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto relative z-10 px-5 pb-2">

        {/* Big scan button */}
        <motion.button
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 200, damping: 20 }}
          whileTap={{ scale: 0.97 }}
          onClick={onScan}
          className="w-full mt-4 rounded-2xl overflow-hidden relative"
          style={{ height: 100, background: "linear-gradient(135deg, #B01830, #7a1220)" }}
        >
          <div className="absolute right-6 top-1/2 -translate-y-1/2 w-20 h-20 rounded-full" style={{ border: "2px solid rgba(255,255,255,0.12)" }} />
          <div className="absolute right-9 top-1/2 -translate-y-1/2 w-14 h-14 rounded-full" style={{ border: "1.5px solid rgba(255,255,255,0.08)" }} />
          <div className="absolute inset-0 flex items-center px-6">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1.5">
                <ScanLine size={20} color="white" />
                <span className="font-extrabold text-[18px] text-white tracking-tight">Scan a product</span>
              </div>
              <p className="text-[12px] font-medium" style={{ color: "rgba(255,255,255,0.6)" }}>Barcode or photo • 3M+ products</p>
            </div>
            <ChevronRight size={20} style={{ color: "rgba(255,255,255,0.4)" }} />
          </div>
        </motion.button>

        {/* Quick actions */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="grid grid-cols-3 gap-2 mt-4">
          <button onClick={onSearch} className="flex flex-col items-center gap-1.5 py-3.5 rounded-2xl" style={{ background: "#F9FAFB", border: "1px solid #F3F4F6" }}>
            <Search size={18} style={{ color: "#6B7280" }} />
            <span className="text-[11px] font-semibold" style={{ color: "#374151" }}>Search</span>
          </button>
          <button onClick={onImageScan} className="flex flex-col items-center gap-1.5 py-3.5 rounded-2xl" style={{ background: "#F9FAFB", border: "1px solid #F3F4F6" }}>
            <span className="text-[16px]">📸</span>
            <span className="text-[11px] font-semibold" style={{ color: "#374151" }}>Photo scan</span>
          </button>
          <button onClick={onCommunity} className="flex flex-col items-center gap-1.5 py-3.5 rounded-2xl" style={{ background: "#F9FAFB", border: "1px solid #F3F4F6" }}>
            <TrendingUp size={18} style={{ color: "#6B7280" }} />
            <span className="text-[11px] font-semibold" style={{ color: "#374151" }}>Community</span>
          </button>
        </motion.div>

        {/* ── Daily Tip Card ── */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.33 }}
          className="mt-4"
        >
          <button
            onClick={() => setTipExpanded(!tipExpanded)}
            className="w-full rounded-2xl px-4 py-3.5 text-left transition-all"
            style={{ background: "linear-gradient(135deg, #FFFBEB, #FEF3C7)", border: "1px solid #FDE68A" }}
          >
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5" style={{ background: "rgba(245,158,11,0.15)" }}>
                <Lightbulb size={18} style={{ color: "#D97706" }} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "#D97706" }}>Daily tip</span>
                  <span className="text-[13px]">{tip.emoji}</span>
                </div>
                <p className="font-bold text-[13px] mt-0.5" style={{ color: "#92400E" }}>{tip.title}</p>
                <AnimatePresence>
                  {tipExpanded && (
                    <motion.p
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="text-[12px] mt-1 leading-relaxed overflow-hidden"
                      style={{ color: "#78350F" }}
                    >
                      {tip.body}
                    </motion.p>
                  )}
                </AnimatePresence>
              </div>
              <ChevronRight
                size={14}
                className="flex-shrink-0 mt-1 transition-transform"
                style={{ color: "#D97706", transform: tipExpanded ? "rotate(90deg)" : "rotate(0deg)" }}
              />
            </div>
          </button>
        </motion.div>

        {/* Stats strip */}
        {stats.total_scans > 0 && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.37 }} className="mt-4">
            <button onClick={onRecs} className="w-full rounded-2xl px-4 py-3.5 flex items-center gap-3" style={{ background: "#F9FAFB", border: "1px solid #F3F4F6" }}>
              <div className="flex items-center gap-4 flex-1">
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center font-extrabold text-[14px] text-white"
                    style={{ background: stats.kitchen_score > 0 ? getScoreColor(stats.kitchen_score) : "#D1D5DB" }}>
                    {stats.kitchen_score > 0 ? stats.kitchen_score : "—"}
                  </div>
                  <div>
                    <p className="text-[12px] font-bold" style={{ color: "#1B2A4A" }}>Kitchen Score</p>
                    <p className="text-[10px]" style={{ color: "#9CA3AF" }}>
                      {stats.kitchen_percentile > 0 ? `Top ${100 - stats.kitchen_percentile}%` : "Keep scanning"}
                    </p>
                  </div>
                </div>
                <div className="w-px h-8" style={{ background: "#E5E7EB" }} />
                <div className="flex items-center gap-1.5">
                  <Flame size={16} style={{ color: stats.current_streak > 0 ? "#F59E0B" : "#D1D5DB" }} />
                  <div>
                    <p className="text-[12px] font-bold" style={{ color: "#1B2A4A" }}>{stats.current_streak > 0 ? stats.current_streak : "—"}</p>
                    <p className="text-[10px]" style={{ color: "#9CA3AF" }}>streak</p>
                  </div>
                </div>
                <div className="w-px h-8" style={{ background: "#E5E7EB" }} />
                <div>
                  <p className="text-[12px] font-bold" style={{ color: "#1B2A4A" }}>{stats.total_scans}</p>
                  <p className="text-[10px]" style={{ color: "#9CA3AF" }}>scanned</p>
                </div>
              </div>
              <ChevronRight size={14} style={{ color: "#D1D5DB" }} />
            </button>
          </motion.div>
        )}

        {/* Last scan quick card */}
        {lastScan && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="mt-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[11px] font-bold uppercase tracking-wider" style={{ color: "#9CA3AF" }}>Last scanned</p>
            </div>
            <motion.button
              whileTap={{ scale: 0.98 }}
              onClick={() => onScanProduct(lastScan.barcode)}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-left"
              style={{ background: "#F9FAFB", border: "1px solid #F3F4F6" }}
            >
              <div className="w-12 h-12 rounded-xl overflow-hidden flex-shrink-0" style={{ background: "#F3F4F6" }}>
                {lastScan.image ? (
                  <img src={lastScan.image} alt={lastScan.name} className="w-full h-full object-contain p-0.5" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center"><Barcode size={16} style={{ color: "#D1D5DB" }} /></div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-[13px] truncate" style={{ color: "#111827" }}>{lastScan.name}</p>
                {lastScan.brand && <p className="text-[11px] truncate" style={{ color: "#6B7280" }}>{lastScan.brand}</p>}
              </div>
              {lastScan.score != null && (
                <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 text-white font-extrabold text-[13px]"
                  style={{ background: getScoreColor(lastScan.score) }}>
                  {lastScan.score}
                </div>
              )}
              <ChevronRight size={16} style={{ color: "#D1D5DB" }} />
            </motion.button>
          </motion.div>
        )}

        {/* Recent history */}
        {recentHistory.length > 1 && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }} className="mt-5">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[11px] font-bold uppercase tracking-wider" style={{ color: "#9CA3AF" }}>Recent</p>
              <button onClick={onHistory} className="text-[11px] font-semibold flex items-center gap-0.5" style={{ color: "#C41E3A" }}>
                See all <ChevronRight size={12} />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {recentHistory.slice(0, 4).map((item, idx) => (
                <motion.button
                  key={item.barcode}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 + idx * 0.05 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => onScanProduct(item.barcode)}
                  className="flex items-center gap-2.5 p-3 rounded-2xl text-left"
                  style={{ background: "#F9FAFB", border: "1px solid #F3F4F6" }}
                >
                  <div className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0" style={{ background: "#F3F4F6" }}>
                    {item.image ? (
                      <img src={item.image} alt={item.name} className="w-full h-full object-contain p-0.5" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center"><Barcode size={12} style={{ color: "#D1D5DB" }} /></div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-[11px] truncate leading-tight" style={{ color: "#111827" }}>{item.name}</p>
                    {item.skaapScore != null && (
                      <span className="inline-block mt-0.5 text-[10px] font-extrabold px-1.5 py-0.5 rounded text-white"
                        style={{ background: getScoreColor(item.skaapScore) }}>
                        {item.skaapScore}
                      </span>
                    )}
                  </div>
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}

        {/* Share Rewards */}
        {stats.total_scans > 0 && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="mt-4">
            <ShareRewardsCard onShare={onScan} />
          </motion.div>
        )}

        {/* Social Links */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }} className="mt-4">
          <SocialLinks variant="pill" />
        </motion.div>

        {/* Empty state for brand new users */}
        {stats.total_scans === 0 && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="mt-8 text-center px-4">
            <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: "#FEF2F2" }}>
              <Sparkles size={28} style={{ color: "#C41E3A" }} />
            </div>
            <h3 className="font-extrabold text-[18px]" style={{ color: "#1B2A4A" }}>Your food intelligence starts here</h3>
            <p className="text-[13px] mt-2 max-w-[280px] mx-auto leading-relaxed" style={{ color: "#9CA3AF" }}>
              Scan any grocery or beauty product to instantly decode ingredients, additives, and nutrition scores.
            </p>
            <div className="flex flex-wrap justify-center gap-1.5 mt-4">
              {["🎯 SKAAP Score", "🅰️ Nutri-Score", "🧪 Additives", "🏭 NOVA"].map(chip => (
                <span key={chip} className="text-[10px] font-semibold px-2.5 py-1 rounded-full" style={{ background: "#F3F4F6", color: "#374151" }}>{chip}</span>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}
