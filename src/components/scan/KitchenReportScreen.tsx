import { motion } from "framer-motion";
import { ArrowLeft, Share2 } from "lucide-react";
import { BottomNavBar } from "./BottomNavBar";
import { getScoreColor } from "@/lib/skaapScore";
import { type UserStats } from "@/lib/skaapUserStats";
import { useSubscription } from "@/context/SubscriptionContext";

interface KitchenReportScreenProps {
  userStats: UserStats;
  onBack: () => void;
  onNavChange: (nav: string) => void;
}

export function KitchenReportScreen({ userStats, onBack, onNavChange }: KitchenReportScreenProps) {
  const { isPlus, openUpgrade } = useSubscription();
  const color = getScoreColor(userStats.kitchen_score);

  // Gate
  if (!isPlus) {
    openUpgrade("Kitchen Report");
    return null;
  }

  // Top concerns
  const additiveCounts: Record<string, number> = {};
  userStats.all_scores.slice(0, 50).forEach(s => {
    (s.additives || []).forEach(a => {
      const code = a.replace(/^en:/, "").replace(/-.*$/, "").toUpperCase();
      additiveCounts[code] = (additiveCounts[code] || 0) + 1;
    });
  });
  const topConcerns = Object.entries(additiveCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);

  const weekAgo = Date.now() - 7 * 86400000;
  const wins = userStats.all_scores
    .filter(s => s.scanned_at > weekAgo && s.skaap_score >= 75)
    .slice(0, 3);

  const weekScans = userStats.all_scores.filter(s => s.scanned_at > weekAgo).length;

  const now = new Date();
  const weekStart = new Date(now.getTime() - 6 * 86400000);
  const dateRange = `${weekStart.toLocaleDateString(undefined, { month: "short", day: "numeric" })} – ${now.toLocaleDateString(undefined, { month: "short", day: "numeric" })}`;

  const handleShare = async () => {
    const text = `🐑 My SKAAP Kitchen Score: ${userStats.kitchen_score}/100\n${weekScans} products scanned this week\n🔥 ${userStats.current_streak}-day clean eating streak\n\nCheck your food at useskaap.com/scan`;
    if (navigator.share) {
      try { await navigator.share({ title: "My Kitchen Report", text }); } catch {}
    } else {
      try { await navigator.clipboard.writeText(text); } catch {}
    }
  };

  const size = 160;
  const strokeW = 10;
  const r = (size - strokeW * 2) / 2;
  const circumference = 2 * Math.PI * r;
  const offset = circumference - (userStats.kitchen_score / 100) * circumference;

  return (
    <div className="min-h-screen flex flex-col" style={{ maxWidth: 430, margin: "0 auto", background: "#FFFFFF" }}>
      {/* Header */}
      <div className="flex items-center gap-3 px-5 pt-[env(safe-area-inset-top,12px)] h-14">
        <button onClick={onBack}><ArrowLeft size={20} style={{ color: "#1B2A4A" }} /></button>
        <div>
          <h1 className="font-extrabold text-xl tracking-tight" style={{ color: "#1B2A4A" }}>Kitchen Report</h1>
          <p className="text-[11px]" style={{ color: "#9CA3AF" }}>{dateRange}</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-5 pb-24">
        {/* Hero score */}
        <div className="p-6 mt-4 flex flex-col items-center rounded-3xl" style={{ background: "#F9FAFB", border: "1px solid #E5E7EB" }}>
          <p className="text-[13px] font-semibold" style={{ color: "#9CA3AF" }}>Your Kitchen Score</p>

          <div className="relative mt-4" style={{ width: size, height: size }}>
            <div className="absolute inset-0 rounded-full" style={{ background: `${color}15`, filter: "blur(20px)" }} />
            <svg width={size} height={size} className="-rotate-90">
              <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#F3F4F6" strokeWidth={strokeW} />
              <circle
                cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={strokeW}
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={offset}
                style={{ transition: "stroke-dashoffset 0.6s cubic-bezier(0.34,1.56,0.64,1)" }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="font-extrabold" style={{ fontSize: 56, color }}>{userStats.kitchen_score}</span>
            </div>
          </div>

          <p className="text-[13px] mt-2" style={{ color: "#9CA3AF" }}>
            Based on {userStats.all_scores.length} product{userStats.all_scores.length !== 1 ? "s" : ""} scanned
          </p>
          <p className="text-[11px] mt-1" style={{ color: "#D1D5DB" }}>
            Top {userStats.kitchen_percentile}% of SKAAP users
          </p>
        </div>

        {/* Metrics row */}
        <div className="flex gap-2 mt-4">
          {[
            { val: weekScans, label: "Scans This Week" },
            { val: userStats.current_streak, label: "Current Streak" },
            { val: userStats.all_scores.filter(s => s.scanned_at > weekAgo && s.skaap_score < 50).length, label: "Avoided" },
          ].map(m => (
            <div key={m.label} className="flex-1 py-3 flex flex-col items-center rounded-2xl" style={{ background: "#F9FAFB", border: "1px solid #E5E7EB" }}>
              <span className="font-extrabold text-lg" style={{ color: "#1B2A4A" }}>{m.val}</span>
              <span className="text-[10px] text-center" style={{ color: "#9CA3AF" }}>{m.label}</span>
            </div>
          ))}
        </div>

        {/* Top Concerns */}
        {topConcerns.length > 0 && (
          <div className="p-4 mt-4 rounded-2xl" style={{ background: "#F9FAFB", border: "1px solid #E5E7EB" }}>
            <h3 className="font-bold text-[15px] mb-3" style={{ color: "#1B2A4A" }}>Top Concerns</h3>
            {topConcerns.map(([code, count]) => (
              <div key={code} className="flex items-center justify-between py-2" style={{ borderBottom: "1px solid #F3F4F6" }}>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ background: "#F59E0B" }} />
                  <span className="text-[13px] font-semibold" style={{ color: "#1B2A4A" }}>{code}</span>
                </div>
                <span className="text-[11px]" style={{ color: "#9CA3AF" }}>
                  in {count} of your scans
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Wins */}
        {wins.length > 0 && (
          <div className="p-4 mt-4 rounded-2xl" style={{ background: "#F9FAFB", border: "1px solid #E5E7EB" }}>
            <h3 className="font-bold text-[15px] mb-3" style={{ color: "#1B2A4A" }}>Wins This Week 🎉</h3>
            {wins.map((w, i) => (
              <div key={i} className="flex items-center gap-3 py-2" style={{ borderBottom: i < wins.length - 1 ? "1px solid #F3F4F6" : "none" }}>
                <div className="w-2 h-2 rounded-full" style={{ background: "#22C55E" }} />
                <span className="text-[13px] flex-1 truncate" style={{ color: "#1B2A4A" }}>{w.product_name}</span>
                <span className="text-[12px] font-bold" style={{ color: "#22C55E" }}>{w.skaap_score}</span>
              </div>
            ))}
          </div>
        )}

        {/* Share */}
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={handleShare}
          className="w-full mt-6 font-bold text-[15px] text-white flex items-center justify-center gap-2"
          style={{
            height: 52, borderRadius: 16,
            background: "linear-gradient(135deg, #E8314A, #c42040)",
            boxShadow: "0 8px 24px rgba(232,49,74,0.3)",
          }}
        >
          <Share2 size={16} /> Share My Kitchen Report
        </motion.button>
      </div>

      {/* Bottom nav */}
      <BottomNavBar active="kitchen" onNavigate={onNavChange} />
    </div>
  );
}