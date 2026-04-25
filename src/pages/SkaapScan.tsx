import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { DesktopShell } from "@/components/scan/DesktopShell";
import { useIsMobile } from "@/hooks/use-mobile";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, Zap, ZapOff, Barcode, Clock, ChevronDown, ChevronRight, Leaf, X, Check, Sparkles,
  ShoppingBag, Trash2, Heart, Share2, Search, Filter, MessageCircle, Lock, Flame, Home, ArrowLeftRight, Skull, User,
  AlertTriangle,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useSubscription } from "@/context/SubscriptionContext";
import { HistoryScreen } from "@/components/scan/HistoryScreen";
import { SearchScreen } from "@/components/scan/SearchScreen";
import { TopProductsScreen } from "@/components/scan/TopProductsScreen";
import { KitchenReportScreen } from "@/components/scan/KitchenReportScreen";
import { RecsScreen } from "@/components/scan/RecsScreen";
import { CommunityScreen } from "@/components/scan/CommunityScreen";
import { BottomNavBar } from "@/components/scan/BottomNavBar";
import { AuthSheet } from "@/components/scan/AuthSheet";
import { ProfileScreen } from "@/components/scan/ProfileScreen";
import { toast } from "sonner";
import { fetchProductInfo, ProductFullInfo } from "@/lib/productInfoApi";
import { Skeleton } from "@/components/ui/skeleton";
import { getUserStats, recordScan, refreshStreak, getLastShareType, setLastShareType, type UserStats } from "@/lib/skaapUserStats";
import { generateShareCard as generateCard, type ShareCardType, type ShareProductData } from "@/lib/shareCardGenerator";
import { recordShare, getShareRewards, type Badge } from "@/lib/shareRewards";
import skaapIcon from "@/assets/skaap-icon.png";
import {
  calculateSkaapScore, getScoreColor, getScoreVerdict, getVerdictBanner,
  getAdditiveRisk, getAdditiveRiskColor, getAdditiveRiskLabel,
  getAdditiveDescription, SkaapScoreBreakdown,
} from "@/lib/skaapScore";
import {
  fetchAISummary, fetchAdditiveExplanation, fetchDietaryClassification,
  fetchRecommendations, DIETARY_LABELS, AIRecommendation,
} from "@/lib/aiProductInsights";
import { findBannedAdditives, matchBannedAdditive, getBadgeInfo } from "@/lib/bannedAdditives";
import { FoodFactCard } from "@/components/scan/FoodFactCard";
import { HealthSnapshot } from "@/components/scan/HealthSnapshot";
import { ImageRecognition } from "@/components/scan/ImageRecognition";
import { fetchHealthierAlternatives, OFFRecommendation } from "@/lib/offRecommendations";
import { useNearbyStore } from "@/hooks/useNearbyStore";
import { hapticLight, hapticMedium, hapticSuccess, hapticHeavy, hapticSelection } from "@/lib/haptics";
import { OnboardingFlow, hasSeenOnboarding } from "@/components/scan/OnboardingFlow";
import { FirstScanCelebration } from "@/components/scan/FirstScanCelebration";
import SplashScreen from "@/components/scan/SplashScreen";
import { StandaloneHome } from "@/components/scan/StandaloneHome";
import { FirstScanSignupModal, hasCompletedFirstScanSignup } from "@/components/scan/FirstScanSignupModal";

const isStandalone = typeof window !== "undefined" && (
  window.matchMedia("(display-mode: standalone)").matches ||
  (window.navigator as Navigator & { standalone?: boolean }).standalone === true
);

const LAST_SCAN_KEY = "skaap_last_scan";

interface LastScan {
  barcode: string;
  name: string;
  brand?: string;
  image?: string;
  score?: number;
  nutriScore?: string;
  scannedAt: number;
}

function saveLastScan(scan: LastScan) {
  try { localStorage.setItem(LAST_SCAN_KEY, JSON.stringify(scan)); } catch {}
}

function getLastScan(): LastScan | null {
  try {
    const raw = localStorage.getItem(LAST_SCAN_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}


// ─── Types ───
interface ScanHistoryItem {
  barcode: string;
  name: string;
  brand?: string;
  image?: string;
  nutriScore?: string;
  skaapScore?: number;
  scannedAt: number;
}

type Screen = "home" | "scanning" | "result" | "history" | "ai-info" | "basket" | "search" | "kitchen" | "kitchen-report" | "profile" | "top" | "community";

// ─── Saved basket helpers ───
const BASKET_KEY = "skaap_basket";

interface BasketItem {
  barcode: string;
  name: string;
  brand?: string;
  image?: string;
  nutriScore?: string;
  skaapScore?: number;
  novaGroup?: number;
  additiveCount: number;
  savedAt: number;
}

function getBasket(): BasketItem[] {
  try { return JSON.parse(localStorage.getItem(BASKET_KEY) || "[]"); } catch { return []; }
}

function addToBasket(item: BasketItem): BasketItem[] {
  const basket = getBasket().filter(b => b.barcode !== item.barcode);
  basket.unshift(item);
  localStorage.setItem(BASKET_KEY, JSON.stringify(basket.slice(0, 100)));
  return basket;
}

function removeFromBasket(barcode: string): BasketItem[] {
  const basket = getBasket().filter(b => b.barcode !== barcode);
  localStorage.setItem(BASKET_KEY, JSON.stringify(basket));
  return basket;
}

function isInBasket(barcode: string): boolean {
  return getBasket().some(b => b.barcode === barcode);
}

// ─── Canvas image export for basket comparison ───
async function exportBasketImage(items: BasketItem[], getColor: (s: number) => string): Promise<Blob | null> {
  const cols = Math.min(items.length, 4);
  const colW = 150;
  const padX = 24;
  const padTop = 64;
  const cardH = 190;
  const padBot = 56;
  const W = padX * 2 + cols * colW;
  const H = padTop + cardH + padBot;
  const canvas = document.createElement("canvas");
  const dpr = 2;
  canvas.width = W * dpr;
  canvas.height = H * dpr;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  ctx.scale(dpr, dpr);

  // Background
  ctx.fillStyle = "#FFFFFF";
  ctx.beginPath();
  ctx.roundRect(0, 0, W, H, 16);
  ctx.fill();

  // Load logo
  const logoImg = await new Promise<HTMLImageElement | null>(resolve => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = skaapIcon;
  });

  // Header with logo
  if (logoImg) {
    ctx.drawImage(logoImg, padX, 18, 28, 28);
    ctx.fillStyle = "#0A1220";
    ctx.font = "800 16px Inter, system-ui, sans-serif";
    ctx.fillText("SKAAP", padX + 34, 38);
  } else {
    ctx.fillStyle = "#0A1220";
    ctx.font = "800 16px Inter, system-ui, sans-serif";
    ctx.fillText("SKAAP", padX, 38);
  }
  ctx.fillStyle = "#9CA3AF";
  ctx.font = "400 10px Inter, system-ui, sans-serif";
  ctx.fillText("Comparison", padX + (logoImg ? 34 : 0) + ctx.measureText("SKAAP  ").width, 38);

  // Load images
  const images = await Promise.all(items.slice(0, cols).map(item => {
    if (!item.image) return Promise.resolve(null);
    return new Promise<HTMLImageElement | null>(resolve => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => resolve(img);
      img.onerror = () => resolve(null);
      img.src = item.image!;
    });
  }));

  items.slice(0, cols).forEach((item, i) => {
    const x = padX + i * colW;
    const y = padTop;

    // Product image area
    ctx.fillStyle = "#F7F7F7";
    ctx.beginPath();
    ctx.roundRect(x + 8, y, colW - 16, 72, 10);
    ctx.fill();
    const img = images[i];
    if (img) {
      const s = 56;
      ctx.drawImage(img, x + (colW - s) / 2, y + 8, s, s);
    } else {
      ctx.fillStyle = "#D1D5DB";
      ctx.font = "400 10px Inter, system-ui, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("No image", x + colW / 2, y + 42);
      ctx.textAlign = "left";
    }

    // Name (truncated)
    ctx.fillStyle = "#0A1220";
    ctx.font = "600 11px Inter, system-ui, sans-serif";
    const name = item.name.length > 16 ? item.name.slice(0, 15) + "…" : item.name;
    ctx.textAlign = "center";
    ctx.fillText(name, x + colW / 2, y + 92);

    // Score circle
    if (item.skaapScore != null) {
      const cx = x + colW / 2;
      const cy = y + 120;
      ctx.beginPath();
      ctx.arc(cx, cy, 18, 0, Math.PI * 2);
      ctx.fillStyle = getColor(item.skaapScore);
      ctx.fill();
      ctx.fillStyle = "#fff";
      ctx.font = "800 13px Inter, system-ui, sans-serif";
      ctx.fillText(String(item.skaapScore), cx, cy + 5);
    }

    // Nutri-Score chip
    if (item.nutriScore) {
      const ns = item.nutriScore.toLowerCase();
      const nColor = ns === "a" ? "#2D7D46" : ns === "b" ? "#4CAF50" : ns === "c" ? "#FFC107" : ns === "d" ? "#FF6D00" : "#B0202F";
      const label = `Nutri ${item.nutriScore.toUpperCase()}`;
      ctx.fillStyle = nColor;
      const tw = ctx.measureText(label).width;
      ctx.beginPath();
      ctx.roundRect(x + (colW - tw - 12) / 2, y + 148, tw + 12, 18, 9);
      ctx.fill();
      ctx.fillStyle = "#fff";
      ctx.font = "700 9px Inter, system-ui, sans-serif";
      ctx.fillText(label, x + colW / 2, y + 160);
    }

    // Additives
    ctx.fillStyle = "#9CA3AF";
    ctx.font = "400 9px Inter, system-ui, sans-serif";
    ctx.fillText(item.additiveCount === 0 ? "No additives" : `${item.additiveCount} additive${item.additiveCount > 1 ? "s" : ""}`, x + colW / 2, y + 182);
    ctx.textAlign = "left";
  });

  // ─── Branded watermark footer ───
  const footerY = H - 28;
  ctx.fillStyle = "#F3F4F6";
  ctx.beginPath();
  ctx.roundRect(padX, footerY - 4, W - padX * 2, 22, 8);
  ctx.fill();
  if (logoImg) {
    ctx.globalAlpha = 0.5;
    ctx.drawImage(logoImg, padX + 8, footerY - 2, 16, 16);
    ctx.globalAlpha = 1;
  }
  ctx.fillStyle = "#9CA3AF";
  ctx.font = "500 9px Inter, system-ui, sans-serif";
  ctx.textAlign = "left";
  ctx.fillText("Made with SKAAP", padX + (logoImg ? 28 : 8), footerY + 10);
  ctx.textAlign = "right";
  ctx.fillText("useskaap.com", W - padX - 8, footerY + 10);
  ctx.textAlign = "left";

  return new Promise(resolve => canvas.toBlob(b => resolve(b), "image/png"));
}


// ─── localStorage cache helpers (7-day TTL) ───
const CACHE_PREFIX = "skaap_cache_";
const SCORE_CACHE_PREFIX = "skaap_score_";
const HISTORY_KEY = "skaap_scan_history";
const CACHE_TTL = 7 * 24 * 60 * 60 * 1000;

function getCachedProduct(barcode: string): ProductFullInfo | null {
  try {
    const raw = localStorage.getItem(CACHE_PREFIX + barcode);
    if (!raw) return null;
    const { data, ts } = JSON.parse(raw);
    if (Date.now() - ts > CACHE_TTL) { localStorage.removeItem(CACHE_PREFIX + barcode); return null; }
    return data;
  } catch { return null; }
}

function setCachedProduct(barcode: string, data: ProductFullInfo) {
  try { localStorage.setItem(CACHE_PREFIX + barcode, JSON.stringify({ data, ts: Date.now() })); } catch {}
}

function getCachedScore(barcode: string): SkaapScoreBreakdown | null {
  try {
    const raw = localStorage.getItem(SCORE_CACHE_PREFIX + barcode);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch { return null; }
}

function setCachedScore(barcode: string, score: SkaapScoreBreakdown) {
  try { localStorage.setItem(SCORE_CACHE_PREFIX + barcode, JSON.stringify(score)); } catch {}
}

function getHistory(): ScanHistoryItem[] {
  try { return JSON.parse(localStorage.getItem(HISTORY_KEY) || "[]"); } catch { return []; }
}

function addToHistory(item: ScanHistoryItem) {
  const history = getHistory().filter(h => h.barcode !== item.barcode);
  history.unshift(item);
  localStorage.setItem(HISTORY_KEY, JSON.stringify(history.slice(0, 50)));
}

function clearHistory() { localStorage.removeItem(HISTORY_KEY); }

// ─── ZXing loader ───
declare global { interface Window { ZXing?: any; } }
const ZXING_SRC = "https://unpkg.com/@zxing/library@latest/umd/index.min.js";

async function loadZXing(): Promise<any> {
  if (window.ZXing) return window.ZXing;
  await new Promise<void>((resolve, reject) => {
    const s = document.createElement("script");
    s.src = ZXING_SRC; s.async = true;
    s.onload = () => resolve(); s.onerror = () => reject();
    document.body.appendChild(s);
  });
  return window.ZXing;
}

// ─── Audio feedback ───
function playBeep() {
  try {
    const Ctx = window.AudioContext || (window as any).webkitAudioContext;
    if (!Ctx) return;
    const ctx = new Ctx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine"; osc.frequency.setValueAtTime(880, ctx.currentTime);
    gain.gain.setValueAtTime(0.0001, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.15, ctx.currentTime + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.15);
    osc.connect(gain); gain.connect(ctx.destination);
    osc.start(); osc.stop(ctx.currentTime + 0.2);
    setTimeout(() => void ctx.close(), 300);
  } catch {}
}

// ─── Nutri-Score / NOVA colors ───
const nutriColors: Record<string, { bg: string; text: string }> = {
  a: { bg: "#2D7D46", text: "#fff" },
  b: { bg: "#4CAF50", text: "#fff" },
  c: { bg: "#FFC107", text: "#1B2A4A" },
  d: { bg: "#FF6D00", text: "#fff" },
  e: { bg: "#C41E3A", text: "#fff" },
};

const novaColors: Record<number, { bg: string; text: string; label: string }> = {
  1: { bg: "#1B5E20", text: "#fff", label: "Unprocessed" },
  2: { bg: "#4CAF50", text: "#fff", label: "Processed ingredient" },
  3: { bg: "#FF6D00", text: "#fff", label: "Processed food" },
  4: { bg: "#C62828", text: "#fff", label: "Ultra-processed" },
};

function nutrientLevelColor(level?: string) {
  if (level === "low") return "#2D7D46";
  if (level === "moderate") return "#FFC107";
  if (level === "high") return "#C41E3A";
  return "#9CA3AF";
}

function formatTag(tag: string) {
  return tag.replace(/^en:/, "").replace(/[-_]/g, " ").replace(/\b\w/g, c => c.toUpperCase());
}

// ─── Score Ring SVG Component with spring bounce ───
function ScoreRing({ score, size = 120, showLabel = true }: { score: number; size?: number; showLabel?: boolean }) {
  const color = getScoreColor(score);
  const strokeW = size <= 72 ? 4 : size >= 110 ? 10 : 6;
  const r = (size - strokeW * 2) / 2;
  const circumference = 2 * Math.PI * r;
  // Overshoot by 5 points then settle
  const overshootScore = Math.min(100, score + 5);
  const overshootOffset = circumference - (overshootScore / 100) * circumference;
  const finalOffset = circumference - (score / 100) * circumference;
  const reducedMotion = typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
  const fontSize = size <= 72 ? 28 : 40;
  const [displayScore, setDisplayScore] = useState(0);

  useEffect(() => {
    if (reducedMotion) { setDisplayScore(score); return; }
    setDisplayScore(0);
    const duration = 600;
    const start = performance.now();
    const animate = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      // Spring-like: overshoot then settle
      const eased = progress < 0.7
        ? (progress / 0.7) * (score + 5)
        : score + 5 - ((progress - 0.7) / 0.3) * 5;
      setDisplayScore(Math.round(Math.min(100, Math.max(0, eased))));
      if (progress < 1) requestAnimationFrame(animate);
    };
    const timer = setTimeout(() => requestAnimationFrame(animate), 300);
    return () => clearTimeout(timer);
  }, [score, reducedMotion]);

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#F3F4F6" strokeWidth={strokeW} />
        <circle
          cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={strokeW}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={reducedMotion ? finalOffset : circumference}
          ref={(el) => {
            if (el && !reducedMotion) {
              requestAnimationFrame(() => {
                // First overshoot
                el.style.transition = "stroke-dashoffset 0.4s ease-out 0.3s";
                el.style.strokeDashoffset = String(overshootOffset);
                // Then settle back
                setTimeout(() => {
                  el.style.transition = "stroke-dashoffset 0.2s ease-in-out";
                  el.style.strokeDashoffset = String(finalOffset);
                }, 700);
              });
            }
          }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-extrabold leading-none" style={{ fontSize, color }}>{displayScore}</span>
        {showLabel && <span className="font-semibold uppercase tracking-wider mt-0.5" style={{ fontSize: 8, color: "#9CA3AF" }}>/ 100</span>}
      </div>
    </div>
  );
}

// ─── Main Component ───
const SkaapScan = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { openUpgrade, isPlus } = useSubscription();
  const [screen, setScreen] = useState<Screen>("history");
  const [authSheetOpen, setAuthSheetOpen] = useState(false);
  const { currentCity } = useNearbyStore();
  const [lastScan, setLastScan] = useState<LastScan | null>(getLastScan());
  const [showOnboarding, setShowOnboarding] = useState(!hasSeenOnboarding());
  const [showSplash, setShowSplash] = useState(() => window.matchMedia("(display-mode: standalone)").matches);

  // Scanner
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const readerRef = useRef<any>(null);
  const [torchOn, setTorchOn] = useState(false);
  const [torchSupported, setTorchSupported] = useState(false);
  const [hintVisible, setHintVisible] = useState(true);
  const [bottomHintVisible, setBottomHintVisible] = useState(true);
  const [scanDetected, setScanDetected] = useState(false);

  // Result
  const [loading, setLoading] = useState(false);
  const [slowLoad, setSlowLoad] = useState(false);
  const [productInfo, setProductInfo] = useState<ProductFullInfo | null>(null);
  const [currentBarcode, setCurrentBarcode] = useState("");
  const [notFound, setNotFound] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());
  const [scoreBreakdown, setScoreBreakdown] = useState<SkaapScoreBreakdown | null>(null);
  const [showScoreModal, setShowScoreModal] = useState(false);
  const [savedState, setSavedState] = useState<"idle" | "saved">("idle");
  const [basket, setBasket] = useState<BasketItem[]>(getBasket());

  // Share feature states
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [shareImageBlob, setShareImageBlob] = useState<Blob | null>(null);
  const [shareImageUrl, setShareImageUrl] = useState<string | null>(null);
  const [shareState, setShareState] = useState<"idle" | "shared">("idle");
  const [shareGenerating, setShareGenerating] = useState(false);
  const [selectedCardType, setSelectedCardType] = useState<ShareCardType>(getLastShareType() as ShareCardType || "product");
  const [userStats, setUserStats] = useState<UserStats>(getUserStats());
  const [challengeCopied, setChallengeCopied] = useState(false);
  const cachedSkaapIconRef = useRef<HTMLImageElement | null>(null);

  // AI states
  const [aiSummary, setAiSummary] = useState<string | null>(null);
  const [aiSummaryLoading, setAiSummaryLoading] = useState(false);
  const [dietaryTags, setDietaryTags] = useState<Record<string, number> | null>(null);
  const [aiRecommendations, setAiRecommendations] = useState<AIRecommendation[] | null>(null);
  const [aiRecsLoading, setAiRecsLoading] = useState(false);
  const [expandedAdditive, setExpandedAdditive] = useState<string | null>(null);
  const [additiveExplanation, setAdditiveExplanation] = useState<string | null>(null);
  const [additiveExplanationLoading, setAdditiveExplanationLoading] = useState(false);

  // OFF-based healthier alternatives
  const [offRecs, setOffRecs] = useState<OFFRecommendation[]>([]);
  const [offRecsLoading, setOffRecsLoading] = useState(false);

  // Feedback state
  const [feedbackGiven, setFeedbackGiven] = useState(false);
  const FEEDBACK_KEY = "skaap_feedback_count";

  // Heart particle animation
  const [heartParticle, setHeartParticle] = useState(false);

  // Image recognition
  const [showImageRecognition, setShowImageRecognition] = useState(false);
  // First-scan celebration
  const [showCelebration, setShowCelebration] = useState(false);
  // First-scan signup modal (one-time per device)
  const [showSignupModal, setShowSignupModal] = useState(false);
  // Sheet state (must be top-level for hooks rules)
  const [sheetExpanded, setSheetExpanded] = useState(false);
  const sheetContentRef = useRef<HTMLDivElement>(null);

  // Auto-expand sheet when any accordion opens
  const hasAnyExpanded = expandedSections.size > 0;
  useEffect(() => {
    setSheetExpanded(hasAnyExpanded);
  }, [hasAnyExpanded]);

  // History
  const [history, setHistory] = useState<ScanHistoryItem[]>(getHistory());
  const [historySearch, setHistorySearch] = useState("");
  const [scoreFilter, setScoreFilter] = useState<string>("all");

  // ─── Fire AI calls after product resolves ───
  const fireAICalls = useCallback((info: ProductFullInfo, barcode: string, score: SkaapScoreBreakdown) => {
    // Reset AI states
    setAiSummary(null);
    setDietaryTags(null);
    setAiRecommendations(null);
    setExpandedAdditive(null);
    setAdditiveExplanation(null);

    // Build nutrient concerns string
    const concerns: string[] = [];
    const nl = info.nutrientLevels;
    if (nl?.fat === "high") concerns.push("high fat");
    if (nl?.saturatedFat === "high") concerns.push("high saturated fat");
    if (nl?.sugars === "high") concerns.push("high sugars");
    if (nl?.salt === "high") concerns.push("high salt");

    // Fire all in parallel — never await
    setAiSummaryLoading(true);
    fetchAISummary({
      barcode,
      productName: info.productName,
      brandName: info.brand,
      nutriScore: info.nutriScoreGrade,
      novaGroup: info.novaGroup,
      additiveCount: info.additivesTags?.length || 0,
      worstRisk: score.worstAdditiveRisk,
      isOrganic: score.isOrganic,
      nutrientLevels: concerns.join(", ") || "none",
    }).then(s => { setAiSummary(s); setAiSummaryLoading(false); }).catch(() => setAiSummaryLoading(false));

    if (info.ingredientsText) {
      fetchDietaryClassification({
        barcode,
        ingredientsText: info.ingredientsText,
        allergensTags: info.allergensTags,
      }).then(d => setDietaryTags(d)).catch(() => {});
    }

    setAiRecsLoading(true);
    fetchRecommendations({
      barcode,
      productName: info.productName,
      nutriScore: info.nutriScoreGrade,
      additiveCount: info.additivesTags?.length || 0,
    }).then(r => { setAiRecommendations(r); setAiRecsLoading(false); }).catch(() => setAiRecsLoading(false));

    // OFF-based healthier alternatives (real products from same category)
    setOffRecsLoading(true);
    fetchHealthierAlternatives(info.categoriesTags, info.nutriScoreGrade, barcode)
      .then(r => { setOffRecs(r); setOffRecsLoading(false); })
      .catch(() => setOffRecsLoading(false));
  }, []);

  // ─── Write anonymous community scan data ───
  const writeCommunityData = useCallback(async (barcode: string, productName: string, brand?: string, score?: number, imageUrl?: string, additives?: string[]) => {
    if (!user) return; // only logged-in users contribute
    try {
      const savedLoc = localStorage.getItem("skaap_community_location");
      let city = "Unknown", state = "";
      if (savedLoc) {
        const parsed = JSON.parse(savedLoc);
        city = parsed.city || "Unknown";
        state = parsed.state || "";
      }
      await supabase.from("community_scans").insert({
        barcode,
        product_name: productName,
        brand: brand || null,
        score: score || null,
        image_url: imageUrl || null,
        city,
        state,
        saved: false, // default; updated when user saves
        additives_flagged: (additives || []).slice(0, 20),
      });
    } catch {}
  }, [user]);

  // ─── Camera ───
  const stopCamera = useCallback(() => {
    try { readerRef.current?.reset?.(); } catch {}
    readerRef.current = null;
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    setTorchOn(false); setTorchSupported(false);
  }, []);

  const startCamera = useCallback(async () => {
    try {
      const ZXing = await loadZXing();
      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { exact: "environment" }, width: { ideal: 1280 }, height: { ideal: 720 } }, audio: false });
      } catch {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: "environment" } }, audio: false });
      }

      if (!videoRef.current) return;
      streamRef.current = stream;
      videoRef.current.srcObject = stream;
      await videoRef.current.play();

      const track = stream.getVideoTracks()[0];
      const caps = track?.getCapabilities?.() as any;
      setTorchSupported(!!caps?.torch);

      const hints = new Map();
      hints.set(ZXing.DecodeHintType.POSSIBLE_FORMATS, [
        ZXing.BarcodeFormat.EAN_13, ZXing.BarcodeFormat.EAN_8,
        ZXing.BarcodeFormat.UPC_A, ZXing.BarcodeFormat.UPC_E,
        ZXing.BarcodeFormat.CODE_128, ZXing.BarcodeFormat.CODE_39,
        ZXing.BarcodeFormat.QR_CODE,
      ]);

      const reader = new ZXing.BrowserMultiFormatReader(hints, 80);
      readerRef.current = reader;

      setTimeout(() => setBottomHintVisible(false), 3000);

      const onDecode = (result: any) => {
        if (!result) return;
        const text = typeof result.getText === "function" ? result.getText() : result.text;
        if (text) handleBarcodeDetected(text.trim());
      };

      if (typeof reader.decodeFromStream === "function") {
        reader.decodeFromStream(stream, videoRef.current, onDecode);
      } else {
        reader.decodeFromVideoDevice(undefined, videoRef.current, onDecode);
      }
    } catch {}
  }, []);

  const handleBarcodeDetected = useCallback(async (barcode: string) => {
    setScanDetected(true);
    setHintVisible(false);
    playBeep();
    hapticSuccess();
    stopCamera();

    setCurrentBarcode(barcode);
    setScreen("result");
    setLoading(true);
    setNotFound(false);
    setSlowLoad(false);
    setExpandedSections(new Set());
    setScoreBreakdown(null);
    setSavedState("idle");
    setShareState("idle");
    setShareModalOpen(false);
    setShareImageBlob(null);
    if (shareImageUrl) { URL.revokeObjectURL(shareImageUrl); setShareImageUrl(null); }
    setShowScoreModal(false);
    setAiSummary(null);
    setAiSummaryLoading(false);
    setDietaryTags(null);
    setAiRecommendations(null);
    setAiRecsLoading(false);
    setExpandedAdditive(null);
    setAdditiveExplanation(null);
    setOffRecs([]);
    setOffRecsLoading(false);
    setHeartParticle(false);

    const slowTimer = setTimeout(() => setSlowLoad(true), 3000);

    // Check cache first
    const cached = getCachedProduct(barcode);
    if (cached) {
      clearTimeout(slowTimer);
      setProductInfo(cached);
      const cachedScore = getCachedScore(barcode) || calculateSkaapScore(cached.nutriScoreGrade, cached.additivesTags, cached.labelsTags);
      if (!getCachedScore(barcode)) setCachedScore(barcode, cachedScore);
      setScoreBreakdown(cachedScore);
      setLoading(false);
      addToHistory({
        barcode, name: cached.productName, brand: cached.brand,
        image: cached.imageUrl, nutriScore: cached.nutriScoreGrade,
        skaapScore: cachedScore.total, scannedAt: Date.now(),
      });
      setHistory(getHistory());
      // Save as last scan for quick re-access
      const ls: LastScan = { barcode, name: cached.productName, brand: cached.brand, image: cached.imageUrl, score: cachedScore.total, nutriScore: cached.nutriScoreGrade, scannedAt: Date.now() };
      saveLastScan(ls);
      setLastScan(ls);
      // Record user stats
      const updatedStats = recordScan({
        barcode, product_name: cached.productName, brand: cached.brand,
        skaap_score: cachedScore.total, nutriscore_grade: cached.nutriScoreGrade,
        scanned_at: Date.now(), image_url: cached.imageUrl,
        additives: cached.additivesTags, nova_group: cached.novaGroup,
      });
      setUserStats(updatedStats);
      if (updatedStats.total_scans === 1) setShowCelebration(true);
      writeCommunityData(barcode, cached.productName, cached.brand, cachedScore.total, cached.imageUrl, cached.additivesTags);
      if (user) {
        supabase.from("user_scans").insert({
          user_id: user.id, barcode, product_name: cached.productName,
          brand: cached.brand || null, score: cachedScore.total,
          nutriscore: cached.nutriScoreGrade || null, nova: cached.novaGroup || null,
          image_url: cached.imageUrl || null,
        }).then(() => {});
      }
      fireAICalls(cached, barcode, cachedScore);
      return;
    }

    const info = await fetchProductInfo(barcode);
    clearTimeout(slowTimer);

    if (info) {
      setCachedProduct(barcode, info);
      const score = calculateSkaapScore(info.nutriScoreGrade, info.additivesTags, info.labelsTags);
      setCachedScore(barcode, score);
      setProductInfo(info);
      setScoreBreakdown(score);
      addToHistory({
        barcode, name: info.productName, brand: info.brand,
        image: info.imageUrl, nutriScore: info.nutriScoreGrade,
        skaapScore: score.total, scannedAt: Date.now(),
      });
      setHistory(getHistory());
      // Save as last scan
      const ls2: LastScan = { barcode, name: info.productName, brand: info.brand, image: info.imageUrl, score: score.total, nutriScore: info.nutriScoreGrade, scannedAt: Date.now() };
      saveLastScan(ls2);
      setLastScan(ls2);
      // Record user stats
      const updatedStats = recordScan({
        barcode, product_name: info.productName, brand: info.brand,
        skaap_score: score.total, nutriscore_grade: info.nutriScoreGrade,
        scanned_at: Date.now(), image_url: info.imageUrl,
        additives: info.additivesTags, nova_group: info.novaGroup,
      });
      setUserStats(updatedStats);
      if (updatedStats.total_scans === 1) setShowCelebration(true);
      // Write anonymous community scan data
      writeCommunityData(barcode, info.productName, info.brand, score.total, info.imageUrl, info.additivesTags);
      // Persist to database for logged-in users
      if (user) {
        supabase.from("user_scans").insert({
          user_id: user.id, barcode, product_name: info.productName,
          brand: info.brand || null, score: score.total,
          nutriscore: info.nutriScoreGrade || null, nova: info.novaGroup || null,
          image_url: info.imageUrl || null,
        }).then(() => {});
      }
      fireAICalls(info, barcode, score);
    } else {
      setNotFound(true);
    }
    setLoading(false);
  }, [stopCamera, fireAICalls, writeCommunityData]);

  const toggleSection = (key: string) => {
    setExpandedSections(prev => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  };

  const handleAdditiveExpand = useCallback((tag: string, productName: string) => {
    if (expandedAdditive === tag) {
      setExpandedAdditive(null);
      setAdditiveExplanation(null);
      return;
    }
    setExpandedAdditive(tag);
    setAdditiveExplanation(null);
    setAdditiveExplanationLoading(true);

    const code = tag.replace(/^en:/, "").replace(/-.*$/, "").toUpperCase();
    const risk = getAdditiveRisk(tag);
    fetchAdditiveExplanation({
      eNumber: code,
      additiveName: formatTag(tag),
      riskLevel: getAdditiveRiskLabel(risk),
      productName,
    }).then(exp => {
      setAdditiveExplanation(exp);
      setAdditiveExplanationLoading(false);
    }).catch(() => setAdditiveExplanationLoading(false));
  }, [expandedAdditive]);

  const scanAnother = () => {
    hapticLight();
    setProductInfo(null);
    setNotFound(false);
    setScanDetected(false);
    setHintVisible(true);
    setBottomHintVisible(true);
    setScoreBreakdown(null);
    setShowScoreModal(false);
    setSavedState("idle");
    setShareState("idle");
    setShareModalOpen(false);
    setAiSummary(null);
    setDietaryTags(null);
    setAiRecommendations(null);
    setFeedbackGiven(false);
    setScreen("scanning");
    setTimeout(() => startCamera(), 100);
  };

  const handleFeedback = (emoji: string) => {
    setFeedbackGiven(true);
    const count = parseInt(localStorage.getItem(FEEDBACK_KEY) || "0", 10) + 1;
    localStorage.setItem(FEEDBACK_KEY, String(count));
    // Log to Supabase anonymously
    supabase.from("analytics_events").insert({
      event_type: "scan_feedback",
      session_id: localStorage.getItem("skaap_session_id") || "anon",
      event_data: { emoji, barcode: currentBarcode, score: scoreBreakdown?.total },
      page: "/scan",
    }).then(() => {});
    toast.success("Thanks for the feedback! 🙏", { duration: 1500 });
  };

  const goToScan = () => {
    hapticMedium();
    setScreen("scanning");
    setScanDetected(false);
    setHintVisible(true);
    setBottomHintVisible(true);
    setTimeout(() => startCamera(), 100);
  };

  const handleSave = () => {
    hapticMedium();
    if (productInfo && currentBarcode) {
      if (isInBasket(currentBarcode)) {
        // Already saved — remove from basket
        const updated = removeFromBasket(currentBarcode);
        setBasket(updated);
        setSavedState("idle");
      } else {
        // Add to basket
        const updated = addToBasket({
          barcode: currentBarcode, name: productInfo.productName, brand: productInfo.brand,
          image: productInfo.imageUrl, nutriScore: productInfo.nutriScoreGrade,
          skaapScore: scoreBreakdown?.total, novaGroup: productInfo.novaGroup,
          additiveCount: productInfo.additivesTags?.length || 0, savedAt: Date.now(),
        });
        setBasket(updated);
        // Heart particle animation
        setHeartParticle(true);
        setTimeout(() => setHeartParticle(false), 600);
        setSavedState("saved");
        setTimeout(() => setSavedState("idle"), 1500);
      }
    }
  };

  useEffect(() => {
    // Refresh streak on mount
    setUserStats(refreshStreak());
    return () => stopCamera();
  }, [stopCamera]);

  // Pre-load SKAAP icon + Inter fonts for share card
  useEffect(() => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => { cachedSkaapIconRef.current = img; };
    img.src = skaapIcon;
    // Preload Inter font weights into document.fonts for canvas rendering
    const weights = [
      { weight: "400", name: "Inter400" },
      { weight: "600", name: "Inter600" },
      { weight: "800", name: "Inter800" },
    ];
    weights.forEach(({ weight, name }) => {
      const font = new FontFace(name, `url(https://fonts.gstatic.com/s/inter/v18/UcCO3FwrK3iLTeHuS_nVMrMxCp50SjIw2boKoduKmMEVuLyfAZ9hjQ.woff2)`, { weight });
      font.load().then(f => document.fonts.add(f)).catch(() => {});
    });
  }, []);

  // ─── Share card generation (delegates to module) ───
  const buildProductData = useCallback((): ShareProductData | null => {
    if (!productInfo || !scoreBreakdown) return null;
    return {
      barcode: currentBarcode,
      product_name: productInfo.productName,
      brand: productInfo.brand,
      skaap_score: scoreBreakdown.total,
      nutriscore_grade: productInfo.nutriScoreGrade,
      nova_group: productInfo.novaGroup,
      additives: productInfo.additivesTags,
      image_url: productInfo.imageUrl,
      top_recommendation: aiRecommendations?.[0] || null,
    };
  }, [productInfo, scoreBreakdown, currentBarcode, aiRecommendations]);

  const regeneratePreview = useCallback(async (cardType: ShareCardType) => {
    const pd = buildProductData();
    if (!pd) return;
    // Check card availability
    if (cardType === "kitchen" && userStats.total_scans < 5) return;
    if (cardType === "streak" && userStats.current_streak < 1) return;
    if (cardType === "worst" && userStats.total_scans < 3) return;
    if (cardType === "swap" && !pd.top_recommendation) return;

    const blob = await generateCard(cardType, cachedSkaapIconRef.current, pd, userStats);
    if (!blob) return;
    if (shareImageUrl) URL.revokeObjectURL(shareImageUrl);
    setShareImageBlob(blob);
    setShareImageUrl(URL.createObjectURL(blob));
  }, [buildProductData, userStats, shareImageUrl]);

  const handleShareTap = useCallback(async () => {
    hapticLight();
    if (shareGenerating) return;
    setShareGenerating(true);
    setChallengeCopied(false);
    // Default to product card
    const cardType = selectedCardType;
    const pd = buildProductData();
    if (!pd) { setShareGenerating(false); return; }

    // Check if selected card is available, fallback to product
    let activeType = cardType;
    if (activeType === "kitchen" && userStats.total_scans < 5) activeType = "product";
    if (activeType === "streak" && userStats.current_streak < 1) activeType = "product";
    if (activeType === "worst" && userStats.total_scans < 3) activeType = "product";
    if (activeType === "swap" && !pd.top_recommendation) activeType = "product";

    setSelectedCardType(activeType);
    const blob = await generateCard(activeType, cachedSkaapIconRef.current, pd, userStats);
    setShareGenerating(false);
    if (!blob) return;
    setShareImageBlob(blob);
    setShareImageUrl(URL.createObjectURL(blob));
    setShareModalOpen(true);
    setLastShareType(activeType);
  }, [buildProductData, shareGenerating, selectedCardType, userStats]);

  // When card type changes in selector, regenerate preview
  const handleCardTypeChange = useCallback(async (type: ShareCardType) => {
    setSelectedCardType(type);
    setLastShareType(type);
    await regeneratePreview(type);
  }, [regeneratePreview]);

  const shareFilename = productInfo
    ? `skaap-${selectedCardType}-${productInfo.productName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}-${scoreBreakdown?.total ?? 0}.png`
    : "skaap-score.png";

  const handleShareAction = useCallback(async (target: "instagram" | "whatsapp" | "tiktok" | "anywhere") => {
    if (!shareImageBlob) return;
    const file = new File([shareImageBlob], shareFilename, { type: "image/png" });

    if (target === "tiktok") {
      // TikTok doesn't have a direct share API — save image + open TikTok
      if (navigator.share && navigator.canShare?.({ files: [file] })) {
        try { await navigator.share({ files: [file], title: "My SKAAP Score" }); } catch {}
      } else {
        const url = URL.createObjectURL(shareImageBlob);
        const a = document.createElement("a");
        a.href = url; a.download = shareFilename;
        a.click(); URL.revokeObjectURL(url);
        toast("Image saved — open TikTok and create a new post", { duration: 3000 });
      }
    } else if (target === "whatsapp") {
      if (navigator.share && navigator.canShare?.({ files: [file] })) {
        try { await navigator.share({ files: [file], title: "My SKAAP Score" }); } catch {}
      } else {
        const score = scoreBreakdown?.total ?? 0;
        const waText = encodeURIComponent(`I just SKAAPed this and got ${score}/100. Try it free: useskaap.com/scan`);
        window.open(`https://wa.me/?text=${waText}`, "_blank");
      }
    } else if (navigator.share && navigator.canShare?.({ files: [file] })) {
      try {
        await navigator.share({
          files: [file],
          title: "I just SKAAPed this",
          text: `Score: ${scoreBreakdown?.total ?? 0}/100 — useskaap.com/scan`,
        });
      } catch {}
    } else {
      const url = URL.createObjectURL(shareImageBlob);
      const a = document.createElement("a");
      a.href = url; a.download = shareFilename;
      a.click(); URL.revokeObjectURL(url);
      toast("Image saved — open Instagram Stories and tap +", { duration: 3000 });
    }
    // Record share reward
    const reward = recordShare(selectedCardType, target);
    if (reward.newBadges.length > 0) {
      reward.newBadges.forEach(b => toast(`🎉 New badge: ${b.emoji} ${b.name}!`, { duration: 4000 }));
    }
    if (reward.bonusScansAdded > 0) {
      toast(`+${reward.bonusScansAdded} bonus scans earned!`, { duration: 2500 });
    }
    if (reward.trialDaysAdded > 0) {
      toast(`🎁 +${reward.trialDaysAdded} day of SKAAP Plus trial!`, { duration: 3000 });
    }
    setShareModalOpen(false);
    if (shareImageUrl) { URL.revokeObjectURL(shareImageUrl); setShareImageUrl(null); }
    setShareState("shared");
    setTimeout(() => setShareState("idle"), 2000);
  }, [shareImageBlob, shareImageUrl, shareFilename, scoreBreakdown, selectedCardType]);

  const handleChallengeCopy = useCallback(() => {
    const text = `Can you beat my SKAAP Kitchen Score of ${userStats.kitchen_score}/100? Try it free: useskaap.com/scan`;
    navigator.clipboard?.writeText(text).catch(() => {});
    setChallengeCopied(true);
    setTimeout(() => setChallengeCopied(false), 2000);
  }, [userStats.kitchen_score]);

  const toggleTorch = async () => {
    const track = streamRef.current?.getVideoTracks()[0];
    if (!track) return;
    try {
      await track.applyConstraints({ advanced: [{ torch: !torchOn } as any] });
      setTorchOn(!torchOn);
    } catch {}
  };

  // ─── Shared nav handler for bottom nav ───
  const handleNavChange = useCallback((nav: string) => {
    hapticSelection();
    if (nav === "home") setScreen("home");
    else if (nav === "history") { setHistory(getHistory()); setScreen("history"); }
    else if (nav === "search") setScreen("search");
    else if (nav === "kitchen") setScreen("kitchen");
    else if (nav === "community") setScreen("community");
    else if (nav === "top") setScreen("top");
    else if (nav === "scan") goToScan();
    else if (nav === "saved") { setBasket(getBasket()); setScreen("basket"); }
    else if (nav === "profile") user ? setScreen("profile") : setAuthSheetOpen(true);
  }, [user, goToScan]);

  // ─── SCREEN: HOME ───
  if (screen === "home") {
    return (
      <>
      <AnimatePresence>
        {showSplash && <SplashScreen onComplete={() => setShowSplash(false)} />}
      </AnimatePresence>
      {showOnboarding && (
        <OnboardingFlow onComplete={() => setShowOnboarding(false)} />
      )}
      {showCelebration && (
        <FirstScanCelebration onDone={() => setShowCelebration(false)} />
      )}
      {/* Standalone PWA home — richer, personalized entry point */}
      {isStandalone ? (
        <>
          <StandaloneHome
            onScan={goToScan}
            onSearch={() => handleNavChange("search")}
            onHistory={() => handleNavChange("history")}
            onSaved={() => handleNavChange("saved")}
            onRecs={() => handleNavChange("kitchen")}
            onCommunity={() => handleNavChange("community")}
            onScanProduct={handleBarcodeDetected}
            onImageScan={() => setShowImageRecognition(true)}
          />
          <BottomNavBar active="home" onNavigate={handleNavChange} />
          <AuthSheet open={authSheetOpen} onClose={() => setAuthSheetOpen(false)} />
          <AnimatePresence>
            {showImageRecognition && <ImageRecognition onClose={() => setShowImageRecognition(false)} />}
          </AnimatePresence>
        </>
      ) : (
      <div className="flex flex-col relative overflow-hidden" style={{ maxWidth: 430, margin: "0 auto", background: "#FFFFFF", height: "100dvh" }}>
        {/* Ambient blob */}
        <div className="absolute top-16 right-0 w-56 h-56 rounded-full animate-blob pointer-events-none" style={{ background: "rgba(196,30,58,0.06)", filter: "blur(80px)" }} />

        {/* Top bar */}
        <div className="flex items-center justify-between px-5 pt-[env(safe-area-inset-top,12px)] h-14 relative z-10">
          <div className="flex items-center gap-2">
            <img src={skaapIcon} alt="Skaap" className="w-7 h-7 rounded-lg" width="28" height="28" />
            <span className="font-extrabold text-xl tracking-tight" style={{ letterSpacing: "-0.5px", color: "#1B2A4A" }}>SKAAP</span>
          </div>
          <div className="flex items-center gap-2">
            {basket.length > 0 && (
              <motion.button whileTap={{ scale: 0.9 }} onClick={() => { setBasket(getBasket()); setScreen("basket"); }}
                className="w-10 h-10 rounded-full flex items-center justify-center relative" style={{ background: "#F3F4F6" }} aria-label="Saved basket">
                <Heart size={22} style={{ color: "#C41E3A" }} fill="#C41E3A" />
                <span className="absolute -top-0.5 -right-0.5 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white" style={{ background: "#C41E3A" }}>
                  {basket.length}
                </span>
              </motion.button>
            )}
            {history.length > 0 && (
              <motion.button whileTap={{ scale: 0.9 }} onClick={() => { setHistory(getHistory()); setScreen("history"); }}
                className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: "#F3F4F6" }} aria-label="Scan history">
                <Clock size={22} style={{ color: "#6B7280" }} />
              </motion.button>
            )}
          </div>
        </div>

        {/* City location pill */}
        {currentCity && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="mx-5 mt-1 flex items-center gap-1.5 px-3 py-1.5 rounded-lg relative z-10" style={{ background: "#F0FDF4" }}>
            <span style={{ fontSize: 12 }}>📍</span>
            <span className="text-[11px] font-medium" style={{ color: "#065F46" }}>{currentCity}</span>
          </motion.div>
        )}

        <p className="px-5 mt-0.5 text-[13px] font-medium relative z-10" style={{ color: "#6B7280" }}>
          Know what's in your food.
        </p>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto relative z-10 pb-4">
          {/* CENTER — Compact scanner circle */}
          <div className="flex flex-col items-center px-8 text-center pt-2" style={{ paddingBottom: 4 }}>
            <motion.button
              whileTap={{ scale: 1.04 }}
              onClick={goToScan}
              className="relative mb-3"
              style={{ width: 110, height: 110 }}
            >
              <div className="absolute inset-0 rounded-full" style={{ background: "#F3F4F6", border: "1px solid #E5E7EB" }} />
              <svg className="absolute inset-0 animate-rotate-arc" width="110" height="110" viewBox="0 0 110 110">
                <circle cx="55" cy="55" r="53" fill="none" stroke="#E5E7EB" strokeWidth="2" />
                <path d="M 55 2 A 53 53 0 0 1 105 40" fill="none" stroke="#B01830" strokeWidth="2.5" strokeLinecap="round" />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <Barcode size={24} style={{ color: "#0A1220" }} />
                <span className="text-[10px] mt-1 font-medium" style={{ color: "#6B7280" }}>Tap to scan</span>
              </div>
            </motion.button>

            {/* Action row — Search + Photo */}
            <div className="flex items-center gap-2 w-full max-w-xs">
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={() => {
                  const code = prompt("Enter barcode number:");
                  if (code?.trim()) handleBarcodeDetected(code.trim());
                }}
                className="flex-1 flex items-center justify-center gap-2"
                style={{ height: 40, borderRadius: 20, background: "#F3F4F6", border: "1px solid #E5E7EB" }}
              >
                <Search size={14} style={{ color: "#9CA3AF" }} />
                <span className="font-semibold text-[12px]" style={{ color: "#1B2A4A" }}>Search product</span>
              </motion.button>
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowImageRecognition(true)}
                className="flex items-center justify-center gap-1.5"
                style={{ height: 40, paddingLeft: 12, paddingRight: 12, borderRadius: 20, background: "linear-gradient(135deg, #C41E3A, #9E1830)" }}
                aria-label="Photo scan"
              >
                <span className="text-white text-[14px]">📸</span>
                <span className="font-semibold text-[11px] text-white">Photo</span>
              </motion.button>
            </div>
          </div>

          {/* Last Scan — Quick re-access */}
          {lastScan && (
            <motion.button
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleBarcodeDetected(lastScan.barcode)}
              className="mx-5 mt-2 flex items-center gap-3 px-4 py-3 rounded-2xl text-left"
              style={{ background: "#F9FAFB", border: "1px solid #F3F4F6" }}
            >
              <div className="w-12 h-12 rounded-xl overflow-hidden flex-shrink-0" style={{ background: "#F3F4F6" }}>
                {lastScan.image ? (
                  <img src={lastScan.image} alt={lastScan.name} className="w-full h-full object-contain p-0.5" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center"><Barcode size={16} style={{ color: "#D1D5DB" }} /></div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: "#9CA3AF" }}>Last scanned</p>
                <p className="font-semibold text-[13px] truncate" style={{ color: "#111827" }}>{lastScan.name}</p>
                {lastScan.brand && <p className="text-[11px] truncate" style={{ color: "#6B7280" }}>{lastScan.brand}</p>}
              </div>
              {lastScan.score != null && (
                <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 text-white font-extrabold text-[13px]"
                  style={{ background: getScoreColor(lastScan.score) }}>
                  {lastScan.score}
                </div>
              )}
              <ChevronRight size={16} style={{ color: "#D1D5DB" }} />
            </motion.button>
          )}

          {/* Stat chips */}
          <div className="flex items-center justify-center gap-2 px-5 py-1.5">
            {[
              { emoji: "🔥", val: userStats.current_streak > 0 ? String(userStats.current_streak) : "--", label: "streak" },
              { emoji: "📊", val: userStats.total_scans > 0 ? String(userStats.total_scans) : "--", label: "scanned" },
              { emoji: "🏠", val: userStats.kitchen_score > 0 ? `${userStats.kitchen_score}` : "--", label: "/100" },
            ].map(chip => (
              <button key={chip.label} onClick={chip.label === "/100" ? () => setScreen("kitchen") : undefined}
                className="flex flex-col items-center justify-center" style={{ width: 90, height: 36, borderRadius: 10, background: "#F3F4F6", border: "1px solid #E5E7EB" }}>
                <span className="text-[11px] font-bold" style={{ color: "#0A1220" }}>{chip.emoji} {chip.val}</span>
                <span className="text-[8px] font-medium" style={{ color: "#6B7280" }}>{chip.label}</span>
              </button>
            ))}
          </div>

          {/* Food Fact of the Day */}
          <FoodFactCard />

          {/* Health Snapshot */}
          <HealthSnapshot stats={userStats} />
        </div>

        {/* Bottom nav */}
        <BottomNavBar active="home" onNavigate={handleNavChange} />

        {/* Auth sheet */}
        <AuthSheet open={authSheetOpen} onClose={() => setAuthSheetOpen(false)} />

        {/* Image Recognition */}
        <AnimatePresence>
          {showImageRecognition && <ImageRecognition onClose={() => setShowImageRecognition(false)} />}
        </AnimatePresence>
      </div>
      )}
      </>
    );
  }

  // ─── SCREEN: AI INFO ───
  if (screen === "ai-info") {
    return (
      <div className="min-h-screen" style={{ maxWidth: 430, margin: "0 auto", background: "#FFFFFF" }}>
        <div className="flex items-center gap-3 px-5 pt-[env(safe-area-inset-top,12px)] h-14">
          <button onClick={() => setScreen("result")} aria-label="Back">
            <ArrowLeft size={20} style={{ color: "#1B2A4A" }} />
          </button>
          <h1 className="font-extrabold text-lg" style={{ color: "#1B2A4A" }}>How SKAAP uses AI</h1>
        </div>
        <div className="px-5 py-6 space-y-6">
          {[
            { title: "Product Summaries", desc: "AI-generated summaries are created using Google Gemini based on Open Food Facts nutrition data. They provide a quick, plain-language overview of what the product is and what shoppers should know." },
            { title: "Additive Explanations", desc: "When you tap an additive, AI generates a calm, factual explanation of what it is and its role in the product. Risk levels come from EFSA and IARC research data." },
            { title: "Dietary Classifications", desc: "AI analyzes ingredient lists to classify products as Vegan, Vegetarian, Gluten-Free, etc. Hard safety overrides prevent incorrect labels." },
            { title: "Smart Recommendations", desc: "AI suggests healthier alternatives based on the product's nutritional profile, additive count, and category." },
          ].map((item, i) => (
            <div key={i}>
              <div className="flex items-center gap-2 mb-2">
                <Sparkles size={16} style={{ color: "#C41E3A" }} />
                <h2 className="font-bold text-sm" style={{ color: "#1B2A4A" }}>{item.title}</h2>
              </div>
              <p className="text-[13px] leading-relaxed" style={{ color: "#6B7280" }}>{item.desc}</p>
            </div>
          ))}
          <p className="text-[11px] text-center pt-4" style={{ color: "#9CA3AF" }}>
            All AI content is marked with ✨ AI. Scores and risk levels are calculated using established nutritional science, not AI.
          </p>
        </div>
      </div>
    );
  }

  // ─── SCREEN: SCANNING ───
  if (screen === "scanning") {
    return (
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 40 }}
        transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
        className="fixed inset-0 bg-black z-50"
      >
        <video ref={videoRef} autoPlay playsInline muted className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between px-4" style={{ paddingTop: "calc(env(safe-area-inset-top, 12px) + 12px)" }}>
          <motion.button whileTap={{ scale: 0.9 }} onClick={() => { stopCamera(); setScreen("home"); }}
            className="w-9 h-9 rounded-full flex items-center justify-center glass-pill" aria-label="Back">
            <ArrowLeft size={18} color="#fff" />
          </motion.button>
          <AnimatePresence>
            {hintVisible && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="px-4 py-2 rounded-full glass-pill">
                <motion.p animate={{ opacity: [1, 0.6, 1] }} transition={{ duration: 1.5, repeat: Infinity }} className="text-white text-[13px] font-semibold">
                  Point at any barcode
                </motion.p>
              </motion.div>
            )}
          </AnimatePresence>
          {torchSupported ? (
            <motion.button whileTap={{ scale: 0.9 }} onClick={toggleTorch}
              className="w-9 h-9 rounded-full flex items-center justify-center glass-pill" aria-label="Toggle flashlight">
              {torchOn ? <ZapOff size={18} color="#fff" /> : <Zap size={18} color="#fff" />}
            </motion.button>
          ) : <div className="w-9" />}
        </div>

        {/* Scan reticle — red corner brackets */}
        <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none" style={{ paddingBottom: "10%" }}>
          <div className="relative animate-bracket-pulse" style={{ width: 260, height: 160 }}>
            {[
              { top: 0, left: 0, borderTop: "3px solid #C41E3A", borderLeft: "3px solid #C41E3A" },
              { top: 0, right: 0, borderTop: "3px solid #C41E3A", borderRight: "3px solid #C41E3A" },
              { bottom: 0, left: 0, borderBottom: "3px solid #C41E3A", borderLeft: "3px solid #C41E3A" },
              { bottom: 0, right: 0, borderBottom: "3px solid #C41E3A", borderRight: "3px solid #C41E3A" },
            ].map((style, i) => (
              <div key={i} className="absolute" style={{ ...style, width: 24, height: 24, borderRadius: 4 } as any} />
            ))}
            <motion.div animate={{ y: [0, 136, 0] }} transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
              className="absolute left-3 right-3" style={{ height: 1, background: "linear-gradient(90deg, transparent, #C41E3A, transparent)", top: 12 }} />
          </div>
        </div>

        <AnimatePresence>
          {bottomHintVisible && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="absolute bottom-24 left-1/2 -translate-x-1/2 z-10 px-5 py-3 rounded-full glass-pill">
              <p className="text-white text-xs font-normal text-center">Works on all barcodes</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Bottom bar */}
        <div className="absolute bottom-0 left-0 right-0 z-10 glass-nav flex items-center justify-between px-6" style={{ height: 80, paddingBottom: 20 }}>
          <motion.button whileTap={{ scale: 0.9 }} onClick={toggleTorch}
            className="w-11 h-11 rounded-full flex items-center justify-center glass-pill" aria-label="Flashlight">
            {torchOn ? <ZapOff size={20} color="#fff" /> : <Zap size={20} color="#fff" />}
          </motion.button>
          <motion.button whileTap={{ scale: 0.9 }} onClick={() => { stopCamera(); setScreen("home"); }}
            className="w-11 h-11 rounded-full flex items-center justify-center glass-pill" aria-label="Close">
            <X size={20} color="#fff" />
          </motion.button>
        </div>
      </motion.div>
    );
  }

  // ─── SCREEN: RESULT ───
  if (screen === "result") {
    const n = productInfo?.nutriments;
    const nl = productInfo?.nutrientLevels;
    const addCount = productInfo?.additivesTags?.length || 0;

    // ─── Data quality indicator ───
    const dataFieldsTotal = 6;
    const dataFieldsFilled = n ? [n.energyKcal100g, n.fat100g, n.sugars100g, n.protein100g, n.fiber100g, n.salt100g].filter(v => v != null).length : 0;
    const dataComplete = dataFieldsFilled >= dataFieldsTotal;

    // ─── Positives & Negatives (Yuka-style) ───
    interface NutrientRow {
      label: string;
      val: number | undefined;
      unit: string;
      icon: string;
      isPositive: boolean;
      level: "high" | "moderate" | "low" | undefined;
      descriptor: string;
      dotColor: string;
    }

    const buildPositives = (): NutrientRow[] => {
      if (!n) return [];
      const rows: NutrientRow[] = [];
      if (n.fiber100g != null && n.fiber100g > 3)
        rows.push({ label: "Fiber", val: n.fiber100g, unit: "g", icon: "🌾", isPositive: true, level: "high", descriptor: "Helps your tummy digest food and keeps you full longer.", dotColor: "#22C55E" });
      if (n.protein100g != null && n.protein100g > 5)
        rows.push({ label: "Protein", val: n.protein100g, unit: "g", icon: "💪", isPositive: true, level: "high", descriptor: "Builds muscles and keeps your body strong. Great for gym days!", dotColor: "#22C55E" });
      if (n.saturatedFat100g != null && n.saturatedFat100g < 1)
        rows.push({ label: "Saturated fat", val: n.saturatedFat100g, unit: "g", icon: "💧", isPositive: true, level: "low", descriptor: "Low in the type of fat that can clog your arteries.", dotColor: "#22C55E" });
      if (n.sugars100g != null && n.sugars100g < 5)
        rows.push({ label: "Sugars", val: n.sugars100g, unit: "g", icon: "🍬", isPositive: true, level: "low", descriptor: "Won't spike your blood sugar. Your body will thank you.", dotColor: "#22C55E" });
      if (n.salt100g != null && n.salt100g < 0.3)
        rows.push({ label: "Salt", val: n.salt100g, unit: "g", icon: "🧂", isPositive: true, level: "low", descriptor: "Easy on your heart. Too much salt raises blood pressure.", dotColor: "#22C55E" });
      if (addCount === 0)
        rows.push({ label: "No additives", val: undefined, unit: "", icon: "✅", isPositive: true, level: undefined, descriptor: "Nothing artificial added. Just real ingredients.", dotColor: "#22C55E" });
      if (productInfo?.labelsTags?.some(l => l.toLowerCase().includes("organic")))
        rows.push({ label: "Organic", val: undefined, unit: "", icon: "🌿", isPositive: true, level: undefined, descriptor: "Grown without synthetic pesticides or fertilizers.", dotColor: "#22C55E" });
      return rows;
    };

    const buildNegatives = (): NutrientRow[] => {
      if (!n) return [];
      const rows: NutrientRow[] = [];
      if (n.energyKcal100g != null && n.energyKcal100g > 250)
        rows.push({ label: "Calories", val: n.energyKcal100g, unit: "kcal", icon: "🔥", isPositive: false, level: "high", descriptor: "Very energy-dense. Your body stores extra calories as fat.", dotColor: "#E8314A" });
      if (n.saturatedFat100g != null && n.saturatedFat100g > 4)
        rows.push({ label: "Saturated fat", val: n.saturatedFat100g, unit: "g", icon: "💧", isPositive: false, level: "high", descriptor: "Can build up in your arteries and affect your heart over time.", dotColor: "#E8314A" });
      if (n.sugars100g != null && n.sugars100g > 15)
        rows.push({ label: "Sugars", val: n.sugars100g, unit: "g", icon: "🍬", isPositive: false, level: "high", descriptor: "That's a lot of sugar — causes energy crashes and tooth decay.", dotColor: "#E8314A" });
      else if (n.sugars100g != null && n.sugars100g >= 5 && n.sugars100g <= 15)
        rows.push({ label: "Sugars", val: n.sugars100g, unit: "g", icon: "🍬", isPositive: false, level: "moderate", descriptor: "Some sugar here. Not terrible, but not great either.", dotColor: "#F59E0B" });
      if (n.salt100g != null && n.salt100g > 0.6)
        rows.push({ label: "Salt", val: n.salt100g, unit: "g", icon: "🧂", isPositive: false, level: "high", descriptor: "Too much salt can raise your blood pressure over time.", dotColor: "#E8314A" });
      if (addCount > 0)
        rows.push({ label: "Additives", val: addCount, unit: "", icon: "⚗️", isPositive: false, level: addCount > 3 ? "high" : "moderate", descriptor: addCount > 3 ? "Many chemicals added. Some may not be safe long-term." : `Contains ${addCount} additive${addCount > 1 ? "s" : ""}. Tap to learn more.`, dotColor: addCount > 3 ? "#E8314A" : "#F59E0B" });
      return rows;
    };

    const positives = buildPositives();
    const negatives = buildNegatives();

    const productName = productInfo?.productName || "";
    const displayName = productName.toUpperCase() === productName
      ? productName.replace(/\b\w+/g, w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
      : productName;

    // Eco-score chip colors
    const ecoColors: Record<string, { bg: string; border: string; color: string }> = {
      a: { bg: "#F0FDF4", border: "#BBF7D0", color: "#15803D" },
      b: { bg: "#F0FDF4", border: "#BBF7D0", color: "#22C55E" },
      c: { bg: "#FFFBEB", border: "#FDE68A", color: "#D97706" },
      d: { bg: "#FFF1F2", border: "#FECDD3", color: "#E8314A" },
      e: { bg: "#FFF1F2", border: "#FECDD3", color: "#B91C1C" },
    };

    return (
      <div className="fixed inset-0 z-50 flex flex-col" style={{ background: "#FFFFFF", height: "100dvh" }}>
        {/* Share preview modal */}
        <AnimatePresence>
          {shareModalOpen && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-[70] flex items-end justify-center"
              onClick={() => { setShareModalOpen(false); if (shareImageUrl) { URL.revokeObjectURL(shareImageUrl); setShareImageUrl(null); } }}>
              <div className="absolute inset-0" style={{ background: "linear-gradient(180deg, rgba(10,18,32,0.3) 0%, rgba(10,18,32,0.7) 100%)", backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)" }} />
              <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
                transition={{ type: "spring", damping: 24, stiffness: 200 }}
                className="relative w-full rounded-t-[28px] z-10 flex flex-col"
                style={{ height: "92vh", background: "rgba(10,15,30,0.92)", backdropFilter: "blur(60px) saturate(200%)", WebkitBackdropFilter: "blur(60px) saturate(200%)", borderTop: "1px solid rgba(255,255,255,0.15)", boxShadow: "0 -8px 60px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.1)" }}
                onClick={e => e.stopPropagation()}>
                <div className="flex justify-center pt-3"><div style={{ width: 36, height: 4, borderRadius: 99, background: "rgba(255,255,255,0.2)" }} /></div>
                <button onClick={() => { setShareModalOpen(false); if (shareImageUrl) { URL.revokeObjectURL(shareImageUrl); setShareImageUrl(null); } }}
                  className="absolute top-3 right-4 z-10 w-11 h-11 flex items-center justify-center rounded-full glass-pill" aria-label="Close">
                  <X size={20} style={{ color: "rgba(255,255,255,0.6)" }} />
                </button>
                <div className="text-center mt-5 px-5">
                  <p className="font-extrabold text-xl text-white">Share your results ✨</p>
                  <p className="text-[13px] mt-1.5" style={{ color: "rgba(255,255,255,0.4)" }}>Pick a card, make it yours, post it</p>
                </div>
                <div className="mt-5 px-5 overflow-x-auto flex-shrink-0" style={{ scrollbarWidth: "none" }}>
                  <div className="flex gap-[10px]" style={{ scrollSnapType: "x mandatory", minWidth: "max-content" }}>
                    {([
                      { type: "product" as ShareCardType, icon: <Barcode size={28} />, label: "This Score", sub: "What I just scanned", locked: false },
                      { type: "kitchen" as ShareCardType, icon: <Home size={28} />, label: "My Kitchen", sub: "My average score", locked: userStats.total_scans < 5 },
                      { type: "swap" as ShareCardType, icon: <ArrowLeftRight size={28} />, label: "The Swap", sub: "Better alternative", locked: !aiRecommendations || aiRecommendations.length === 0 },
                      { type: "streak" as ShareCardType, icon: <Flame size={28} />, label: "My Streak", sub: "Days eating clean", locked: userStats.current_streak < 1 },
                      { type: "worst" as ShareCardType, icon: <Skull size={28} />, label: "Worst Ever", sub: "My lowest score", locked: userStats.total_scans < 3 },
                    ] as const).map(chip => {
                      const isSelected = selectedCardType === chip.type;
                      return (
                        <motion.button key={chip.type} whileTap={{ scale: 0.95 }}
                          onClick={() => !chip.locked && handleCardTypeChange(chip.type)}
                          className={`flex flex-col items-center justify-center gap-1 flex-shrink-0 relative transition-all duration-200 ${isSelected ? "liquid-glass-chip-active" : "liquid-glass-chip"}`}
                          style={{ width: 120, height: 80, borderRadius: 18, scrollSnapAlign: "center", opacity: chip.locked ? 0.45 : 1 }}>
                          <span style={{ color: isSelected ? "#fff" : "rgba(255,255,255,0.8)" }}>{chip.icon}</span>
                          <span className="font-semibold" style={{ fontSize: 11, color: isSelected ? "#fff" : "rgba(255,255,255,0.8)" }}>{chip.label}</span>
                          <span style={{ fontSize: 10, color: isSelected ? "rgba(255,255,255,0.75)" : "rgba(255,255,255,0.4)" }}>{chip.sub}</span>
                          {chip.locked && <Lock size={12} className="absolute top-2 right-2" style={{ color: isSelected ? "#fff" : "rgba(255,255,255,0.3)" }} />}
                        </motion.button>
                      );
                    })}
                  </div>
                </div>
                <div className="flex-1 overflow-y-auto px-4 pt-4 pb-6 flex flex-col">
                  <div className="flex-1 flex items-center justify-center mb-4">
                    {shareImageUrl ? (
                      <div className="liquid-glass-preview rounded-[20px] p-2">
                        <img src={shareImageUrl} alt="Share card preview" className="max-w-full max-h-full object-contain rounded-2xl"
                          style={{ maxHeight: "calc(92vh - 440px)", aspectRatio: "9/16", boxShadow: "0 12px 48px rgba(0,0,0,0.12)" }} />
                      </div>
                    ) : (
                      <div className="flex items-center justify-center liquid-glass-preview rounded-[20px]" style={{ width: "100%", aspectRatio: "9/16", maxHeight: "calc(92vh - 440px)" }}>
                        <div className="space-y-2 w-3/4"><Skeleton className="h-4 w-full" /><Skeleton className="h-4 w-3/4" /><Skeleton className="h-40 w-40 rounded-full mx-auto" /></div>
                      </div>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-[10px]">
                    <motion.button whileTap={{ scale: 0.97 }} onClick={() => handleShareAction("instagram")}
                      className="flex items-center justify-center gap-2 font-semibold" style={{ height: 52, borderRadius: 14, fontSize: 14, background: "linear-gradient(135deg, #833AB4, #FD1D1D, #FCB045)", color: "#fff" }}>
                      📸 Instagram
                    </motion.button>
                    <motion.button whileTap={{ scale: 0.97 }} onClick={() => handleShareAction("whatsapp")}
                      className="flex items-center justify-center gap-2 font-semibold" style={{ height: 52, borderRadius: 14, fontSize: 14, background: "#25D366", color: "#fff" }}>
                      💬 WhatsApp
                    </motion.button>
                    <motion.button whileTap={{ scale: 0.97 }} onClick={() => handleShareAction("tiktok")}
                      className="flex items-center justify-center gap-2 font-semibold" style={{ height: 52, borderRadius: 14, fontSize: 14, background: "#000", color: "#fff" }}>
                      🎵 TikTok
                    </motion.button>
                    <motion.button whileTap={{ scale: 0.97 }} onClick={() => handleShareAction("anywhere")}
                      className="flex items-center justify-center gap-2 font-semibold" style={{ height: 52, borderRadius: 14, fontSize: 14, background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.15)", color: "#fff" }}>
                      📤 More
                    </motion.button>
                  </div>
                  {selectedCardType === "kitchen" && (
                    <div className="mt-4 text-center">
                      <p className="text-[12px]" style={{ color: "rgba(255,255,255,0.5)" }}>Kitchen Score: {userStats.kitchen_score}/100</p>
                      <button onClick={handleChallengeCopy} className="text-center mt-2 font-semibold transition-colors" style={{ fontSize: 13, color: challengeCopied ? "#22C55E" : "#C41E3A" }}>
                        {challengeCopied ? "Challenge link copied ✓" : "🏆 Think your kitchen can beat mine? →"}
                      </button>
                    </div>
                  )}
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Score transparency modal */}
        <AnimatePresence>
          {showScoreModal && scoreBreakdown && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-[60] flex items-end justify-center" onClick={() => setShowScoreModal(false)}>
              <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" />
              <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
                transition={{ type: "spring", damping: 28, stiffness: 300 }}
                className="relative w-full rounded-t-[20px] z-10" style={{ maxHeight: "60vh", background: "#FFFFFF" }}
                onClick={e => e.stopPropagation()}>
                <div className="flex justify-center pt-3"><div className="w-10 h-1 rounded-full bg-gray-200" /></div>
                <button onClick={() => setShowScoreModal(false)} className="absolute top-3 right-4" aria-label="Close">
                  <X size={24} style={{ color: "#111827" }} />
                </button>
                <div className="px-5 pb-6 pt-4 overflow-y-auto" style={{ maxHeight: "calc(60vh - 32px)" }}>
                  <h3 className="font-extrabold text-xl mb-5" style={{ color: "#111827" }}>How we scored this</h3>
                  {[
                    { label: "Nutritional Quality", val: `${scoreBreakdown.nutritionContribution} / 60 pts`, sub: `Based on Nutri-Score ${scoreBreakdown.nutriScoreGrade?.toUpperCase() || "N/A"}`, color: nutriColors[scoreBreakdown.nutriScoreGrade?.toLowerCase() || ""]?.bg || "#6B7280" },
                    { label: "Additives", val: `${scoreBreakdown.additiveContribution} / 30 pts`, sub: `${scoreBreakdown.additiveCount} additives · ${scoreBreakdown.worstAdditiveRisk} risk`, color: getAdditiveRiskColor(scoreBreakdown.worstAdditiveRisk) },
                    { label: "Organic", val: `${scoreBreakdown.organicContribution} / 10 pts`, sub: scoreBreakdown.isOrganic ? "Organic certified" : "No organic certification", color: scoreBreakdown.isOrganic ? "#22C55E" : "#9CA3AF" },
                  ].map((item, i) => (
                    <div key={i} className="py-4 px-4 rounded-xl mb-2" style={{ background: "#F9FAFB" }}>
                      <div className="flex justify-between items-center">
                        <span className="font-semibold text-sm" style={{ color: "#111827" }}>{item.label}</span>
                        <span className="font-semibold text-sm" style={{ color: item.color }}>{item.val}</span>
                      </div>
                      <p className="text-xs mt-1" style={{ color: "#9CA3AF" }}>{item.sub}</p>
                    </div>
                  ))}
                  {scoreBreakdown.hasHighRiskAdditive && (
                    <span className="inline-block mt-2 text-[11px] font-semibold px-2.5 py-1 rounded-md" style={{ background: "#FEF3C7", color: "#92400E" }}>
                      ⚠ Score capped at 49 due to high-risk additive
                    </span>
                  )}
                  <p className="text-[11px] text-center mt-4" style={{ color: "#9CA3AF" }}>
                    Based on Nutri-Score, EFSA research, and IARC guidelines.
                  </p>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ─── SCROLLABLE RESULT CONTENT ─── */}
        <div className="flex-1 overflow-y-auto" style={{ paddingBottom: 100 }}>
          {/* SKELETON LOADER */}
          {loading && (
            <div className="px-5 pt-6">
              <div className="flex items-center gap-3" style={{ height: 80 }}>
                <Skeleton className="w-[80px] h-[80px] rounded-[16px] flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-5 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              </div>
              <div className="flex justify-center mt-6">
                <Skeleton className="w-[110px] h-[110px] rounded-full" />
              </div>
              <Skeleton className="h-9 w-full rounded-full mt-4" />
              <div className="mt-6 space-y-3">
                {[1,2,3].map(i => <Skeleton key={i} className="h-[52px] w-full rounded-xl" />)}
              </div>
              {slowLoad && <p className="text-center text-sm mt-4" style={{ color: "#6B7280" }}>Taking longer than usual...</p>}
            </div>
          )}

          {/* NOT FOUND */}
          {notFound && !loading && (
            <div className="py-16 text-center px-5">
              <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: "#F3F4F6" }}>
                <Barcode size={28} style={{ color: "#9CA3AF" }} />
              </div>
              <h3 className="font-bold text-lg" style={{ color: "#111827" }}>Product not found</h3>
              <p className="text-sm mt-2 max-w-[260px] mx-auto" style={{ color: "#6B7280" }}>This product may not be in our database yet.</p>
              <button onClick={() => { const code = prompt("Enter barcode manually:"); if (code?.trim()) handleBarcodeDetected(code.trim()); }}
                className="mt-4 px-5 py-2.5 rounded-xl text-sm font-semibold border" style={{ borderColor: "#E8314A", color: "#E8314A" }}>
                Try Manual Search
              </button>
            </div>
          )}

          {/* ─── PRODUCT RESULT ─── */}
          {productInfo && !loading && (
            <>
              {/* City pill on result */}
              {currentCity && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-1.5 px-5 pt-2 pb-1">
                  <span style={{ fontSize: 11 }}>📍</span>
                  <span className="text-[10px] font-medium" style={{ color: "#065F46" }}>{currentCity}</span>
                </motion.div>
              )}

              {/* HEADER — Product image + name + share */}
              <div className="flex items-start gap-3 px-5 pt-3">
                <div className="flex-shrink-0 overflow-hidden" style={{ width: 72, height: 72, borderRadius: 14, background: "#F3F4F6" }}>
                  {productInfo.imageSmallUrl || productInfo.imageUrl ? (
                    <img src={productInfo.imageSmallUrl || productInfo.imageUrl} alt={productInfo.productName}
                      width={72} height={72} className="w-full h-full object-contain" loading="eager"
                      onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center"><Barcode size={22} style={{ color: "#D1D5DB" }} /></div>
                  )}
                </div>
                <div className="flex-1 min-w-0 pt-0.5">
                  <p className="font-bold leading-tight" style={{ fontSize: 17, color: "#111827", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                    {displayName}
                  </p>
                  <p className="text-[13px] mt-0.5 truncate" style={{ color: "#6B7280" }}>
                    {productInfo.brand || "Unknown brand"}
                  </p>
                </div>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <motion.button whileTap={{ scale: 0.9 }} onClick={handleShareTap} disabled={shareGenerating}
                    className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: "#F3F4F6" }}>
                    <Share2 size={16} style={{ color: "#374151" }} />
                  </motion.button>
                </div>
              </div>

              {/* SCORE HERO — centered, animated */}
              {scoreBreakdown && (
                <div className="flex flex-col items-center" style={{ marginTop: 12 }}>
                  <button onClick={() => setShowScoreModal(true)}>
                    <ScoreRing score={scoreBreakdown.total} size={88} />
                  </button>
                  <motion.p
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.3, duration: 0.3 }}
                    className="font-bold text-center" style={{ fontSize: 16, color: getScoreColor(scoreBreakdown.total), marginTop: 6 }}>
                    {getScoreVerdict(scoreBreakdown.total)}
                  </motion.p>

                  {/* Verdict banner — full width pill */}
                  <motion.div
                    initial={{ opacity: 0, scale: 1 }}
                    animate={{ opacity: 1, scale: [1, 1.04, 1] }}
                    transition={{ delay: 0.5, duration: 0.4 }}
                    className="mx-5 mt-2 flex items-center justify-center"
                    style={{ height: 32, borderRadius: 16, background: getScoreColor(scoreBreakdown.total), width: "calc(100% - 40px)" }}>
                    <p className="font-semibold text-center text-white" style={{ fontSize: 12 }}>
                      {getVerdictBanner(scoreBreakdown.total)}
                    </p>
                  </motion.div>

                  {/* AI Assistant Card */}
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6, duration: 0.3 }}
                    className="mx-5 mt-3 px-4 py-3 rounded-2xl w-full"
                    style={{ background: "#F9FAFB", border: "1px solid #F3F4F6", maxWidth: 350, margin: "12px auto 0" }}>
                    <div className="flex items-start gap-2.5">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: "linear-gradient(135deg, #C41E3A, #9E1830)" }}>
                        <Sparkles size={14} style={{ color: "#fff" }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "#C41E3A" }}>SKAAP AI Assistant</p>
                        {aiSummaryLoading ? (
                          <div className="space-y-1.5 mt-1">
                            <div className="h-3 rounded-full" style={{ background: "linear-gradient(90deg, #F3F4F6 25%, #E9EAEC 50%, #F3F4F6 75%)", backgroundSize: "200% 100%", animation: "shimmer 1.4s infinite", width: "100%" }} />
                            <div className="h-3 rounded-full" style={{ background: "linear-gradient(90deg, #F3F4F6 25%, #E9EAEC 50%, #F3F4F6 75%)", backgroundSize: "200% 100%", animation: "shimmer 1.4s infinite", width: "70%" }} />
                          </div>
                        ) : aiSummary ? (
                          <p className="text-[12px] leading-relaxed mt-0.5" style={{ color: "#374151" }}>{aiSummary}</p>
                        ) : (
                          <p className="text-[12px] leading-relaxed mt-0.5" style={{ color: "#374151" }}>{getStaticSummary(scoreBreakdown, productInfo)}</p>
                        )}
                      </div>
                    </div>
                  </motion.div>

                  {/* Data quality + tap hint */}
                  <div className="mt-1.5 flex items-center gap-2" style={{ fontSize: 10 }}>
                    <div className="flex items-center gap-1">
                      <div className="rounded-full" style={{ width: 5, height: 5, background: dataComplete ? "#22C55E" : "#F59E0B" }} />
                      <span style={{ color: "#9CA3AF" }}>{dataComplete ? "Complete data" : "Partial data"}</span>
                    </div>
                    {productInfo.usdaFallback && <span style={{ color: "#9CA3AF" }}>· USDA</span>}
                    <span style={{ color: "#D1D5DB" }}>· Tap score for details</span>
                  </div>
                </div>
              )}

              {/* SIGNAL CHIPS ROW */}
              <div className="flex gap-2 px-5" style={{ marginTop: 16 }}>
                {/* Nutri-Score */}
                {(() => {
                  const ns = productInfo.nutriScoreGrade?.toLowerCase();
                  const hasNS = ns && nutriColors[ns];
                  const chipBg = hasNS ? (ns === "a" || ns === "b" ? "#F0FDF4" : ns === "c" ? "#FFFBEB" : "#FFF1F2") : "#F9FAFB";
                  const chipBorder = hasNS ? (ns === "a" || ns === "b" ? "#BBF7D0" : ns === "c" ? "#FDE68A" : "#FECDD3") : "#E5E7EB";
                  const chipColor = hasNS ? nutriColors[ns]!.bg : "#9CA3AF";
                  return (
                    <div className="flex-1 flex flex-col items-center justify-center" style={{ height: 56, borderRadius: 14, background: chipBg, border: `1px solid ${chipBorder}` }}>
                      <span className="font-bold" style={{ fontSize: 18, color: chipColor }}>{hasNS ? ns!.toUpperCase() : "?"}</span>
                      <span style={{ fontSize: 10, color: "#6B7280" }}>Nutri-Score</span>
                    </div>
                  );
                })()}
                {/* Additives */}
                {(() => {
                  const chipBg = addCount === 0 ? "#F0FDF4" : "#FFF1F2";
                  const chipBorder = addCount === 0 ? "#BBF7D0" : "#FECDD3";
                  const chipColor = addCount === 0 ? "#22C55E" : "#E8314A";
                  return (
                    <div className="flex-1 flex flex-col items-center justify-center" style={{ height: 56, borderRadius: 14, background: chipBg, border: `1px solid ${chipBorder}` }}>
                      <span className="font-bold" style={{ fontSize: 18, color: chipColor }}>{addCount}</span>
                      <span style={{ fontSize: 10, color: "#6B7280" }}>additives</span>
                    </div>
                  );
                })()}
                {/* NOVA */}
                {(() => {
                  const nova = productInfo.novaGroup;
                  const hasNova = nova && novaColors[nova];
                  const chipBg = hasNova ? (nova <= 2 ? "#F0FDF4" : "#FFF1F2") : "#F9FAFB";
                  const chipBorder = hasNova ? (nova <= 2 ? "#BBF7D0" : "#FECDD3") : "#E5E7EB";
                  const chipColor = hasNova ? novaColors[nova].bg : "#9CA3AF";
                  return (
                    <div className="flex-1 flex flex-col items-center justify-center" style={{ height: 56, borderRadius: 14, background: chipBg, border: `1px solid ${chipBorder}` }}>
                      <span className="font-bold" style={{ fontSize: 18, color: chipColor }}>{hasNova ? nova : "?"}</span>
                      <span style={{ fontSize: 10, color: "#6B7280" }}>NOVA</span>
                    </div>
                  );
                })()}
                {/* Eco-Score */}
                {(() => {
                  const eco = productInfo.ecoscoreGrade?.toLowerCase();
                  const hasEco = eco && ecoColors[eco];
                  const c = hasEco ? ecoColors[eco] : { bg: "#F9FAFB", border: "#E5E7EB", color: "#9CA3AF" };
                  return (
                    <div className="flex-1 flex flex-col items-center justify-center" style={{ height: 56, borderRadius: 14, background: c.bg, border: `1px solid ${c.border}` }}>
                      <div className="flex items-center gap-0.5">
                        <Leaf size={12} style={{ color: c.color }} />
                        <span className="font-bold" style={{ fontSize: 18, color: c.color }}>{hasEco ? eco!.toUpperCase() : "?"}</span>
                      </div>
                      <span style={{ fontSize: 10, color: "#6B7280" }}>Eco</span>
                    </div>
                  );
                })()}
              </div>

              {/* LEARN WHY — Educational explainer cards */}
              <div className="mx-5" style={{ marginTop: 12 }}>
                <button onClick={() => toggleSection("learn-why")} className="w-full flex items-center gap-2 text-left">
                  <span style={{ fontSize: 14 }}>📖</span>
                  <span className="flex-1 font-semibold" style={{ fontSize: 13, color: "#6B7280" }}>What do these scores mean?</span>
                  <motion.div animate={{ rotate: expandedSections.has("learn-why") ? 180 : 0 }} transition={{ duration: 0.2 }}>
                    <ChevronDown size={14} style={{ color: "#9CA3AF" }} />
                  </motion.div>
                </button>
                <div style={{ display: "grid", gridTemplateRows: expandedSections.has("learn-why") ? "1fr" : "0fr", transition: "grid-template-rows 220ms ease-out" }}>
                  <div className="overflow-hidden" style={{ minHeight: 0 }}>
                    <div className="pt-3 space-y-3">
                      {[
                        { icon: "🅰️", title: "Nutri-Score", body: "A grade from A (best) to E (worst) based on calories, sugar, salt, saturated fat, fiber, and protein. A = eat freely. E = limit this." },
                        { icon: "⚗️", title: "Additives", body: "Chemicals added to food for color, flavor, or shelf life. Some are safe, some are banned in other countries. Fewer = better." },
                        { icon: "🏭", title: "NOVA Group", body: "How processed is this food? 1 = fresh/natural. 4 = ultra-processed (made in factories with lots of chemicals). Stick to 1-2 when you can." },
                        { icon: "🌍", title: "Eco-Score", body: "How much this product impacts the planet — from farming to packaging. A = planet-friendly. E = heavy environmental cost." },
                      ].map(item => (
                        <div key={item.title} className="flex gap-3 items-start">
                          <span style={{ fontSize: 16, lineHeight: "20px" }}>{item.icon}</span>
                          <div>
                            <p className="font-bold text-[13px]" style={{ color: "#111827" }}>{item.title}</p>
                            <p className="text-[12px] leading-relaxed" style={{ color: "#6B7280" }}>{item.body}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* DIETARY CHIPS */}
              {dietaryTags && Object.keys(dietaryTags).length > 0 && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-2 px-5 flex-wrap" style={{ marginTop: 8 }}>
                  {Object.keys(dietaryTags).map(key => (
                    <span key={key} className="inline-flex items-center font-semibold" style={{ height: 26, padding: "0 10px", borderRadius: 20, fontSize: 11, background: "#F0FFF4", border: "1px solid #6EE7B7", color: "#065F46" }}>
                      {DIETARY_LABELS[key] || key}
                    </span>
                  ))}
                </motion.div>
              )}

              {/* EU BANNED ALERT */}
              {(() => {
                const bannedInProduct = findBannedAdditives(productInfo.additivesTags);
                const euBanned = bannedInProduct.filter(b => b.eu_status === "banned");
                if (euBanned.length === 0) return null;
                return (
                  <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="mx-5" style={{ marginTop: 12, padding: "12px 16px", background: "#FFFBEB", border: "1px solid #FDE68A", borderRadius: 12 }}>
                    <p className="font-semibold text-[14px]" style={{ color: "#92400E" }}>🚩 Contains ingredients banned in Europe</p>
                    <p className="text-[13px] mt-1" style={{ color: "#92400E" }}>
                      {euBanned.map(b => b.name).join(", ")} — legal in the US but banned in the EU.
                    </p>
                  </motion.div>
                );
              })()}

              {/* ─── POSITIVES SECTION ─── */}
              {positives.length > 0 && (
                <div className="mx-5" style={{ marginTop: 20 }}>
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-bold" style={{ fontSize: 16, color: "#111827" }}>Positives</p>
                    {productInfo.servingSize && (
                      <p style={{ fontSize: 12, color: "#9CA3AF" }}>per 100g</p>
                    )}
                  </div>
                  {positives.map((row, i) => (
                    <motion.div key={row.label + i}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05, duration: 0.3, ease: "easeOut" }}
                      className="flex items-center gap-3" style={{ height: 52, borderBottom: i < positives.length - 1 ? "1px solid #F3F4F6" : "none" }}>
                      <div className="flex-shrink-0 flex items-center justify-center" style={{ width: 32, height: 32, borderRadius: 16, background: "#F0FDF4" }}>
                        <span style={{ fontSize: 14 }}>{row.icon}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-[14px]" style={{ color: "#111827" }}>{row.label}</p>
                        <p className="text-[12px]" style={{ color: "#6B7280" }}>{row.descriptor}</p>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {row.val != null && (
                          <span className="font-semibold text-[14px]" style={{ color: "#111827" }}>{typeof row.val === "number" ? (row.val < 1 ? row.val.toFixed(1) : Math.round(row.val)) : row.val}{row.unit}</span>
                        )}
                        <div className="rounded-full" style={{ width: 8, height: 8, background: row.dotColor }} />
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}

              {/* ─── NEGATIVES SECTION ─── */}
              {negatives.length > 0 && (
                <div className="mx-5" style={{ marginTop: 16 }}>
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-bold" style={{ fontSize: 16, color: "#111827" }}>Negatives</p>
                    <p style={{ fontSize: 12, color: "#9CA3AF" }}>per 100g</p>
                  </div>
                  {negatives.map((row, i) => (
                    <motion.div key={row.label + i}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05, duration: 0.3, ease: "easeOut" }}
                      className="flex items-center gap-3" style={{ height: 52, borderBottom: i < negatives.length - 1 ? "1px solid #F3F4F6" : "none" }}>
                      <div className="flex-shrink-0 flex items-center justify-center" style={{ width: 32, height: 32, borderRadius: 16, background: "#FFF1F2" }}>
                        <span style={{ fontSize: 14 }}>{row.icon}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-[14px]" style={{ color: "#111827" }}>{row.label}</p>
                        <p className="text-[12px]" style={{ color: "#6B7280" }}>{row.descriptor}</p>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {row.val != null && (
                          <span className="font-semibold text-[14px]" style={{ color: "#111827" }}>{typeof row.val === "number" ? (row.val < 1 ? row.val.toFixed(1) : Math.round(row.val)) : row.val}{row.unit}</span>
                        )}
                        <div className="rounded-full" style={{ width: 8, height: 8, background: row.dotColor }} />
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}

              {/* ─── ADDITIVES CARD ─── */}
              {(addCount > 0 || true) && (
                <div className="mx-5" style={{ marginTop: 16, borderRadius: 16, border: addCount > 0 ? "1px solid #FFF1F2" : "1px solid #F0FDF4", padding: 16 }}>
                  <div className="flex items-center gap-3 mb-3">
                    <div className="flex-shrink-0 flex items-center justify-center" style={{ width: 28, height: 28, borderRadius: 14, background: addCount > 0 ? "#FFF1F2" : "#F0FDF4" }}>
                      {addCount > 0 ? <AlertTriangle size={14} style={{ color: "#E8314A" }} /> : <Check size={14} style={{ color: "#22C55E" }} />}
                    </div>
                    <span className="font-bold flex-1" style={{ fontSize: 15, color: "#111827" }}>Additives</span>
                    {addCount > 0 && (
                      <span className="font-bold text-white" style={{ fontSize: 12, padding: "2px 10px", borderRadius: 10, background: "#E8314A" }}>{addCount}</span>
                    )}
                  </div>
                  {productInfo.additivesTags && productInfo.additivesTags.length > 0 ? (
                    productInfo.additivesTags.map((a, i) => {
                      const code = a.replace(/^en:/, "").replace(/-.*$/, "").toUpperCase();
                      const risk = getAdditiveRisk(a);
                      const riskColor = getAdditiveRiskColor(risk);
                      const desc = getAdditiveDescription(a);
                      const isExp = expandedAdditive === a;
                      const bannedMatch = matchBannedAdditive(a);
                      const badges = bannedMatch ? getBadgeInfo(bannedMatch) : [];
                      return (
                        <div key={a} style={{ borderBottom: i < productInfo.additivesTags!.length - 1 ? "1px solid #F3F4F6" : "none" }}>
                          <button onClick={() => handleAdditiveExpand(a, productInfo.productName)} className="w-full py-2.5 text-left flex items-center gap-3">
                            <span className="font-semibold" style={{ fontSize: 13, color: riskColor, minWidth: 40 }}>{code}</span>
                            <span className="flex-1 text-[13px]" style={{ color: "#374151" }}>{formatTag(a)}</span>
                            <div className="rounded-full flex-shrink-0" style={{ width: 8, height: 8, background: riskColor }} />
                            <ChevronRight size={14} style={{ color: "#D1D5DB", transform: isExp ? "rotate(90deg)" : "none", transition: "transform 200ms" }} />
                          </button>
                          {badges.length > 0 && (
                            <div className="flex flex-wrap gap-1 pb-1.5 pl-[52px]">
                              {badges.map((badge, bi) => (
                                <span key={bi} className="text-[10px] font-semibold px-1.5 py-0.5 rounded-lg" style={{ background: badge.bg, border: `1px solid ${badge.border}`, color: badge.color }}>{badge.label}</span>
                              ))}
                            </div>
                          )}
                          <div style={{ display: "grid", gridTemplateRows: isExp ? "1fr" : "0fr", transition: "grid-template-rows 250ms ease-out" }}>
                            <div className="overflow-hidden" style={{ minHeight: 0 }}>
                              <div className="pb-2 pl-[52px]">
                                {additiveExplanationLoading && isExp ? (
                                  <div className="space-y-1"><Skeleton className="h-3 w-full rounded" /><Skeleton className="h-3 w-4/5 rounded" /></div>
                                ) : additiveExplanation && isExp ? (
                                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                                    <p className="text-[12px] leading-relaxed" style={{ color: "#4B5563" }}>{additiveExplanation}</p>
                                    <p className="text-[9px] mt-1 flex items-center gap-1" style={{ color: "#9CA3AF" }}><Sparkles size={8} /> AI</p>
                                  </motion.div>
                                ) : null}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="text-center py-2">
                      <p className="font-semibold text-[13px]" style={{ color: "#22C55E" }}>No additives detected ✓</p>
                    </div>
                  )}
                </div>
              )}

              {/* ─── HEALTHIER ALTERNATIVES (OFF real products) ─── */}
              {(offRecs.length > 0 || offRecsLoading) && (
                <div className="mx-5" style={{ marginTop: 20 }}>
                  <div className="flex items-center justify-between mb-3">
                    <p className="font-bold" style={{ fontSize: 16, color: "#111827" }}>Healthier Alternatives</p>
                  </div>
                  <div className="flex gap-3 overflow-x-auto pb-2" style={{ scrollbarWidth: "none" }}>
                    {offRecsLoading ? (
                      [1,2,3].map(i => (
                        <div key={i} className="flex-shrink-0" style={{ width: 160, height: 120, borderRadius: 16, border: "1px solid #F3F4F6", padding: 12 }}>
                          <Skeleton className="w-10 h-10 rounded-[10px]" />
                          <Skeleton className="h-3 w-3/4 mt-2" />
                          <Skeleton className="h-3 w-1/2 mt-1" />
                        </div>
                      ))
                    ) : (
                      offRecs.map((rec, i) => (
                        <motion.button key={rec.barcode}
                          initial={{ opacity: 0, x: 30 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.08, duration: 0.3 }}
                          onClick={() => handleBarcodeDetected(rec.barcode)}
                          className="flex-shrink-0 text-left relative"
                          style={{ width: 160, height: 120, borderRadius: 16, border: "1px solid #F3F4F6", padding: 12, background: "#FFFFFF" }}>
                          <div className="flex items-start justify-between">
                            {rec.imageSmallUrl ? (
                              <img src={rec.imageSmallUrl} alt={rec.productName} className="object-contain" style={{ width: 40, height: 40, borderRadius: 10 }} />
                            ) : (
                              <div style={{ width: 40, height: 40, borderRadius: 10, background: "#F3F4F6" }} className="flex items-center justify-center">
                                <Barcode size={14} style={{ color: "#D1D5DB" }} />
                              </div>
                            )}
                            <span className="font-bold text-white" style={{ fontSize: 12, padding: "2px 8px", borderRadius: 10, background: getScoreColor(rec.skaapScoreEstimate) }}>
                              {rec.skaapScoreEstimate}
                            </span>
                          </div>
                          <p className="font-semibold mt-1.5" style={{ fontSize: 12, color: "#111827", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden", lineHeight: "1.3" }}>
                            {rec.productName}
                          </p>
                          {rec.brand && <p style={{ fontSize: 11, color: "#6B7280" }} className="truncate">{rec.brand}</p>}
                        </motion.button>
                      ))
                    )}
                  </div>
                </div>
              )}

              {/* ─── INGREDIENTS ACCORDION ─── */}
              <div style={{ marginTop: 16, marginLeft: 20, marginRight: 20, marginBottom: 8, borderRadius: 16, border: "1px solid #F3F4F6", padding: 16 }}>
                <button onClick={() => toggleSection("ingredients")} className="w-full flex items-center gap-3 text-left">
                  <span style={{ fontSize: 16 }}>📋</span>
                  <span className="flex-1 font-semibold" style={{ fontSize: 15, color: "#111827" }}>Ingredients</span>
                  <motion.div animate={{ rotate: expandedSections.has("ingredients") ? 180 : 0 }} transition={{ duration: 0.2 }}>
                    <ChevronDown size={16} style={{ color: "#9CA3AF" }} />
                  </motion.div>
                </button>
                <div style={{ display: "grid", gridTemplateRows: expandedSections.has("ingredients") ? "1fr" : "0fr", transition: "grid-template-rows 220ms ease-out" }}>
                  <div className="overflow-hidden" style={{ minHeight: 0 }}>
                    <div className="pt-3">
                      {productInfo.ingredientsText ? (
                        <p className="text-[13px] leading-relaxed" style={{ color: "#6B7280" }}>
                          {productInfo.allergensTags?.length ? highlightAllergens(productInfo.ingredientsText, productInfo.allergensTags) : productInfo.ingredientsText}
                        </p>
                      ) : (
                        <p className="text-[13px]" style={{ color: "#9CA3AF" }}>No ingredients data available.</p>
                      )}
                      {productInfo.allergensTags && productInfo.allergensTags.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-1">
                          <span className="text-[11px] font-semibold" style={{ color: "#111827" }}>Allergens:</span>
                          {productInfo.allergensTags.map(a => (
                            <span key={a} className="text-[11px] font-bold px-2 py-0.5 rounded-full" style={{ background: "#FEE2E2", color: "#E8314A" }}>{formatTag(a)}</span>
                          ))}
                        </div>
                      )}
                      {productInfo.labelsTags && productInfo.labelsTags.length > 0 && (
                        <div className="mt-3">
                          <p className="text-[12px] font-bold mb-1" style={{ color: "#111827" }}>Certifications</p>
                          <div className="flex flex-wrap gap-1">
                            {productInfo.labelsTags.map(l => (
                              <span key={l} className="text-[11px] font-semibold px-2 py-0.5 rounded border" style={{ borderColor: "#111827", color: "#111827" }}>{formatTag(l)}</span>
                            ))}
                          </div>
                        </div>
                      )}
                      <button onClick={() => setScreen("ai-info")} className="mt-3 text-[11px] flex items-center gap-1 mx-auto" style={{ color: "#9CA3AF" }}>
                        <Sparkles size={9} /> How SKAAP uses AI
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* FEEDBACK ROW */}
        {!feedbackGiven && productInfo && !loading && (
          <div className="flex-shrink-0 flex items-center justify-center gap-2 py-1.5" style={{ borderTop: "1px solid #F3F4F6", background: "#FAFAFA" }}>
            <span className="text-[10px] font-medium" style={{ color: "#9CA3AF" }}>Rate this</span>
            {["😍", "👍", "😐", "👎"].map(emoji => (
              <motion.button key={emoji} whileTap={{ scale: 0.85 }} onClick={() => handleFeedback(emoji)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-base hover:bg-gray-100 transition-colors">
                {emoji}
              </motion.button>
            ))}
          </div>
        )}
        {feedbackGiven && (
          <div className="flex-shrink-0 flex items-center justify-center py-1.5" style={{ borderTop: "1px solid #F3F4F6", background: "#F0FDF4" }}>
            <span className="text-[10px] font-semibold" style={{ color: "#15803D" }}>Thanks! 🙏</span>
          </div>
        )}

        {/* BOTTOM ACTIONS — FIXED */}
        <div className="flex-shrink-0 flex items-center gap-2.5 px-4 relative" style={{ borderTop: "1px solid #F3F4F6", background: "#FFFFFF", padding: "10px 16px", paddingBottom: "calc(env(safe-area-inset-bottom, 8px) + 10px)" }}>
          {/* Heart particle animation */}
          <AnimatePresence>
            {heartParticle && (
              <motion.span
                initial={{ opacity: 1, y: 0, x: "50%" }}
                animate={{ opacity: 0, y: -40 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.6, ease: "easeOut" }}
                className="absolute text-lg pointer-events-none"
                style={{ right: "30%", bottom: 48 }}>
                🤍
              </motion.span>
            )}
          </AnimatePresence>
          <motion.button whileTap={{ scale: 0.97 }} onClick={scanAnother}
            className="flex-1 font-semibold flex items-center justify-center"
            style={{ color: "#374151", background: "#FFFFFF", border: "1px solid #E5E7EB", height: 46, borderRadius: 12, fontSize: 14 }}>
            Scan Again
          </motion.button>
          <motion.button whileTap={{ scale: 0.97 }} onClick={handleSave}
            className="flex-1 font-semibold flex items-center justify-center gap-1.5"
            style={{
              background: savedState === "saved" ? "#22C55E" : isInBasket(currentBarcode) ? "#FFFFFF" : "#E8314A",
              color: savedState === "saved" ? "#fff" : isInBasket(currentBarcode) ? "#E8314A" : "#fff",
              height: 46, borderRadius: 12, fontSize: 14,
              border: isInBasket(currentBarcode) && savedState !== "saved" ? "1px solid #E5E7EB" : "none",
            }}>
            {savedState === "saved" ? <>Saved ✓</> : isInBasket(currentBarcode) ? <><Heart size={14} fill="#E8314A" /> Saved</> : <><Heart size={14} /> Save ♥</>}
          </motion.button>
        </div>
      </div>
    );
  }
  if (screen === "history") {
    return (
      <HistoryScreen
        history={history}
        onBack={() => setScreen("home")}
        onScanProduct={handleBarcodeDetected}
        onClearHistory={() => { clearHistory(); setHistory([]); }}
        activeNav="history"
        onNavChange={handleNavChange}
        savedItems={basket.map(b => ({ barcode: b.barcode, name: b.name, brand: b.brand, image: b.image, skaapScore: b.skaapScore, scannedAt: b.savedAt }))}
      />
    );
  }

  // ─── SCREEN: SEARCH ───
  if (screen === "search") {
    return (
      <SearchScreen
        onScanProduct={handleBarcodeDetected}
        onNavChange={handleNavChange}
        onOpenScanner={goToScan}
      />
    );
  }

  // ─── SCREEN: COMMUNITY INTELLIGENCE ───
  if (screen === "community") {
    return (
      <CommunityScreen
        onNavChange={handleNavChange}
        onScanProduct={handleBarcodeDetected}
      />
    );
  }

  // ─── SCREEN: RECS (AI Personalized Recommendations) ───
  if (screen === "kitchen") {
    return (
      <RecsScreen
        onScanProduct={handleBarcodeDetected}
        onNavChange={handleNavChange}
        onOpenScanner={goToScan}
        onOpenKitchenReport={() => setScreen("kitchen-report")}
      />
    );
  }

  // ─── SCREEN: KITCHEN REPORT (Detailed breakdown) ───
  if (screen === "kitchen-report") {
    return (
      <KitchenReportScreen
        userStats={userStats}
        onBack={() => setScreen("kitchen")}
        onNavChange={handleNavChange}
      />
    );
  }


  // ─── SCREEN: TOP PRODUCTS ───
  if (screen === "top") {
    return (
      <TopProductsScreen
        onScanProduct={handleBarcodeDetected}
        onNavChange={handleNavChange}
      />
    );
  }

  // ─── SCREEN: PROFILE ───
  if (screen === "profile") {
    return <ProfileScreen onBack={() => setScreen("home")} />;
  }

  // ─── SCREEN: BASKET (Saved Products Comparison) ───
  if (screen === "basket") {
    return (
      <div className="min-h-screen bg-background" style={{ maxWidth: 430, margin: "0 auto" }}>
        <div className="flex items-center justify-between px-5 pt-[env(safe-area-inset-top,12px)] h-14">
          <button onClick={() => setScreen("home")} className="flex items-center">
            <ArrowLeft size={20} style={{ color: "#1B2A4A" }} />
          </button>
          <h1 className="font-extrabold text-[20px] tracking-tight" style={{ color: "#1B2A4A" }}>Saved Products</h1>
          {basket.length >= 2 ? (
            <div className="flex items-center gap-1.5">
              <button onClick={async () => {
                const blob = await exportBasketImage(basket, getScoreColor);
                if (!blob) return;
                const file = new File([blob], "skaap-comparison.png", { type: "image/png" });
                if (navigator.share && navigator.canShare?.({ files: [file] })) {
                  try { await navigator.share({ files: [file], title: "SKAAP Comparison" }); } catch {}
                } else {
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement("a");
                  a.href = url; a.download = "skaap-comparison.png";
                  a.click(); URL.revokeObjectURL(url);
                }
              }} className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: "#F5F5F5" }}
                title="Export as image">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1B2A4A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="m21 15-5-5L5 21"/></svg>
              </button>
              <button onClick={async () => {
                const lines = basket.map((item, i) =>
                  `${i + 1}. ${item.name}${item.brand ? ` (${item.brand})` : ""} — Score: ${item.skaapScore ?? "N/A"}/100${item.nutriScore ? ` · Nutri-Score ${item.nutriScore.toUpperCase()}` : ""}`
                );
                const shareText = `🐑 SKAAP Product Comparison\n\n${lines.join("\n")}\n\nCompare food products at useskaap.com`;
                if (navigator.share) {
                  try { await navigator.share({ title: "SKAAP Comparison", text: shareText }); } catch {}
                } else {
                  try { await navigator.clipboard.writeText(shareText); } catch {}
                }
              }} className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: "#F5F5F5" }}>
                <Share2 size={18} style={{ color: "#1B2A4A" }} />
              </button>
            </div>
          ) : (
            <div className="w-8" />
          )}
        </div>

        <div className="px-5 pt-2 pb-28">
          {basket.length === 0 ? (
            <div className="text-center py-16">
              <Heart size={40} style={{ color: "#E5E7EB", margin: "0 auto" }} />
              <p className="text-sm mt-4" style={{ color: "#6B7280" }}>No saved products yet</p>
              <p className="text-xs mt-1" style={{ color: "#9CA3AF" }}>Scan products and tap Save to compare them</p>
            </div>
          ) : (
            <>
              <p className="text-[12px] mb-4" style={{ color: "#9CA3AF" }}>{basket.length} product{basket.length !== 1 ? "s" : ""} saved · Compare side by side</p>

              {/* Comparison grid */}
              {basket.length >= 2 && (
                <div className="mb-5 rounded-2xl overflow-hidden" style={{ border: "1px solid #F3F4F6" }}>
                  <div className="px-4 py-2.5" style={{ background: "#F9FAFB" }}>
                    <h3 className="font-bold text-[13px]" style={{ color: "#1B2A4A" }}>Quick Compare</h3>
                  </div>
                  <div className="overflow-x-auto">
                    <div className="flex" style={{ minWidth: basket.length * 140 }}>
                      {basket.slice(0, 5).map(item => (
                        <div key={item.barcode} className="flex-1 min-w-[130px] p-3 text-center" style={{ borderRight: "1px solid #F3F4F6" }}>
                          <div className="w-14 h-14 rounded-xl overflow-hidden mx-auto mb-2" style={{ background: "#F7F7F7" }}>
                            {item.image ? (
                              <img src={item.image} alt={item.name} className="w-full h-full object-contain p-1" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center"><Barcode size={18} style={{ color: "#D1D5DB" }} /></div>
                            )}
                          </div>
                          <p className="font-semibold text-[11px] leading-tight truncate" style={{ color: "#1B2A4A" }}>{item.name}</p>
                          {item.skaapScore != null && (
                            <div className="mt-2 flex items-center justify-center gap-1.5">
                              <div className="w-8 h-8 rounded-full flex items-center justify-center text-[12px] font-extrabold text-white"
                                style={{ background: getScoreColor(item.skaapScore) }}>
                                {item.skaapScore}
                              </div>
                            </div>
                          )}
                          {item.nutriScore && (
                            <span className="inline-block mt-1.5 text-[10px] font-bold px-2 py-0.5 rounded-full"
                              style={{ background: nutriColors[item.nutriScore.toLowerCase()]?.bg, color: "#fff" }}>
                              {item.nutriScore.toUpperCase()}
                            </span>
                          )}
                          <div className="mt-1.5 text-[10px]" style={{ color: "#9CA3AF" }}>
                            {item.additiveCount === 0 ? "No additives" : `${item.additiveCount} additive${item.additiveCount > 1 ? "s" : ""}`}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Full list */}
              <div className="space-y-2">
                {basket.map((item, idx) => (
                  <motion.div key={item.barcode} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className="flex items-center gap-3 p-3 rounded-2xl" style={{ background: "#F9FAFB", border: "1px solid #F3F4F6" }}>
                    <button onClick={() => handleBarcodeDetected(item.barcode)} className="flex items-center gap-3 flex-1 min-w-0 text-left">
                      <div className="w-14 h-14 rounded-xl overflow-hidden flex-shrink-0" style={{ background: "#fff" }}>
                        {item.image ? (
                          <img src={item.image} alt={item.name} className="w-full h-full object-contain p-1" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center"><Barcode size={18} style={{ color: "#D1D5DB" }} /></div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-[14px] truncate" style={{ color: "#1B2A4A" }}>{item.name}</p>
                        {item.brand && <p className="text-[11px] truncate" style={{ color: "#6B7280" }}>{item.brand}</p>}
                        <div className="flex items-center gap-2 mt-1">
                          {item.skaapScore != null && (
                            <span className="text-[11px] font-extrabold px-1.5 py-0.5 rounded text-white" style={{ background: getScoreColor(item.skaapScore) }}>
                              {item.skaapScore}/100
                            </span>
                          )}
                          {item.nutriScore && (
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full text-white"
                              style={{ background: nutriColors[item.nutriScore.toLowerCase()]?.bg }}>
                              {item.nutriScore.toUpperCase()}
                            </span>
                          )}
                        </div>
                      </div>
                    </button>
                    <button onClick={() => { const updated = removeFromBasket(item.barcode); setBasket(updated); }}
                      className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: "#FEF2F2" }}>
                      <Trash2 size={16} style={{ color: "#EF4444" }} />
                    </button>
                  </motion.div>
                ))}
              </div>
            </>
          )}
        </div>

        <div className="fixed bottom-0 left-0 right-0 px-5 pb-6 pt-3" style={{ maxWidth: 430, margin: "0 auto", background: "hsl(var(--background))", paddingBottom: "calc(env(safe-area-inset-bottom, 16px) + 16px)" }}>
          <motion.button whileTap={{ scale: 0.97 }} onClick={() => setScreen("home")}
            className="w-full font-extrabold text-base" style={{ background: "#1B2A4A", color: "#fff", height: 52, borderRadius: 12 }}>
            Back to Scanner
          </motion.button>
        </div>
      </div>
    );
  }

  return null;
};

// ─── Static summary fallback ───
function getStaticSummary(score: SkaapScoreBreakdown, info: ProductFullInfo): string {
  if (score.nutriScoreGrade && ["a", "b"].includes(score.nutriScoreGrade.toLowerCase())) {
    return `Good nutritional profile with ${score.additiveCount === 0 ? "no" : "some"} additives.`;
  }
  if (score.hasHighRiskAdditive) {
    return "Contains a high-risk additive affecting the score.";
  }
  if (info.novaGroup === 4 && score.nutriScoreGrade && ["c", "d", "e"].includes(score.nutriScoreGrade.toLowerCase())) {
    return "Ultra-processed with a below-average nutritional profile.";
  }
  if (score.isOrganic) {
    return "Organic certified with a solid nutritional balance.";
  }
  return "Moderate nutritional quality. Check ingredients below.";
}

// ─── Allergen highlighting ───
function highlightAllergens(text: string, allergens: string[]): JSX.Element {
  const words = allergens.map(a => a.replace(/^en:/, "").replace(/[-_]/g, " ").toLowerCase());
  const pattern = words.filter(Boolean).map(w => w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|");
  if (!pattern) return <>{text}</>;
  const regex = new RegExp(`(${pattern})`, "gi");
  const parts = text.split(regex);
  return <>{parts.map((p, i) => regex.test(p) ? <strong key={i} style={{ color: "#1B2A4A" }}>{p}</strong> : <span key={i}>{p}</span>)}</>;
}

// ─── Desktop wrapper ───
function SkaapScanWithDesktopShell() {
  const isMobile = useIsMobile();

  if (isMobile) return <SkaapScan />;

  return (
    <DesktopShell>
      <SkaapScan />
    </DesktopShell>
  );
}

export default SkaapScanWithDesktopShell;
