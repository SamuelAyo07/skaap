import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles, ArrowRightLeft, TrendingUp, Target, Lightbulb,
  ChevronRight, RefreshCw, Barcode, Lock, Zap, Leaf, AlertTriangle,
  CheckCircle2, ArrowRight, ClipboardList,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useSubscription } from "@/context/SubscriptionContext";
import { BottomNavBar } from "./BottomNavBar";
import { getUserStats, type ScoreEntry } from "@/lib/skaapUserStats";
import { supabase } from "@/integrations/supabase/client";
import { findBannedAdditives } from "@/lib/bannedAdditives";

interface RecsScreenProps {
  onScanProduct: (barcode: string) => void;
  onNavChange: (nav: string) => void;
  onOpenScanner: () => void;
  onOpenKitchenReport?: () => void;
}

interface Swap {
  current: string;
  suggestion: string;
  reason: string;
  impact: "high" | "medium" | "low";
}

interface PersonalizedRecs {
  summary: string;
  strengths: string[];
  improvements: string[];
  swaps: Swap[];
  weeklyTip: string;
  goalSuggestion: string;
}

const RECS_CACHE_KEY = "skaap_personalized_recs";
const RECS_CACHE_TTL = 2 * 60 * 60 * 1000; // 2 hours

function getCachedRecs(): PersonalizedRecs | null {
  try {
    const raw = localStorage.getItem(RECS_CACHE_KEY);
    if (!raw) return null;
    const { data, ts } = JSON.parse(raw);
    if (Date.now() - ts > RECS_CACHE_TTL) { localStorage.removeItem(RECS_CACHE_KEY); return null; }
    return data;
  } catch { return null; }
}

function setCachedRecs(data: PersonalizedRecs) {
  try { localStorage.setItem(RECS_CACHE_KEY, JSON.stringify({ data, ts: Date.now() })); } catch {}
}

const impactConfig = {
  high: { color: "#DC2626", bg: "#FEF2F2", border: "#FECDD3", icon: AlertTriangle, label: "High impact" },
  medium: { color: "#F59E0B", bg: "#FFFBEB", border: "#FDE68A", icon: Zap, label: "Medium impact" },
  low: { color: "#22C55E", bg: "#F0FDF4", border: "#BBF7D0", icon: Leaf, label: "Small tweak" },
};

export function RecsScreen({ onScanProduct, onNavChange, onOpenScanner }: RecsScreenProps) {
  const { isPlus, openUpgrade } = useSubscription();
  const [recs, setRecs] = useState<PersonalizedRecs | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedSwap, setExpandedSwap] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<"swaps" | "insights">("swaps");

  const stats = getUserStats();
  const hasHistory = stats.all_scores.length >= 3;

  const fetchRecs = useCallback(async (force = false) => {
    if (!hasHistory) return;

    if (!force) {
      const cached = getCachedRecs();
      if (cached) { setRecs(cached); return; }
    }

    setLoading(true);
    setError(null);

    try {
      // Build scan history summary for AI
      const recent = stats.all_scores.slice(0, 15);
      const scanSummary = recent.map((s: ScoreEntry, i: number) => {
        const grade = s.nutriscore_grade ? `Nutri-Score ${s.nutriscore_grade.toUpperCase()}` : "no grade";
        const nova = s.nova_group ? `NOVA ${s.nova_group}` : "";
        const adds = s.additives?.length ? `${s.additives.length} additives` : "0 additives";
        return `${i + 1}. ${s.product_name}${s.brand ? ` (${s.brand})` : ""} — Score: ${s.skaap_score}/100, ${grade}, ${nova}, ${adds}`;
      }).join("\n");

      const { data, error: fnError } = await supabase.functions.invoke("ai-product-insights", {
        body: {
          type: "personalized-recs",
          scanHistory: scanSummary,
          kitchenScore: stats.kitchen_score,
        },
      });

      if (fnError) throw fnError;
      if (!data?.result) throw new Error("No result");

      const jsonMatch = data.result.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error("Invalid response");

      const parsed: PersonalizedRecs = JSON.parse(jsonMatch[0]);
      setRecs(parsed);
      setCachedRecs(parsed);
    } catch (e: any) {
      setError(e?.message?.includes("Rate") ? "Too many requests — try again in a minute" : "Couldn't generate recommendations right now");
    }
    setLoading(false);
  }, [hasHistory, stats]);

  useEffect(() => { fetchRecs(); }, [fetchRecs]);

  // Not enough history
  if (!hasHistory) {
    return (
      <div className="min-h-screen flex flex-col" style={{ maxWidth: 430, margin: "0 auto", background: "#FFFFFF" }}>
        <div className="flex-1 flex flex-col items-center justify-center px-8 text-center">
          <div className="w-20 h-20 rounded-full flex items-center justify-center" style={{ background: "#FEF3C7", border: "1px solid #FDE68A" }}>
            <Sparkles size={32} style={{ color: "#F59E0B" }} />
          </div>
          <h2 className="font-extrabold text-[22px] mt-6" style={{ color: "#1A1A1A" }}>
            Scan more to unlock
          </h2>
          <p className="text-[14px] mt-3 leading-relaxed" style={{ color: "#6B7280" }}>
            We need at least 3 scans to personalize your recommendations. You've scanned {stats.total_scans} so far.
          </p>
          <div className="flex gap-2 mt-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="w-3 h-3 rounded-full" style={{
                background: stats.total_scans >= i ? "#E8314A" : "#E5E7EB"
              }} />
            ))}
          </div>
          <motion.button whileTap={{ scale: 0.97 }} onClick={onOpenScanner}
            className="mt-8 font-bold text-[15px] text-white"
            style={{ height: 52, width: "100%", maxWidth: 260, borderRadius: 16, background: "linear-gradient(135deg, #E8314A, #c42040)", boxShadow: "0 4px 16px rgba(232,49,74,0.25)" }}>
            Start Scanning
          </motion.button>
        </div>
        <BottomNavBar active="kitchen" onNavigate={onNavChange} />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ maxWidth: 430, margin: "0 auto", background: "#FFFFFF" }}>
      {/* Header */}
      <div className="px-5 pt-[env(safe-area-inset-top,12px)] mt-2">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Sparkles size={18} style={{ color: "#E8314A" }} />
              <h1 className="font-extrabold text-[22px]" style={{ color: "#1A1A1A" }}>For You</h1>
            </div>
            <p className="text-[12px] mt-0.5" style={{ color: "#9CA3AF" }}>
              Personalized from your {stats.total_scans} scans · ✦ AI
            </p>
          </div>
          <motion.button whileTap={{ scale: 0.9 }} onClick={() => fetchRecs(true)}
            disabled={loading}
            className="w-9 h-9 rounded-full flex items-center justify-center"
            style={{ background: "#F3F4F6" }}>
            <RefreshCw size={16} style={{ color: loading ? "#D1D5DB" : "#6B7280" }}
              className={loading ? "animate-spin" : ""} />
          </motion.button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pb-24">
        {/* Loading state */}
        {loading && !recs && (
          <div className="px-5 mt-6 space-y-4">
            <div className="rounded-2xl p-5" style={{ background: "#F9FAFB", border: "1px solid #F3F4F6" }}>
              <div className="flex items-center gap-2 mb-4">
                <Sparkles size={14} style={{ color: "#E8314A" }} className="animate-pulse" />
                <span className="text-[13px] font-semibold" style={{ color: "#E8314A" }}>Analyzing your scan history...</span>
              </div>
              <Skeleton className="h-4 w-full mb-2" style={{ background: "#E5E7EB" }} />
              <Skeleton className="h-4 w-3/4" style={{ background: "#E5E7EB" }} />
            </div>
            {[1, 2, 3].map(i => (
              <div key={i} className="rounded-2xl p-4" style={{ background: "#F9FAFB", border: "1px solid #F3F4F6" }}>
                <div className="flex gap-3">
                  <Skeleton className="w-12 h-12 rounded-xl" style={{ background: "#E5E7EB" }} />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-3 w-2/3" style={{ background: "#E5E7EB" }} />
                    <Skeleton className="h-3 w-1/2" style={{ background: "#E5E7EB" }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Error state */}
        {error && !loading && (
          <div className="px-5 mt-6">
            <div className="rounded-2xl p-5 text-center" style={{ background: "#FEF2F2", border: "1px solid #FECDD3" }}>
              <p className="text-[14px] font-medium" style={{ color: "#DC2626" }}>{error}</p>
              <motion.button whileTap={{ scale: 0.97 }} onClick={() => fetchRecs(true)}
                className="mt-3 px-5 py-2 rounded-xl font-semibold text-[13px] text-white"
                style={{ background: "#E8314A" }}>
                Try Again
              </motion.button>
            </div>
          </div>
        )}

        {/* Recs content */}
        {recs && !loading && (
          <>
            {/* Summary card */}
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
              className="mx-5 mt-5 rounded-2xl p-5"
              style={{ background: "linear-gradient(135deg, #FFF5F5, #FFFBEB)", border: "1px solid #FECDD3" }}>
              <p className="text-[15px] font-semibold leading-relaxed" style={{ color: "#1A1A1A" }}>
                {recs.summary}
              </p>
              <div className="flex items-center gap-2 mt-3">
                <div className="px-3 py-1 rounded-full text-[11px] font-bold" style={{ background: "#FFFFFF", color: "#E8314A", border: "1px solid #FECDD3" }}>
                  🏠 Kitchen Score: {stats.kitchen_score}/100
                </div>
              </div>
            </motion.div>

            {/* Goal suggestion */}
            {recs.goalSuggestion && (
              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                className="mx-5 mt-3 rounded-2xl p-4 flex items-center gap-3"
                style={{ background: "#F0FDF4", border: "1px solid #BBF7D0" }}>
                <Target size={20} style={{ color: "#15803D" }} />
                <div className="flex-1">
                  <p className="text-[11px] font-bold uppercase tracking-wider" style={{ color: "#15803D" }}>Weekly Goal</p>
                  <p className="text-[13px] font-medium mt-0.5" style={{ color: "#166534" }}>{recs.goalSuggestion}</p>
                </div>
              </motion.div>
            )}

            {/* Tab toggle */}
            <div className="flex items-center mx-5 mt-5 gap-0 rounded-xl overflow-hidden" style={{ background: "#F3F4F6" }}>
              <button onClick={() => setActiveTab("swaps")}
                className="flex-1 text-center py-2.5 text-[13px] font-bold transition-all"
                style={{
                  background: activeTab === "swaps" ? "#FFFFFF" : "transparent",
                  color: activeTab === "swaps" ? "#1A1A1A" : "#9CA3AF",
                  borderRadius: activeTab === "swaps" ? 10 : 0,
                  margin: 3,
                  boxShadow: activeTab === "swaps" ? "0 1px 3px rgba(0,0,0,0.06)" : "none",
                }}>
                🔄 Smart Swaps
              </button>
              <button onClick={() => setActiveTab("insights")}
                className="flex-1 text-center py-2.5 text-[13px] font-bold transition-all"
                style={{
                  background: activeTab === "insights" ? "#FFFFFF" : "transparent",
                  color: activeTab === "insights" ? "#1A1A1A" : "#9CA3AF",
                  borderRadius: activeTab === "insights" ? 10 : 0,
                  margin: 3,
                  boxShadow: activeTab === "insights" ? "0 1px 3px rgba(0,0,0,0.06)" : "none",
                }}>
                💡 Insights
              </button>
            </div>

            {/* Swaps tab */}
            <AnimatePresence mode="wait">
              {activeTab === "swaps" && (
                <motion.div key="swaps"
                  initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }}
                  className="px-5 mt-4 space-y-3">
                  <p className="text-[12px] font-bold uppercase tracking-wider" style={{ color: "#E8314A" }}>
                    Recommended swaps
                  </p>

                  {recs.swaps.map((swap, idx) => {
                    const config = impactConfig[swap.impact] || impactConfig.medium;
                    const ImpactIcon = config.icon;
                    const isExpanded = expandedSwap === idx;

                    return (
                      <motion.div key={idx}
                        initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        className="rounded-2xl overflow-hidden"
                        style={{ border: `1px solid ${config.border}`, background: "#FFFFFF" }}>
                        <button
                          onClick={() => setExpandedSwap(isExpanded ? null : idx)}
                          className="w-full p-4 text-left">
                          <div className="flex items-start gap-3">
                            <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                              style={{ background: config.bg }}>
                              <ArrowRightLeft size={18} style={{ color: config.color }} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <p className="text-[14px] font-semibold truncate" style={{ color: "#1A1A1A" }}>
                                  {swap.current}
                                </p>
                              </div>
                              <div className="flex items-center gap-1.5 mt-1">
                                <ArrowRight size={12} style={{ color: "#22C55E" }} />
                                <p className="text-[13px] font-medium" style={{ color: "#22C55E" }}>
                                  {swap.suggestion}
                                </p>
                              </div>
                            </div>
                            <div className="flex-shrink-0 flex items-center gap-1 px-2 py-1 rounded-full"
                              style={{ background: config.bg }}>
                              <ImpactIcon size={10} style={{ color: config.color }} />
                              <span className="text-[10px] font-bold" style={{ color: config.color }}>
                                {config.label}
                              </span>
                            </div>
                          </div>
                        </button>

                        <AnimatePresence>
                          {isExpanded && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: "auto", opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              className="overflow-hidden">
                              <div className="px-4 pb-4 pt-0">
                                <div className="rounded-xl p-3" style={{ background: "#F9FAFB" }}>
                                  <p className="text-[13px] leading-relaxed" style={{ color: "#374151" }}>
                                    {swap.reason}
                                  </p>
                                </div>
                                <motion.button whileTap={{ scale: 0.97 }}
                                  onClick={() => {
                                    // Search for the suggested product on OpenFoodFacts
                                    const query = encodeURIComponent(swap.suggestion);
                                    window.open(`https://world.openfoodfacts.org/cgi/search.pl?search_terms=${query}&json=0`, "_blank");
                                  }}
                                  className="mt-2 w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-[13px] font-semibold"
                                  style={{ background: "#F0FDF4", color: "#15803D", border: "1px solid #BBF7D0" }}>
                                  <Barcode size={14} /> Find this product
                                </motion.button>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </motion.div>
                    );
                  })}
                </motion.div>
              )}

              {activeTab === "insights" && (
                <motion.div key="insights"
                  initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }}
                  className="px-5 mt-4 space-y-4">

                  {/* Strengths */}
                  <div>
                    <div className="flex items-center gap-1.5 mb-2">
                      <CheckCircle2 size={14} style={{ color: "#22C55E" }} />
                      <p className="text-[12px] font-bold uppercase tracking-wider" style={{ color: "#22C55E" }}>
                        Your strengths
                      </p>
                    </div>
                    <div className="space-y-2">
                      {recs.strengths.map((s, i) => (
                        <motion.div key={i}
                          initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.05 }}
                          className="flex items-start gap-3 p-3 rounded-xl"
                          style={{ background: "#F0FDF4", border: "1px solid #BBF7D0" }}>
                          <span className="text-[14px] mt-0.5">✅</span>
                          <p className="text-[13px] font-medium" style={{ color: "#166534" }}>{s}</p>
                        </motion.div>
                      ))}
                    </div>
                  </div>

                  {/* Improvements */}
                  <div>
                    <div className="flex items-center gap-1.5 mb-2">
                      <TrendingUp size={14} style={{ color: "#F59E0B" }} />
                      <p className="text-[12px] font-bold uppercase tracking-wider" style={{ color: "#F59E0B" }}>
                        Room to grow
                      </p>
                    </div>
                    <div className="space-y-2">
                      {recs.improvements.map((s, i) => (
                        <motion.div key={i}
                          initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.05 }}
                          className="flex items-start gap-3 p-3 rounded-xl"
                          style={{ background: "#FFFBEB", border: "1px solid #FDE68A" }}>
                          <span className="text-[14px] mt-0.5">💡</span>
                          <p className="text-[13px] font-medium" style={{ color: "#92400E" }}>{s}</p>
                        </motion.div>
                      ))}
                    </div>
                  </div>

                  {/* Weekly tip */}
                  {recs.weeklyTip && (
                    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
                      className="rounded-2xl p-4 flex items-start gap-3"
                      style={{ background: "#EFF6FF", border: "1px solid #BFDBFE" }}>
                      <Lightbulb size={20} style={{ color: "#2563EB" }} className="flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-[11px] font-bold uppercase tracking-wider" style={{ color: "#2563EB" }}>Weekly Tip</p>
                        <p className="text-[13px] font-medium mt-1 leading-relaxed" style={{ color: "#1E40AF" }}>
                          {recs.weeklyTip}
                        </p>
                      </div>
                    </motion.div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </>
        )}

        {/* Empty state when no recs and not loading */}
        {!recs && !loading && !error && (
          <div className="px-5 mt-6 text-center py-16">
            <Sparkles size={32} style={{ color: "#E5E7EB" }} className="mx-auto" />
            <p className="text-[14px] mt-3 font-medium" style={{ color: "#9CA3AF" }}>
              Your personalized recommendations will appear here
            </p>
          </div>
        )}
      </div>

      <BottomNavBar active="kitchen" onNavigate={onNavChange} />
    </div>
  );
}
