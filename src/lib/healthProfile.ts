// SKAAP Health Profile — Plus-only personalization layer.
// Stores the user's primary goal + dietary + avoids, and powers AI Decision Card.

import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";

export type HealthGoal =
  | "weight_loss"
  | "muscle_gain"
  | "diabetes"
  | "heart"
  | "gut"
  | "pregnancy"
  | "parent"
  | "general_wellness";

export interface HealthProfile {
  goal: HealthGoal;
  dietary: string[];
  avoid_ingredients: string[];
  budget_sensitivity: "low" | "medium" | "high";
}

export const GOAL_OPTIONS: { id: HealthGoal; label: string; emoji: string; tagline: string }[] = [
  { id: "weight_loss", label: "Weight loss", emoji: "⚖️", tagline: "Cut sugar, keep fiber, stay full" },
  { id: "muscle_gain", label: "Muscle / gym", emoji: "💪", tagline: "Protein density, clean fuel" },
  { id: "diabetes", label: "Blood sugar", emoji: "🩸", tagline: "Low sugar, low GI swaps" },
  { id: "heart", label: "Heart health", emoji: "❤️", tagline: "Less sat fat & sodium" },
  { id: "gut", label: "Gut health", emoji: "🌿", tagline: "Fiber, fewer additives" },
  { id: "pregnancy", label: "Pregnancy", emoji: "🤰", tagline: "Safety-first ingredient checks" },
  { id: "parent", label: "Shopping for kids", emoji: "👶", tagline: "Kid-safe additives & sugar" },
  { id: "general_wellness", label: "General wellness", emoji: "🌟", tagline: "Balanced everyday eating" },
];

const DEFAULT_PROFILE: HealthProfile = {
  goal: "general_wellness",
  dietary: [],
  avoid_ingredients: [],
  budget_sensitivity: "medium",
};

const LOCAL_KEY = "skaap_health_profile_local"; // for guests / before auth

function readLocal(): HealthProfile | null {
  try {
    const raw = localStorage.getItem(LOCAL_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

function writeLocal(p: HealthProfile) {
  try { localStorage.setItem(LOCAL_KEY, JSON.stringify(p)); } catch {}
}

export function useHealthProfile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<HealthProfile | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!user) {
        if (!cancelled) {
          setProfile(readLocal());
          setLoaded(true);
        }
        return;
      }
      const { data } = await supabase
        .from("user_health_profile")
        .select("goal, dietary, avoid_ingredients, budget_sensitivity")
        .eq("user_id", user.id)
        .maybeSingle();
      if (cancelled) return;
      if (data) {
        setProfile({
          goal: data.goal as HealthGoal,
          dietary: data.dietary || [],
          avoid_ingredients: data.avoid_ingredients || [],
          budget_sensitivity: (data.budget_sensitivity as any) || "medium",
        });
      } else {
        setProfile(readLocal());
      }
      setLoaded(true);
    })();
    return () => { cancelled = true; };
  }, [user]);

  const save = useCallback(async (next: HealthProfile) => {
    setProfile(next);
    writeLocal(next);
    if (user) {
      await supabase.from("user_health_profile").upsert({
        user_id: user.id,
        goal: next.goal,
        dietary: next.dietary,
        avoid_ingredients: next.avoid_ingredients,
        budget_sensitivity: next.budget_sensitivity,
      }, { onConflict: "user_id" });
    }
  }, [user]);

  return { profile: profile || DEFAULT_PROFILE, hasProfile: !!profile, loaded, save };
}

// ─── AI Decision Card data ───
export interface AIDecision {
  verdict: "great_pick" | "ok_sometimes" | "skip_it";
  headline: string;
  why: string[];
  swap_hint: string;
  fit_score: number;
}

const DECISION_CACHE_PREFIX = "skaap_decision_v1_";
const DECISION_TTL = 7 * 24 * 60 * 60 * 1000; // 7 days

export async function fetchAIDecision(params: {
  barcode: string;
  productName: string;
  brandName?: string;
  nutriScore?: string;
  novaGroup?: number;
  additiveCount: number;
  worstRisk?: string;
  isOrganic?: boolean;
  nutrientLevels?: string;
  sugar100g?: number;
  protein100g?: number;
  fiber100g?: number;
  satFat100g?: number;
  profile: HealthProfile;
}): Promise<AIDecision | null> {
  const cacheKey = `${DECISION_CACHE_PREFIX}${params.barcode}_${params.profile.goal}`;
  try {
    const raw = localStorage.getItem(cacheKey);
    if (raw) {
      const { data, ts } = JSON.parse(raw);
      if (Date.now() - ts < DECISION_TTL) return data;
    }
  } catch {}

  try {
    let extraGoals: string[] = [];
    try {
      const raw = localStorage.getItem("skaap_extra_goals_v1");
      if (raw) extraGoals = JSON.parse(raw);
    } catch {}
    const { data, error } = await supabase.functions.invoke("ai-product-insights", {
      body: {
        type: "decision",
        productName: params.productName,
        brandName: params.brandName,
        nutriScore: params.nutriScore,
        novaGroup: params.novaGroup,
        additiveCount: params.additiveCount,
        worstRisk: params.worstRisk || "",
        isOrganic: !!params.isOrganic,
        nutrientLevels: params.nutrientLevels || "",
        sugar100g: params.sugar100g,
        protein100g: params.protein100g,
        fiber100g: params.fiber100g,
        satFat100g: params.satFat100g,
        goal: params.profile.goal,
        extraGoals,
        dietary: params.profile.dietary,
        avoidIngredients: params.profile.avoid_ingredients,
        budgetSensitivity: params.profile.budget_sensitivity,
      },
    });
    if (error || !data?.result) return null;
    const jsonMatch = String(data.result).match(/\{[\s\S]*\}/);
    if (!jsonMatch) return null;
    const parsed = JSON.parse(jsonMatch[0]) as AIDecision;
    try { localStorage.setItem(cacheKey, JSON.stringify({ data: parsed, ts: Date.now() })); } catch {}
    return parsed;
  } catch {
    return null;
  }
}

// ─── Free peek helper ───
const FREE_PEEK_KEY = "skaap_free_peek_used_v1";
export function hasUsedFreePeek(): boolean {
  try { return localStorage.getItem(FREE_PEEK_KEY) === "1"; } catch { return false; }
}
export function consumeFreePeek() {
  try { localStorage.setItem(FREE_PEEK_KEY, "1"); } catch {}
}
