// ─── SKAAP User Stats — localStorage persistence layer ───

const STATS_KEY = "skaap_user_stats";
const LAST_SHARE_TYPE_KEY = "skaap_last_share_type";

export interface ScoreEntry {
  barcode: string;
  product_name: string;
  brand?: string;
  skaap_score: number;
  nutriscore_grade?: string;
  scanned_at: number;
  image_url?: string;
  additives?: string[];
  nova_group?: number;
}

export interface UserStats {
  total_scans: number;
  all_scores: ScoreEntry[];
  daily_scan_dates: string[];
  current_streak: number;
  best_score_ever: ScoreEntry | null;
  worst_score_ever: ScoreEntry | null;
  kitchen_score: number;
  kitchen_percentile: number;
}

const DEFAULT_STATS: UserStats = {
  total_scans: 0,
  all_scores: [],
  daily_scan_dates: [],
  current_streak: 0,
  best_score_ever: null,
  worst_score_ever: null,
  kitchen_score: 0,
  kitchen_percentile: 0,
};

export function getUserStats(): UserStats {
  try {
    const raw = localStorage.getItem(STATS_KEY);
    if (!raw) return { ...DEFAULT_STATS };
    return { ...DEFAULT_STATS, ...JSON.parse(raw) };
  } catch {
    return { ...DEFAULT_STATS };
  }
}

function saveStats(stats: UserStats) {
  try {
    localStorage.setItem(STATS_KEY, JSON.stringify(stats));
  } catch {}
}

function calcKitchenPercentile(kitchenScore: number): number {
  let p: number;
  if (kitchenScore < 40) p = Math.round((kitchenScore / 40) * 20);
  else if (kitchenScore < 50) p = 20 + Math.round(((kitchenScore - 40) / 10) * 15);
  else if (kitchenScore < 60) p = 35 + Math.round(((kitchenScore - 50) / 10) * 20);
  else if (kitchenScore < 70) p = 55 + Math.round(((kitchenScore - 60) / 10) * 20);
  else if (kitchenScore < 80) p = 75 + Math.round(((kitchenScore - 70) / 10) * 15);
  else p = 90 + Math.round(((Math.min(kitchenScore, 100) - 80) / 20) * 10);
  // Round to nearest 5
  return Math.round(p / 5) * 5;
}

function recalcStreak(dates: string[]): number {
  if (dates.length === 0) return 0;
  const sorted = [...new Set(dates)].sort().reverse();
  const today = new Date();
  const todayStr = today.toISOString().slice(0, 10);
  const yesterdayStr = new Date(today.getTime() - 86400000).toISOString().slice(0, 10);

  // Streak must start from today or yesterday
  if (sorted[0] !== todayStr && sorted[0] !== yesterdayStr) return 0;

  let streak = 1;
  for (let i = 1; i < sorted.length; i++) {
    const prev = new Date(sorted[i - 1] + "T00:00:00");
    const curr = new Date(sorted[i] + "T00:00:00");
    const diff = (prev.getTime() - curr.getTime()) / 86400000;
    if (diff === 1) streak++;
    else break;
  }
  return streak;
}

export function recordScan(entry: ScoreEntry): UserStats {
  const stats = getUserStats();

  stats.total_scans++;

  // Add to all_scores (FIFO 500)
  stats.all_scores.unshift(entry);
  if (stats.all_scores.length > 500) stats.all_scores = stats.all_scores.slice(0, 500);

  // Best/worst
  if (!stats.best_score_ever || entry.skaap_score > stats.best_score_ever.skaap_score) {
    stats.best_score_ever = entry;
  }
  if (!stats.worst_score_ever || entry.skaap_score < stats.worst_score_ever.skaap_score) {
    stats.worst_score_ever = entry;
  }

  // Kitchen score (rolling average)
  const sum = stats.all_scores.reduce((a, b) => a + b.skaap_score, 0);
  stats.kitchen_score = Math.round(sum / stats.all_scores.length);
  stats.kitchen_percentile = calcKitchenPercentile(stats.kitchen_score);

  // Streak: add date if score >= 70
  if (entry.skaap_score >= 70) {
    const dateStr = new Date().toISOString().slice(0, 10);
    if (!stats.daily_scan_dates.includes(dateStr)) {
      stats.daily_scan_dates.push(dateStr);
    }
  }
  stats.current_streak = recalcStreak(stats.daily_scan_dates);

  saveStats(stats);
  return stats;
}

export function refreshStreak(): UserStats {
  const stats = getUserStats();
  stats.current_streak = recalcStreak(stats.daily_scan_dates);
  saveStats(stats);
  return stats;
}

export function getLastShareType(): string {
  try {
    return localStorage.getItem(LAST_SHARE_TYPE_KEY) || "product";
  } catch {
    return "product";
  }
}

export function setLastShareType(type: string) {
  try {
    localStorage.setItem(LAST_SHARE_TYPE_KEY, type);
  } catch {}
}
