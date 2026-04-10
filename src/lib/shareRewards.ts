// ─── SKAAP Share Rewards System ───
// Tiered benefits: extra scans, premium trial days, achievement badges

const REWARDS_KEY = "skaap_share_rewards";

export interface ShareRewardsState {
  total_shares: number;
  referral_count: number;
  bonus_scans_earned: number;
  bonus_scans_used: number;
  trial_days_earned: number;
  badges: Badge[];
  share_history: ShareEvent[];
}

export interface ShareEvent {
  type: "product" | "kitchen" | "swap" | "streak" | "worst" | "challenge";
  platform: string;
  timestamp: number;
}

export interface Badge {
  id: string;
  name: string;
  emoji: string;
  description: string;
  earned_at: number;
}

// ─── Badge definitions ───
const BADGE_DEFS: { id: string; name: string; emoji: string; description: string; threshold: number }[] = [
  { id: "first_share", name: "First Share", emoji: "🌱", description: "Shared your first product", threshold: 1 },
  { id: "social_starter", name: "Social Starter", emoji: "📢", description: "Shared 5 times", threshold: 5 },
  { id: "health_advocate", name: "Health Advocate", emoji: "💪", description: "Shared 15 times", threshold: 15 },
  { id: "food_influencer", name: "Food Influencer", emoji: "⭐", description: "Shared 30 times", threshold: 30 },
  { id: "health_ambassador", name: "Health Ambassador", emoji: "🏆", description: "Shared 50 times", threshold: 50 },
  { id: "skaap_legend", name: "SKAAP Legend", emoji: "👑", description: "Shared 100 times", threshold: 100 },
];

// ─── Tier config ───
const SCANS_PER_SHARE = 2;       // 2 bonus scans per share
const TRIAL_DAYS_PER_5_SHARES = 1; // 1 trial day per 5 shares
const MAX_TRIAL_DAYS = 14;
const MAX_BONUS_SCANS = 100;

const DEFAULT_STATE: ShareRewardsState = {
  total_shares: 0,
  referral_count: 0,
  bonus_scans_earned: 0,
  bonus_scans_used: 0,
  trial_days_earned: 0,
  badges: [],
  share_history: [],
};

export function getShareRewards(): ShareRewardsState {
  try {
    const raw = localStorage.getItem(REWARDS_KEY);
    if (!raw) return { ...DEFAULT_STATE, badges: [], share_history: [] };
    const parsed = JSON.parse(raw);
    return { ...DEFAULT_STATE, ...parsed };
  } catch {
    return { ...DEFAULT_STATE, badges: [], share_history: [] };
  }
}

function saveRewards(state: ShareRewardsState) {
  try {
    localStorage.setItem(REWARDS_KEY, JSON.stringify(state));
  } catch {}
}

export function recordShare(type: ShareEvent["type"], platform: string): {
  state: ShareRewardsState;
  newBadges: Badge[];
  bonusScansAdded: number;
  trialDaysAdded: number;
} {
  const state = getShareRewards();
  const prevShares = state.total_shares;

  state.total_shares++;
  state.share_history.unshift({ type, platform, timestamp: Date.now() });
  if (state.share_history.length > 200) state.share_history = state.share_history.slice(0, 200);

  // Bonus scans
  const bonusScansAdded = Math.min(SCANS_PER_SHARE, MAX_BONUS_SCANS - state.bonus_scans_earned);
  state.bonus_scans_earned += bonusScansAdded;

  // Trial days (every 5 shares)
  let trialDaysAdded = 0;
  if (Math.floor(state.total_shares / 5) > Math.floor(prevShares / 5)) {
    trialDaysAdded = Math.min(TRIAL_DAYS_PER_5_SHARES, MAX_TRIAL_DAYS - state.trial_days_earned);
    state.trial_days_earned += trialDaysAdded;
  }

  // Check for new badges
  const newBadges: Badge[] = [];
  for (const def of BADGE_DEFS) {
    if (state.total_shares >= def.threshold && !state.badges.some(b => b.id === def.id)) {
      const badge: Badge = {
        id: def.id,
        name: def.name,
        emoji: def.emoji,
        description: def.description,
        earned_at: Date.now(),
      };
      state.badges.push(badge);
      newBadges.push(badge);
    }
  }

  saveRewards(state);
  return { state, newBadges, bonusScansAdded, trialDaysAdded };
}

export function useBonusScan(): boolean {
  const state = getShareRewards();
  const available = state.bonus_scans_earned - state.bonus_scans_used;
  if (available <= 0) return false;
  state.bonus_scans_used++;
  saveRewards(state);
  return true;
}

export function getBonusScansRemaining(): number {
  const state = getShareRewards();
  return Math.max(0, state.bonus_scans_earned - state.bonus_scans_used);
}

export function getNextBadge(): { name: string; emoji: string; sharesNeeded: number } | null {
  const state = getShareRewards();
  for (const def of BADGE_DEFS) {
    if (!state.badges.some(b => b.id === def.id)) {
      return { name: def.name, emoji: def.emoji, sharesNeeded: def.threshold - state.total_shares };
    }
  }
  return null;
}

export function getCurrentTitle(): { name: string; emoji: string } {
  const state = getShareRewards();
  if (state.badges.length === 0) return { name: "Newcomer", emoji: "🌱" };
  const last = state.badges[state.badges.length - 1];
  return { name: last.name, emoji: last.emoji };
}

export function getTierProgress(): { current: number; next: number; percent: number } {
  const state = getShareRewards();
  const tiers = BADGE_DEFS.map(d => d.threshold);
  const current = state.total_shares;
  const nextTier = tiers.find(t => t > current) || tiers[tiers.length - 1];
  const prevTier = tiers.filter(t => t <= current).pop() || 0;
  const range = nextTier - prevTier;
  const percent = range > 0 ? Math.min(100, Math.round(((current - prevTier) / range) * 100)) : 100;
  return { current, next: nextTier, percent };
}
