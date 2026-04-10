import { motion } from "framer-motion";
import { Gift, ChevronRight, Star, Zap } from "lucide-react";
import {
  getShareRewards, getCurrentTitle, getNextBadge, getTierProgress, getBonusScansRemaining,
} from "@/lib/shareRewards";

interface ShareRewardsCardProps {
  onShare: () => void;
}

export function ShareRewardsCard({ onShare }: ShareRewardsCardProps) {
  const rewards = getShareRewards();
  const title = getCurrentTitle();
  const nextBadge = getNextBadge();
  const tier = getTierProgress();
  const bonusScans = getBonusScansRemaining();

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl overflow-hidden"
      style={{ background: "linear-gradient(135deg, #1a0a10, #2a0f1a)", border: "1px solid rgba(196,30,58,0.2)" }}
    >
      <div className="px-4 py-3.5">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Gift size={16} style={{ color: "#C41E3A" }} />
            <span className="text-[13px] font-bold" style={{ color: "#fff" }}>Share Rewards</span>
          </div>
          <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full"
            style={{ background: "rgba(196,30,58,0.15)", color: "#E8314A" }}>
            {title.emoji} {title.name}
          </span>
        </div>

        {/* Stats row */}
        <div className="flex items-center gap-3 mb-3">
          <div className="flex-1 rounded-xl px-3 py-2" style={{ background: "rgba(255,255,255,0.06)" }}>
            <p className="text-[10px] font-semibold uppercase" style={{ color: "rgba(255,255,255,0.4)" }}>Shares</p>
            <p className="text-[18px] font-extrabold" style={{ color: "#fff" }}>{rewards.total_shares}</p>
          </div>
          <div className="flex-1 rounded-xl px-3 py-2" style={{ background: "rgba(255,255,255,0.06)" }}>
            <p className="text-[10px] font-semibold uppercase" style={{ color: "rgba(255,255,255,0.4)" }}>
              <Zap size={10} className="inline mr-0.5" />Bonus scans
            </p>
            <p className="text-[18px] font-extrabold" style={{ color: "#22C55E" }}>{bonusScans}</p>
          </div>
          <div className="flex-1 rounded-xl px-3 py-2" style={{ background: "rgba(255,255,255,0.06)" }}>
            <p className="text-[10px] font-semibold uppercase" style={{ color: "rgba(255,255,255,0.4)" }}>Badges</p>
            <p className="text-[18px] font-extrabold" style={{ color: "#F59E0B" }}>
              {rewards.badges.length > 0 ? rewards.badges.map(b => b.emoji).join("") : "—"}
            </p>
          </div>
        </div>

        {/* Progress to next badge */}
        {nextBadge && (
          <div className="mb-3">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[11px] font-semibold" style={{ color: "rgba(255,255,255,0.5)" }}>
                Next: {nextBadge.emoji} {nextBadge.name}
              </span>
              <span className="text-[11px] font-bold" style={{ color: "#C41E3A" }}>
                {nextBadge.sharesNeeded} shares away
              </span>
            </div>
            <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.08)" }}>
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${tier.percent}%` }}
                transition={{ duration: 0.6, ease: "easeOut" }}
                className="h-full rounded-full"
                style={{ background: "linear-gradient(90deg, #C41E3A, #E8314A)" }}
              />
            </div>
          </div>
        )}

        {/* Perks info */}
        <div className="flex items-center gap-2 mb-3 px-2 py-1.5 rounded-lg" style={{ background: "rgba(34,197,94,0.08)" }}>
          <Star size={12} style={{ color: "#22C55E" }} />
          <span className="text-[10px] font-medium" style={{ color: "rgba(255,255,255,0.6)" }}>
            Each share = 2 bonus scans · Every 5 shares = 1 day Plus trial
          </span>
        </div>

        {/* CTA */}
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={onShare}
          className="w-full flex items-center justify-center gap-2 rounded-xl font-bold text-[13px]"
          style={{
            height: 44,
            background: "linear-gradient(135deg, #C41E3A, #8a1825)",
            color: "#fff",
            boxShadow: "0 4px 20px rgba(196,30,58,0.3)",
          }}
        >
          Share & earn rewards <ChevronRight size={14} />
        </motion.button>
      </div>
    </motion.div>
  );
}
