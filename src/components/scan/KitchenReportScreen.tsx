import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import {
  ArrowLeft, Share2, TrendingUp, Shield, AlertTriangle,
  ChevronRight, Flame, BarChart3, Beaker, Globe, Info,
} from "lucide-react";
import { BottomNavBar } from "./BottomNavBar";
import { getScoreColor, getScoreVerdict } from "@/lib/skaapScore";
import { type UserStats, type ScoreEntry } from "@/lib/skaapUserStats";
import { useSubscription } from "@/context/SubscriptionContext";
import { findBannedAdditives, getBadgeInfo, type BannedAdditive } from "@/lib/bannedAdditives";

interface KitchenReportScreenProps {
  userStats: UserStats;
  onBack: () => void;
  onNavChange: (nav: string) => void;
}

// Group scores by day for the last 7 days
function getWeeklyTrend(scores: ScoreEntry[]): { label: string; avg: number; count: number }[] {
  const days: { label: string; avg: number; count: number }[] = [];
  const now = new Date();
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 86400000);
    const dayStr = d.toISOString().slice(0, 10);
    const dayLabel = d.toLocaleDateString(undefined, { weekday: "short" });
    const dayScores = scores.filter(s => {
      const sd = new Date(s.scanned_at).toISOString().slice(0, 10);
      return sd === dayStr;
    });
    const avg = dayScores.length
      ? Math.round(dayScores.reduce((a, b) => a + b.skaap_score, 0) / dayScores.length)
      : 0;
    days.push({ label: dayLabel, avg, count: dayScores.length });
  }
  return days;
}

// Compute nutrient breakdown from recent scans (aggregate from scan history)
function getNutrientBreakdown(scores: ScoreEntry[]) {
  let high_sugar = 0, high_fat = 0, high_salt = 0, ultra_processed = 0;
  const recent = scores.slice(0, 30);
  recent.forEach(s => {
    if (s.nova_group === 4) ultra_processed++;
  });
  // Simple heuristic from nutriscore
  recent.forEach(s => {
    const ns = s.nutriscore_grade?.toLowerCase();
    if (ns === "d" || ns === "e") {
      high_sugar++;
      high_fat++;
    }
    if (ns === "e") high_salt++;
  });
  return { high_sugar, high_fat, high_salt, ultra_processed, total: recent.length };
}

export function KitchenReportScreen({ userStats, onBack, onNavChange }: KitchenReportScreenProps) {
  const { isPlus, openUpgrade } = useSubscription();
  const [activeSection, setActiveSection] = useState<"trends" | "nutrients" | "regulatory">("trends");
  const color = getScoreColor(userStats.kitchen_score);

  const weeklyTrend = useMemo(() => getWeeklyTrend(userStats.all_scores), [userStats.all_scores]);
  const nutrients = useMemo(() => getNutrientBreakdown(userStats.all_scores), [userStats.all_scores]);
  const maxDayAvg = Math.max(...weeklyTrend.map(d => d.avg), 1);

  const allUserAdditives = useMemo(() => {
    const tags = new Set<string>();
    userStats.all_scores.slice(0, 100).forEach(s => {
      (s.additives || []).forEach(a => tags.add(a));
    });
    return [...tags];
  }, [userStats.all_scores]);

  const bannedFound = useMemo(() => findBannedAdditives(allUserAdditives), [allUserAdditives]);

  if (!isPlus) {
    openUpgrade("Kitchen Report");
    return null;
  }

  // Additive concerns
  const additiveCounts: Record<string, number> = {};
  userStats.all_scores.slice(0, 50).forEach(s => {
    (s.additives || []).forEach(a => {
      const code = a.replace(/^en:/, "").replace(/-.*$/, "").toUpperCase();
      additiveCounts[code] = (additiveCounts[code] || 0) + 1;
    });
  });
  const topConcerns = Object.entries(additiveCounts).sort((a, b) => b[1] - a[1]).slice(0, 5);

  const weekAgo = Date.now() - 7 * 86400000;
  const weekScans = userStats.all_scores.filter(s => s.scanned_at > weekAgo).length;
  const wins = userStats.all_scores.filter(s => s.scanned_at > weekAgo && s.skaap_score >= 75).slice(0, 3);

  const now = new Date();
  const weekStart = new Date(now.getTime() - 6 * 86400000);
  const dateRange = `${weekStart.toLocaleDateString(undefined, { month: "short", day: "numeric" })} – ${now.toLocaleDateString(undefined, { month: "short", day: "numeric" })}`;

  const handleShare = async () => {
    const text = `🐑 My SKAAP Kitchen Score: ${userStats.kitchen_score}/100\n${weekScans} products scanned this week\n🔥 ${userStats.current_streak}-day clean eating streak\n${bannedFound.length > 0 ? `⚠️ ${bannedFound.length} EU-banned additive${bannedFound.length > 1 ? "s" : ""} found in my pantry\n` : ""}\nCheck your food at useskaap.com/scan`;
    if (navigator.share) {
      try { await navigator.share({ title: "My Kitchen Report", text }); } catch {}
    } else {
      try { await navigator.clipboard.writeText(text); } catch {}
    }
  };

  const size = 140;
  const strokeW = 8;
  const r = (size - strokeW * 2) / 2;
  const circumference = 2 * Math.PI * r;
  const offset = circumference - (userStats.kitchen_score / 100) * circumference;

  return (
    <div className="min-h-[100dvh] flex flex-col" style={{ maxWidth: 430, margin: "0 auto", background: "#FFFFFF" }}>
      {/* Header */}
      <div className="flex items-center gap-3 px-5 pt-[env(safe-area-inset-top,12px)] h-14">
        <button onClick={onBack}><ArrowLeft size={20} style={{ color: "#1A1A1A" }} /></button>
        <div>
          <h1 className="font-extrabold text-xl tracking-tight" style={{ color: "#1A1A1A" }}>Kitchen Report</h1>
          <p className="text-[11px]" style={{ color: "#9CA3AF" }}>{dateRange}</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pb-24">
        {/* Hero score */}
        <div className="mx-5 mt-4 p-5 flex flex-col items-center rounded-3xl" style={{ background: "#F9FAFB", border: "1px solid #E5E7EB" }}>
          <p className="text-[12px] font-semibold uppercase tracking-wider" style={{ color: "#9CA3AF" }}>Kitchen Score</p>
          <div className="relative mt-3" style={{ width: size, height: size }}>
            <div className="absolute inset-0 rounded-full" style={{ background: `${color}15`, filter: "blur(16px)" }} />
            <svg width={size} height={size} className="-rotate-90">
              <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#F3F4F6" strokeWidth={strokeW} />
              <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={strokeW}
                strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={offset}
                style={{ transition: "stroke-dashoffset 0.6s cubic-bezier(0.34,1.56,0.64,1)" }} />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="font-extrabold" style={{ fontSize: 48, color }}>{userStats.kitchen_score}</span>
              <span className="font-bold text-[11px] uppercase tracking-wider" style={{ color }}>{getScoreVerdict(userStats.kitchen_score)}</span>
            </div>
          </div>
          <p className="text-[12px] mt-2" style={{ color: "#9CA3AF" }}>
            Based on {userStats.all_scores.length} scan{userStats.all_scores.length !== 1 ? "s" : ""} · Top {userStats.kitchen_percentile}%
          </p>
        </div>

        {/* Metrics row */}
        <div className="flex gap-2 mx-5 mt-3">
          {[
            { val: weekScans, label: "This Week", icon: "📊" },
            { val: userStats.current_streak, label: "Streak 🔥", icon: "" },
            { val: bannedFound.length, label: "EU Flags", icon: "🇪🇺" },
          ].map(m => (
            <div key={m.label} className="flex-1 py-3 flex flex-col items-center rounded-2xl" style={{ background: "#F9FAFB", border: "1px solid #E5E7EB" }}>
              <span className="font-extrabold text-lg" style={{ color: "#1A1A1A" }}>{m.icon}{m.val}</span>
              <span className="text-[10px] text-center" style={{ color: "#9CA3AF" }}>{m.label}</span>
            </div>
          ))}
        </div>

        {/* Section tabs */}
        <div className="flex items-center mx-5 mt-5 gap-0 rounded-xl overflow-hidden" style={{ background: "#F3F4F6" }}>
          {[
            { key: "trends" as const, icon: TrendingUp, label: "Trends" },
            { key: "nutrients" as const, icon: BarChart3, label: "Nutrients" },
            { key: "regulatory" as const, icon: Globe, label: "FDA vs EU" },
          ].map(tab => (
            <button key={tab.key} onClick={() => setActiveSection(tab.key)}
              className="flex-1 flex items-center justify-center gap-1 py-2.5 text-[12px] font-bold transition-all"
              style={{
                background: activeSection === tab.key ? "#FFFFFF" : "transparent",
                color: activeSection === tab.key ? "#1A1A1A" : "#9CA3AF",
                borderRadius: activeSection === tab.key ? 10 : 0,
                margin: 3,
                boxShadow: activeSection === tab.key ? "0 1px 3px rgba(0,0,0,0.06)" : "none",
              }}>
              <tab.icon size={13} /> {tab.label}
            </button>
          ))}
        </div>

        {/* TRENDS SECTION */}
        {activeSection === "trends" && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="px-5 mt-4 space-y-4">
            {/* Weekly bar chart */}
            <div className="p-4 rounded-2xl" style={{ background: "#F9FAFB", border: "1px solid #E5E7EB" }}>
              <p className="text-[12px] font-bold uppercase tracking-wider mb-3" style={{ color: "#1A1A1A" }}>7-Day Score Trend</p>
              <div className="flex items-end gap-2" style={{ height: 100 }}>
                {weeklyTrend.map((d, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1">
                    {d.count > 0 && (
                      <span className="text-[9px] font-bold" style={{ color: getScoreColor(d.avg) }}>{d.avg}</span>
                    )}
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: d.count > 0 ? Math.max((d.avg / maxDayAvg) * 60, 8) : 4 }}
                      transition={{ delay: i * 0.05, duration: 0.3 }}
                      className="w-full rounded-t-lg"
                      style={{
                        background: d.count > 0 ? getScoreColor(d.avg) : "#E5E7EB",
                        opacity: d.count > 0 ? 1 : 0.3,
                        minWidth: 24,
                      }}
                    />
                    <span className="text-[9px]" style={{ color: "#9CA3AF" }}>{d.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Top Concerns */}
            {topConcerns.length > 0 && (
              <div className="p-4 rounded-2xl" style={{ background: "#F9FAFB", border: "1px solid #E5E7EB" }}>
                <div className="flex items-center gap-1.5 mb-3">
                  <Beaker size={14} style={{ color: "#F59E0B" }} />
                  <p className="text-[12px] font-bold uppercase tracking-wider" style={{ color: "#1A1A1A" }}>Most Common Additives</p>
                </div>
                {topConcerns.map(([code, count], i) => (
                  <div key={code} className="flex items-center justify-between py-2" style={{ borderBottom: i < topConcerns.length - 1 ? "1px solid #F3F4F6" : "none" }}>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full" style={{ background: "#F59E0B" }} />
                      <span className="text-[13px] font-semibold" style={{ color: "#1A1A1A" }}>{code}</span>
                    </div>
                    <span className="text-[11px]" style={{ color: "#9CA3AF" }}>in {count} scan{count > 1 ? "s" : ""}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Wins */}
            {wins.length > 0 && (
              <div className="p-4 rounded-2xl" style={{ background: "#F0FDF4", border: "1px solid #BBF7D0" }}>
                <p className="text-[12px] font-bold uppercase tracking-wider mb-3" style={{ color: "#15803D" }}>Wins This Week 🎉</p>
                {wins.map((w, i) => (
                  <div key={i} className="flex items-center gap-3 py-2" style={{ borderBottom: i < wins.length - 1 ? "1px solid #D1FAE5" : "none" }}>
                    <span className="text-[13px] flex-1 truncate" style={{ color: "#166534" }}>{w.product_name}</span>
                    <span className="text-[12px] font-bold" style={{ color: "#22C55E" }}>{w.skaap_score}</span>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {/* NUTRIENTS SECTION */}
        {activeSection === "nutrients" && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="px-5 mt-4 space-y-4">
            <div className="p-4 rounded-2xl" style={{ background: "#F9FAFB", border: "1px solid #E5E7EB" }}>
              <p className="text-[12px] font-bold uppercase tracking-wider mb-4" style={{ color: "#1A1A1A" }}>Your Pattern (Last 30 Scans)</p>
              {[
                { label: "High Sugar Products", val: nutrients.high_sugar, total: nutrients.total, color: "#C41E3A", icon: "🍬" },
                { label: "High Fat Products", val: nutrients.high_fat, total: nutrients.total, color: "#F59E0B", icon: "🧈" },
                { label: "High Salt Products", val: nutrients.high_salt, total: nutrients.total, color: "#8B5CF6", icon: "🧂" },
                { label: "Ultra-Processed (NOVA 4)", val: nutrients.ultra_processed, total: nutrients.total, color: "#DC2626", icon: "🏭" },
              ].map((item, i) => {
                const pct = nutrients.total > 0 ? Math.round((item.val / item.total) * 100) : 0;
                return (
                  <div key={i} className="mb-4 last:mb-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[13px] font-semibold" style={{ color: "#1A1A1A" }}>{item.icon} {item.label}</span>
                      <span className="text-[12px] font-bold" style={{ color: item.color }}>{item.val}/{item.total} ({pct}%)</span>
                    </div>
                    <div className="h-2 rounded-full overflow-hidden" style={{ background: "#E5E7EB" }}>
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ duration: 0.5, delay: i * 0.1 }}
                        className="h-full rounded-full"
                        style={{ background: item.color }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Breakdown explanation */}
            <div className="p-4 rounded-2xl flex items-start gap-3" style={{ background: "#EFF6FF", border: "1px solid #BFDBFE" }}>
              <Info size={16} style={{ color: "#2563EB" }} className="flex-shrink-0 mt-0.5" />
              <p className="text-[12px] leading-relaxed" style={{ color: "#1E40AF" }}>
                Your nutrient breakdown is estimated from Nutri-Score grades and NOVA processing levels across your scan history.
              </p>
            </div>
          </motion.div>
        )}

        {/* REGULATORY SECTION (FDA vs EU) */}
        {activeSection === "regulatory" && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="px-5 mt-4 space-y-4">
            {/* Headline stat */}
            <div className="p-5 rounded-2xl text-center" style={{ background: "#FFFBEB", border: "1px solid #FDE68A" }}>
              <p className="text-[36px] font-extrabold" style={{ color: "#92400E" }}>13%</p>
              <p className="text-[14px] font-semibold mt-1" style={{ color: "#92400E" }}>
                of US grocery products contain an additive banned in Europe
              </p>
              <p className="text-[11px] mt-2" style={{ color: "#B45309" }}>
                That's 1 in 8 products on American shelves
              </p>
            </div>

            {/* US vs EU comparison */}
            <div className="flex gap-2">
              <div className="flex-1 p-4 rounded-2xl text-center" style={{ background: "#FEF2F2", border: "1px solid #FECDD3" }}>
                <p className="text-[11px] font-bold uppercase tracking-wider" style={{ color: "#991B1B" }}>🇺🇸 USA</p>
                <p className="text-[28px] font-extrabold mt-1" style={{ color: "#DC2626" }}>10,000+</p>
                <p className="text-[11px]" style={{ color: "#991B1B" }}>chemicals in food</p>
              </div>
              <div className="flex-1 p-4 rounded-2xl text-center" style={{ background: "#F0FDF4", border: "1px solid #BBF7D0" }}>
                <p className="text-[11px] font-bold uppercase tracking-wider" style={{ color: "#166534" }}>🇪🇺 EU</p>
                <p className="text-[28px] font-extrabold mt-1" style={{ color: "#22C55E" }}>410</p>
                <p className="text-[11px]" style={{ color: "#166534" }}>approved additives</p>
              </div>
            </div>

            {/* GRAS loophole explainer */}
            <div className="p-4 rounded-2xl" style={{ background: "#F9FAFB", border: "1px solid #E5E7EB" }}>
              <div className="flex items-center gap-2 mb-2">
                <Shield size={14} style={{ color: "#DC2626" }} />
                <p className="text-[12px] font-bold uppercase tracking-wider" style={{ color: "#1A1A1A" }}>The GRAS Loophole</p>
              </div>
              <p className="text-[13px] leading-relaxed" style={{ color: "#4B5563" }}>
                The FDA allows thousands of chemicals to enter the US food supply through the "Generally Recognized As Safe" loophole, without independent scientific review. The EU takes the opposite approach: companies must prove an additive is safe before it can be used.
              </p>
            </div>

            {/* Banned additives found in YOUR history */}
            {bannedFound.length > 0 ? (
              <div className="p-4 rounded-2xl" style={{ background: "#FFFBEB", border: "1px solid #FDE68A" }}>
                <div className="flex items-center gap-2 mb-3">
                  <AlertTriangle size={14} style={{ color: "#F59E0B" }} />
                  <p className="text-[12px] font-bold uppercase tracking-wider" style={{ color: "#92400E" }}>
                    Found in Your Pantry
                  </p>
                </div>
                {bannedFound.map((b, i) => {
                  const badges = getBadgeInfo(b);
                  return (
                    <div key={b.id} className="py-3" style={{ borderBottom: i < bannedFound.length - 1 ? "1px solid #FDE68A" : "none" }}>
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="text-[13px] font-bold" style={{ color: "#1A1A1A" }}>{b.name}</p>
                          <p className="text-[11px] mt-0.5 italic" style={{ color: "#6B7280" }}>
                            Permitted by FDA · {b.eu_status === "banned" ? `Banned by EFSA${b.ban_year_eu ? ` since ${b.ban_year_eu}` : ""}` : `${b.eu_status} in EU`}
                          </p>
                          <p className="text-[11px] mt-1" style={{ color: "#92400E" }}>{b.risk_reason}</p>
                        </div>
                        <div className="flex flex-col gap-1 flex-shrink-0">
                          {badges.map((badge, bi) => (
                            <span key={bi} className="text-[10px] font-semibold px-1.5 py-0.5 rounded-lg whitespace-nowrap"
                              style={{ background: badge.bg, border: `1px solid ${badge.border}`, color: badge.color }}>
                              {badge.label}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-4 rounded-2xl text-center" style={{ background: "#F0FDF4", border: "1px solid #BBF7D0" }}>
                <p className="text-[14px] font-semibold" style={{ color: "#22C55E" }}>✅ No EU-banned additives found in your scan history</p>
                <p className="text-[12px] mt-1" style={{ color: "#6B7280" }}>Keep scanning to monitor your exposure</p>
              </div>
            )}

            {/* Editorial note */}
            <div className="p-4 rounded-2xl" style={{ background: "#F9FAFB", border: "1px solid #E5E7EB" }}>
              <p className="text-[11px] leading-relaxed" style={{ color: "#9CA3AF" }}>
                Sources: EFSA, FDA 21 CFR, California AB 418, IARC. SKAAP cross-references every additive in your scans against both US and EU regulatory databases. Data updated quarterly.
              </p>
            </div>
          </motion.div>
        )}

        {/* Share */}
        <motion.button whileTap={{ scale: 0.97 }} onClick={handleShare}
          className="mx-5 mt-6 w-[calc(100%-40px)] font-bold text-[15px] text-white flex items-center justify-center gap-2"
          style={{
            height: 52, borderRadius: 16,
            background: "linear-gradient(135deg, #C41E3A, #9E1830)",
            boxShadow: "0 8px 24px rgba(196,30,58,0.3)",
          }}>
          <Share2 size={16} /> Share My Kitchen Report
        </motion.button>
      </div>

      <BottomNavBar active="kitchen" onNavigate={onNavChange} />
    </div>
  );
}
