import bannedData from "@/data/banned_additives_north_america.json";

export interface BannedAdditive {
  id: string;
  codes: string[];
  name: string;
  us_status: string;
  eu_status: string;
  canada_status: string;
  california_status: string;
  nigeria_status?: string;
  japan_status?: string;
  india_status?: string;
  china_status?: string;
  australia_status?: string;
  brazil_status?: string;
  ban_year_eu: number | null;
  ban_year_us?: number;
  risk_reason: string;
  efsa_opinion: string;
  fda_position: string;
  sources: string[];
}

const additives: BannedAdditive[] = bannedData as BannedAdditive[];

// Build lookup index for fast matching
const codeIndex = new Map<string, BannedAdditive>();
additives.forEach(a => {
  a.codes.forEach(code => {
    codeIndex.set(code.toLowerCase(), a);
  });
  // Also index by id
  codeIndex.set(a.id.toLowerCase(), a);
});

/**
 * Match an Open Food Facts additive tag (e.g. "en:e171", "en:e320-bha")
 * against the banned additives database.
 */
export function matchBannedAdditive(tag: string): BannedAdditive | null {
  const clean = tag.replace(/^en:/, "").toLowerCase().trim();

  // Direct match
  if (codeIndex.has(clean)) return codeIndex.get(clean)!;

  // Try e-number prefix (e.g. "e320-bha" -> "e320")
  const eNum = clean.replace(/-.*$/, "");
  if (codeIndex.has(eNum)) return codeIndex.get(eNum)!;

  // Try full name match
  const readable = clean.replace(/-/g, " ");
  if (codeIndex.has(readable)) return codeIndex.get(readable)!;

  return null;
}

/**
 * Check if a product contains any EU-banned additives.
 * Returns the list of matched banned additives.
 */
export function findBannedAdditives(additiveTags?: string[]): BannedAdditive[] {
  if (!additiveTags?.length) return [];
  const matches: BannedAdditive[] = [];
  const seen = new Set<string>();
  additiveTags.forEach(tag => {
    const match = matchBannedAdditive(tag);
    if (match && !seen.has(match.id)) {
      seen.add(match.id);
      matches.push(match);
    }
  });
  return matches;
}

/**
 * Check if a product contains any ingredients from the banned list
 * by scanning the ingredients text.
 */
export function findBannedInIngredients(ingredientsText?: string): BannedAdditive[] {
  if (!ingredientsText) return [];
  const lower = ingredientsText.toLowerCase();
  const matches: BannedAdditive[] = [];
  const seen = new Set<string>();
  additives.forEach(a => {
    if (seen.has(a.id)) return;
    for (const code of a.codes) {
      if (lower.includes(code.toLowerCase())) {
        seen.add(a.id);
        matches.push(a);
        break;
      }
    }
  });
  return matches;
}

export function getBadgeInfo(additive: BannedAdditive): Array<{
  label: string;
  bg: string;
  border: string;
  color: string;
}> {
  const badges: Array<{ label: string; bg: string; border: string; color: string }> = [];

  if (additive.us_status === "recently_banned") {
    badges.push({
      label: "🚫 Recently Banned",
      bg: "#FEE2E2",
      border: "#FECDD3",
      color: "#991B1B",
    });
  }

  if (additive.eu_status === "banned") {
    badges.push({
      label: "🇪🇺 Banned in EU",
      bg: "#FEF3C7",
      border: "#FDE68A",
      color: "#92400E",
    });
  }

  if (additive.eu_status === "warning_required") {
    badges.push({
      label: "🇪🇺 Warning Required",
      bg: "#FEF3C7",
      border: "#FDE68A",
      color: "#92400E",
    });
  }

  if (additive.california_status === "banned") {
    badges.push({
      label: "⚠️ Banned in CA",
      bg: "#FEF3C7",
      border: "#FDE68A",
      color: "#92400E",
    });
  }

  return badges;
}

export { additives as allBannedAdditives };
