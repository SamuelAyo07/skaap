import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, Minus, Shield, AlertTriangle, Flame, Target } from "lucide-react";
import { getUserStats, type UserStats, type ScoreEntry } from "@/lib/skaapUserStats";

function getWeeklyTrend(scores: ScoreEntry[]): { direction: "up" | "down" | "flat"; delta: number } {
  const now = Date.now();
  const oneWeekAgo = now - 7 * 86400000;
  const twoWeeksAgo = now - 14 * 86400000;

  const thisWeek = scores.filter(s => s.scanned_at > oneWeekAgo);
  const lastWeek = scores.filter(s => s.scanned_at > twoWeeksAgo && s.scanned_at <= oneWeekAgo);

  if (thisWeek.length === 0 || lastWeek.length === 0) return { direction: "flat", delta: 0 };

  const thisAvg = thisWeek.reduce((a, b) => a + b.skaap_score, 0) / thisWeek.length;
  const lastAvg = lastWeek.reduce((a, b) => a + b.skaap_score, 0) / lastWeek.length;
  const delta = Math.round(thisAvg - lastAvg);

  return { direction: delta > 2 ? "up" : delta < -2 ? "down" : "flat", delta: Math.abs(delta) };
}

function getTopAllergens(scores: ScoreEntry[]): string[] {
  const additiveCounts: Record<string, number> = {};
  scores.forEach(s => {
    (s.additives || []).forEach(a => {
      const clean = a.replace(/^en:/, "").replace(/-/g, " ").replace(/\b\w/g, c => c.toUpperCase());
      additiveCounts[clean] = (additiveCounts[clean] || 0) + 1;
    });
  });
  return Object.entries(additiveCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([name]) => name);
}

interface HealthSnapshotProps {
  stats: UserStats;
}

export function HealthSnapshot({ stats }: HealthSnapshotProps) {
  if (stats.total_scans < 3) return null;

  const trend = getWeeklyTrend(stats.all_scores);
  const topAdditives = getTopAllergens(stats.all_scores);
  const avgScore = stats.kitchen_score;
  const excellent = stats.all_scores.filter(s => s.skaap_score >= 75).length;
  const poor = stats.all_scores.filter(s => s.skaap_score < 50).length;
  const excellentPct = Math.round((excellent / stats.all_scores.length) * 100);

  const TrendIcon = trend.direction === "up" ? TrendingUp : trend.direction === "down" ? TrendingDown : Minus;
  const trendColor = trend.direction === "up" ? "#22C55E" : trend.direction === "down" ? "#E8314A" : "#F59E0B";

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="mx-5 mt-4 mb-2"
    >
      <div className="flex items-center gap-2 mb-3">
        <Target size={16} style={{ color: "#C41E3A" }} />
        <h3 className="text-[14px] font-bold" style={{ color: "#1B2A4A" }}>Your Health</h3>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {/* Avg Score */}
        <div className="rounded-2xl p-3" style={{ background: "#F9FAFB", border: "1px solid #E5E7EB" }}>
          <div className="flex items-center gap-1.5 mb-1">
            <Shield size={13} style={{ color: avgScore >= 70 ? "#22C55E" : avgScore >= 50 ? "#F59E0B" : "#E8314A" }} />
            <span className="text-[10px] font-semibold uppercase" style={{ color: "#9CA3AF" }}>Avg Score</span>
          </div>
          <span className="text-[22px] font-extrabold" style={{ color: "#1B2A4A" }}>{avgScore}</span>
          <span className="text-[11px] ml-1" style={{ color: "#9CA3AF" }}>/100</span>
        </div>

        {/* Weekly Trend */}
        <div className="rounded-2xl p-3" style={{ background: "#F9FAFB", border: "1px solid #E5E7EB" }}>
          <div className="flex items-center gap-1.5 mb-1">
            <TrendIcon size={13} style={{ color: trendColor }} />
            <span className="text-[10px] font-semibold uppercase" style={{ color: "#9CA3AF" }}>Weekly Trend</span>
          </div>
          <span className="text-[14px] font-bold" style={{ color: trendColor }}>
            {trend.direction === "up" ? `+${trend.delta} pts` : trend.direction === "down" ? `-${trend.delta} pts` : "Steady"}
          </span>
          <p className="text-[10px] mt-0.5" style={{ color: "#9CA3AF" }}>
            {trend.direction === "up" ? "Getting healthier! 🎉" : trend.direction === "down" ? "Room to improve" : "Holding steady"}
          </p>
        </div>

        {/* Good Choices */}
        <div className="rounded-2xl p-3" style={{ background: "#F9FAFB", border: "1px solid #E5E7EB" }}>
          <div className="flex items-center gap-1.5 mb-1">
            <Flame size={13} style={{ color: "#22C55E" }} />
            <span className="text-[10px] font-semibold uppercase" style={{ color: "#9CA3AF" }}>Good Choices</span>
          </div>
          <span className="text-[22px] font-extrabold" style={{ color: "#22C55E" }}>{excellentPct}%</span>
          <p className="text-[10px] mt-0.5" style={{ color: "#9CA3AF" }}>{excellent} of {stats.all_scores.length} products</p>
        </div>

        {/* Top Concerns */}
        <div className="rounded-2xl p-3" style={{ background: "#F9FAFB", border: "1px solid #E5E7EB" }}>
          <div className="flex items-center gap-1.5 mb-1">
            <AlertTriangle size={13} style={{ color: "#F59E0B" }} />
            <span className="text-[10px] font-semibold uppercase" style={{ color: "#9CA3AF" }}>Top Additives</span>
          </div>
          {topAdditives.length > 0 ? (
            <div className="space-y-0.5">
              {topAdditives.map((a, i) => (
                <p key={i} className="text-[11px] font-medium truncate" style={{ color: "#6B7280" }}>
                  {a}
                </p>
              ))}
            </div>
          ) : (
            <p className="text-[11px]" style={{ color: "#9CA3AF" }}>None yet</p>
          )}
        </div>
      </div>

      {/* Streak reminder */}
      {stats.current_streak > 0 && (
        <div className="mt-2 flex items-center gap-2 px-3 py-2 rounded-xl" style={{ background: "#F0FDF4", border: "1px solid #BBF7D0" }}>
          <span className="text-lg">🔥</span>
          <p className="text-[12px] font-semibold" style={{ color: "#15803D" }}>
            {stats.current_streak} day streak! Keep scanning healthy products to keep it going.
          </p>
        </div>
      )}
    </motion.div>
  );
}
