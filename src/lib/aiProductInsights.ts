// AI-powered product insights using Lovable AI via edge functions
// All calls are fire-and-forget — never block the result sheet

import { supabase } from "@/integrations/supabase/client";

const AI_SUMMARY_PREFIX = "ai_summary_v2_";
const AI_DIETARY_PREFIX = "ai_dietary_";
const AI_ADDITIVE_PREFIX = "ai_additive_";
const AI_RECS_PREFIX = "ai_recs_";
const CACHE_TTL_7D = 7 * 24 * 60 * 60 * 1000;
const CACHE_TTL_30D = 30 * 24 * 60 * 60 * 1000;

interface CacheEntry<T> { data: T; ts: number; }

function getCache<T>(key: string, ttl: number): T | null {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const entry: CacheEntry<T> = JSON.parse(raw);
    if (Date.now() - entry.ts > ttl) { localStorage.removeItem(key); return null; }
    return entry.data;
  } catch { return null; }
}

function setCache<T>(key: string, data: T) {
  try { localStorage.setItem(key, JSON.stringify({ data, ts: Date.now() })); } catch {}
}

async function callInsights(body: Record<string, any>): Promise<string | null> {
  try {
    const { data, error } = await supabase.functions.invoke("ai-product-insights", { body });
    if (error || !data?.result) return null;
    return data.result;
  } catch { return null; }
}

// ─── Feature 1: AI Product Summary ───
export async function fetchAISummary(params: {
  barcode: string;
  productName: string;
  brandName?: string;
  nutriScore?: string;
  novaGroup?: number;
  additiveCount: number;
  worstRisk: string;
  isOrganic: boolean;
  nutrientLevels?: string;
}): Promise<string | null> {
  const cacheKey = AI_SUMMARY_PREFIX + params.barcode;
  const cached = getCache<string>(cacheKey, CACHE_TTL_7D);
  if (cached) return cached;

  const result = await callInsights({
    type: "summary",
    productName: params.productName,
    brandName: params.brandName || "Unknown",
    nutriScore: params.nutriScore,
    novaGroup: params.novaGroup,
    additiveCount: params.additiveCount,
    worstRisk: params.worstRisk,
    isOrganic: params.isOrganic,
    nutrientLevels: params.nutrientLevels || "none",
  });

  if (result) setCache(cacheKey, result);
  return result;
}

// ─── Feature 2: AI Additive Explainer ───
export async function fetchAdditiveExplanation(params: {
  eNumber: string;
  additiveName: string;
  riskLevel: string;
  productName: string;
}): Promise<string | null> {
  const cacheKey = AI_ADDITIVE_PREFIX + params.eNumber;
  const cached = getCache<string>(cacheKey, CACHE_TTL_30D);
  if (cached) return cached;

  const result = await callInsights({
    type: "additive",
    ...params,
  });

  if (result) setCache(cacheKey, result);
  return result;
}

// ─── Feature 3: Dietary Classification ───
export interface DietaryClassification {
  vegan: number;
  vegetarian: number;
  gluten_free: number;
  dairy_free: number;
  nut_free: number;
}

const DAIRY_KEYWORDS = ["milk", "cream", "butter", "cheese", "whey", "lactose"];
const MEAT_KEYWORDS = ["meat", "chicken", "beef", "pork", "fish", "seafood", "gelatin", "lard"];

export async function fetchDietaryClassification(params: {
  barcode: string;
  ingredientsText: string;
  allergensTags?: string[];
}): Promise<Record<string, number> | null> {
  const cacheKey = AI_DIETARY_PREFIX + params.barcode;
  const cached = getCache<Record<string, number>>(cacheKey, CACHE_TTL_7D);
  if (cached) return cached;

  const result = await callInsights({
    type: "dietary",
    ingredientsText: params.ingredientsText,
    allergensTags: params.allergensTags,
  });

  if (!result) return null;

  try {
    // Extract JSON from response
    const jsonMatch = result.match(/\{[^}]+\}/);
    if (!jsonMatch) return null;
    const scores: DietaryClassification = JSON.parse(jsonMatch[0]);

    // Apply safety overrides
    const allergens = (params.allergensTags || []).map(a => a.toLowerCase());
    const ingredients = params.ingredientsText.toLowerCase();

    if (allergens.some(a => a.includes("gluten"))) scores.gluten_free = 0;
    if (allergens.some(a => a.includes("milk"))) scores.dairy_free = 0;
    if (allergens.some(a => a.includes("nuts") || a.includes("peanuts"))) scores.nut_free = 0;
    if (DAIRY_KEYWORDS.some(k => ingredients.includes(k))) scores.dairy_free = 0;
    if (MEAT_KEYWORDS.some(k => ingredients.includes(k))) {
      scores.vegan = 0;
      scores.vegetarian = 0;
    }

    const filtered: Record<string, number> = {};
    const THRESHOLD = 0.75;
    if (scores.vegan >= THRESHOLD) filtered.vegan = scores.vegan;
    if (scores.vegetarian >= THRESHOLD) filtered.vegetarian = scores.vegetarian;
    if (scores.gluten_free >= THRESHOLD) filtered.gluten_free = scores.gluten_free;
    if (scores.dairy_free >= THRESHOLD) filtered.dairy_free = scores.dairy_free;
    if (scores.nut_free >= THRESHOLD) filtered.nut_free = scores.nut_free;

    if (Object.keys(filtered).length > 0) setCache(cacheKey, filtered);
    return Object.keys(filtered).length > 0 ? filtered : null;
  } catch { return null; }
}

// ─── Feature 4: Smart Recommendations ───
export interface AIRecommendation {
  name: string;
  reason: string;
  estimatedScore: string;
}

export async function fetchRecommendations(params: {
  barcode: string;
  productName: string;
  nutriScore?: string;
  category?: string;
  additiveCount: number;
}): Promise<AIRecommendation[] | null> {
  const cacheKey = AI_RECS_PREFIX + params.barcode;
  const cached = getCache<AIRecommendation[]>(cacheKey, CACHE_TTL_7D);
  if (cached) return cached;

  const result = await callInsights({
    type: "recommendations",
    productName: params.productName,
    nutriScore: params.nutriScore,
    category: params.category,
    additiveCount: params.additiveCount,
  });

  if (!result) return null;

  try {
    const jsonMatch = result.match(/\[[\s\S]*\]/);
    if (!jsonMatch) return null;
    const recs: AIRecommendation[] = JSON.parse(jsonMatch[0]);
    if (recs.length > 0) setCache(cacheKey, recs.slice(0, 3));
    return recs.slice(0, 3);
  } catch { return null; }
}

// ─── Dietary label display map ───
export const DIETARY_LABELS: Record<string, string> = {
  vegan: "Vegan",
  vegetarian: "Vegetarian",
  gluten_free: "Gluten-Free",
  dairy_free: "Dairy-Free",
  nut_free: "Nut-Free",
};
