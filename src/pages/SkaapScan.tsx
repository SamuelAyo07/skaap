import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, Zap, ZapOff, Barcode, Clock, ChevronDown, Leaf, X, Check, Sparkles,
  ShoppingBag, Trash2, Heart, Share2, Search, Filter,
} from "lucide-react";
import { fetchProductInfo, ProductFullInfo } from "@/lib/productInfoApi";
import { Skeleton } from "@/components/ui/skeleton";
import skaapIcon from "@/assets/skaap-icon.png";
import {
  calculateSkaapScore, getScoreColor, getScoreVerdict,
  getAdditiveRisk, getAdditiveRiskColor, getAdditiveRiskLabel,
  getAdditiveDescription, SkaapScoreBreakdown,
} from "@/lib/skaapScore";
import {
  fetchAISummary, fetchAdditiveExplanation, fetchDietaryClassification,
  fetchRecommendations, DIETARY_LABELS, AIRecommendation,
} from "@/lib/aiProductInsights";

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

type Screen = "home" | "scanning" | "result" | "history" | "ai-info" | "basket";

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
  e: { bg: "#E8314A", text: "#fff" },
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
  if (level === "high") return "#E8314A";
  return "#9CA3AF";
}

function formatTag(tag: string) {
  return tag.replace(/^en:/, "").replace(/[-_]/g, " ").replace(/\b\w/g, c => c.toUpperCase());
}

// ─── Score Ring SVG Component ───
function ScoreRing({ score, size = 120, showLabel = true }: { score: number; size?: number; showLabel?: boolean }) {
  const color = getScoreColor(score);
  const strokeW = size <= 72 ? 4 : 6;
  const r = (size - strokeW * 2) / 2;
  const circumference = 2 * Math.PI * r;
  const offset = circumference - (score / 100) * circumference;
  const reducedMotion = typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
  const fontSize = size <= 72 ? 28 : 40;

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#F3F4F6" strokeWidth={strokeW} />
        <circle
          cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={strokeW}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={reducedMotion ? offset : circumference}
          style={reducedMotion ? {} : {
            transition: "stroke-dashoffset 0.5s ease-out 0.3s",
          }}
          ref={(el) => {
            if (el && !reducedMotion) {
              requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                  el.style.strokeDashoffset = String(offset);
                });
              });
            }
          }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-extrabold leading-none" style={{ fontSize, color }}>{score}</span>
        {showLabel && <span className="font-semibold uppercase tracking-wider mt-0.5" style={{ fontSize: 8, color: "#9CA3AF" }}>/ 100</span>}
      </div>
    </div>
  );
}

// ─── Main Component ───
const SkaapScan = () => {
  const navigate = useNavigate();
  const [screen, setScreen] = useState<Screen>("home");

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
  }, []);

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
    stopCamera();

    setCurrentBarcode(barcode);
    setScreen("result");
    setLoading(true);
    setNotFound(false);
    setSlowLoad(false);
    setExpandedSections(new Set());
    setScoreBreakdown(null);
    setSavedState("idle");
    setShowScoreModal(false);
    setAiSummary(null);
    setAiSummaryLoading(false);
    setDietaryTags(null);
    setAiRecommendations(null);
    setAiRecsLoading(false);
    setExpandedAdditive(null);
    setAdditiveExplanation(null);

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
      fireAICalls(info, barcode, score);
    } else {
      setNotFound(true);
    }
    setLoading(false);
  }, [stopCamera, fireAICalls]);

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
    setProductInfo(null);
    setNotFound(false);
    setScanDetected(false);
    setHintVisible(true);
    setBottomHintVisible(true);
    setScoreBreakdown(null);
    setShowScoreModal(false);
    setSavedState("idle");
    setAiSummary(null);
    setDietaryTags(null);
    setAiRecommendations(null);
    setScreen("scanning");
    setTimeout(() => startCamera(), 100);
  };

  const goToScan = () => {
    setScreen("scanning");
    setScanDetected(false);
    setHintVisible(true);
    setBottomHintVisible(true);
    setTimeout(() => startCamera(), 100);
  };

  const handleSave = () => {
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
        setSavedState("saved");
        setTimeout(() => setSavedState("idle"), 1500);
      }
    }
  };

  useEffect(() => {
    return () => stopCamera();
  }, [stopCamera]);

  // Pre-load SKAAP icon for share card
  useEffect(() => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => { cachedSkaapIconRef.current = img; };
    img.src = skaapIcon;
  }, []);

  // ─── Share card canvas generation ───
  const generateShareCard = useCallback(async () => {
    if (!productInfo || !scoreBreakdown) return null;
    const score = scoreBreakdown.total;
    const W = 1080, H = 1920, dpr = 2;
    const canvas = document.createElement("canvas");
    canvas.width = W; canvas.height = H;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    // Score colors
    const scoreColor = score >= 75 ? "#2D7D46" : score >= 50 ? "#FFC107" : score >= 25 ? "#FF6D00" : "#E8314A";
    const verdict = score >= 75 ? "Excellent" : score >= 50 ? "Good" : score >= 25 ? "Mediocre" : "Poor";

    // LAYER 1 — Background gradient
    const gradEnd = score >= 75 ? "#1a3a2a" : score >= 50 ? "#2a2a0a" : score >= 25 ? "#2a1a0a" : "#2a0a0a";
    const grad = ctx.createLinearGradient(0, 0, W * 0.4, H);
    grad.addColorStop(0, "#0A1220");
    grad.addColorStop(1, gradEnd);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);

    // LAYER 2 — Subtle texture (seeded random from barcode)
    let seed = 0;
    for (let i = 0; i < currentBarcode.length; i++) seed = ((seed << 5) - seed + currentBarcode.charCodeAt(i)) | 0;
    const seededRand = () => { seed = (seed * 16807) % 2147483647; return (seed & 0x7fffffff) / 0x7fffffff; };
    for (let i = 0; i < 40; i++) {
      const r = 2 + seededRand() * 4;
      const x = seededRand() * W;
      const y = seededRand() * H;
      const opacity = 0.03 + seededRand() * 0.03;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255,255,255,${opacity})`;
      ctx.fill();
    }

    // LAYER 3 — SKAAP branding top
    ctx.textAlign = "center";
    const iconImg = cachedSkaapIconRef.current;
    if (iconImg) {
      ctx.save();
      ctx.beginPath();
      ctx.arc(W / 2, 120, 24, 0, Math.PI * 2);
      ctx.clip();
      ctx.drawImage(iconImg, W / 2 - 24, 96, 48, 48);
      ctx.restore();
    }
    ctx.fillStyle = "#fff";
    ctx.font = "800 28px Inter, system-ui, sans-serif";
    ctx.letterSpacing = "0.15em";
    ctx.fillText("SKAAP", W / 2, 180);
    ctx.letterSpacing = "0";
    ctx.fillStyle = "rgba(255,255,255,0.6)";
    ctx.font = "400 14px Inter, system-ui, sans-serif";
    ctx.fillText("useskaap.com", W / 2, 206);

    // LAYER 4 — Score hero center
    const cy = H * 0.45;
    const outerR = 180;
    // Background ring
    ctx.beginPath();
    ctx.arc(W / 2, cy, outerR, 0, Math.PI * 2);
    ctx.strokeStyle = "rgba(255,255,255,0.15)";
    ctx.lineWidth = 12;
    ctx.stroke();
    // Score arc
    ctx.beginPath();
    const startAngle = -Math.PI / 2;
    const endAngle = startAngle + (score / 100) * Math.PI * 2;
    ctx.arc(W / 2, cy, outerR, startAngle, endAngle);
    ctx.strokeStyle = scoreColor;
    ctx.lineWidth = 12;
    ctx.lineCap = "round";
    ctx.stroke();
    ctx.lineCap = "butt";
    // Score number
    ctx.fillStyle = "#fff";
    ctx.font = "800 96px Inter, system-ui, sans-serif";
    ctx.fillText(String(score), W / 2, cy + 32);
    ctx.fillStyle = "rgba(255,255,255,0.7)";
    ctx.font = "600 20px Inter, system-ui, sans-serif";
    ctx.fillText("/ 100", W / 2, cy + 62);
    // Verdict
    ctx.fillStyle = scoreColor;
    ctx.font = "600 24px Inter, system-ui, sans-serif";
    ctx.fillText(verdict, W / 2, cy + 98);

    // Product name & brand
    const nameY = cy + outerR + 70;
    ctx.fillStyle = "#fff";
    ctx.font = "800 32px Inter, system-ui, sans-serif";
    const displayN = productInfo.productName.length > 40
      ? productInfo.productName.slice(0, 38) + "…"
      : productInfo.productName;
    ctx.fillText(displayN, W / 2, nameY);
    if (productInfo.brand) {
      ctx.fillStyle = "rgba(255,255,255,0.6)";
      ctx.font = "400 20px Inter, system-ui, sans-serif";
      ctx.fillText(productInfo.brand, W / 2, nameY + 32);
    }

    // Three info pills
    const pillY = nameY + 72;
    const pillW = 60, pillH = 36, pillR = 18, pillGap = 16;
    const pillData: { label: string; color: string }[] = [];
    if (productInfo.nutriScoreGrade) {
      const nsC = nutriColors[productInfo.nutriScoreGrade.toLowerCase()]?.bg || "#9CA3AF";
      pillData.push({ label: productInfo.nutriScoreGrade.toUpperCase(), color: nsC });
    }
    if (productInfo.novaGroup) {
      pillData.push({ label: String(productInfo.novaGroup), color: "rgba(255,255,255,0.4)" });
    }
    const ac = productInfo.additivesTags?.length || 0;
    pillData.push({ label: ac === 0 ? "✓" : String(ac), color: ac === 0 ? "#2D7D46" : "rgba(255,255,255,0.4)" });

    const totalPillW = pillData.length * pillW + (pillData.length - 1) * pillGap;
    let pillX = (W - totalPillW) / 2;
    pillData.forEach(p => {
      ctx.strokeStyle = p.color;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(pillX, pillY, pillW, pillH, pillR);
      ctx.stroke();
      ctx.fillStyle = p.color;
      ctx.font = "800 18px Inter, system-ui, sans-serif";
      ctx.fillText(p.label, pillX + pillW / 2, pillY + 24);
      pillX += pillW + pillGap;
    });

    // LAYER 5 — Bottom CTA
    const ctaY = 1720;
    const ctaW = 900, ctaH = 160, ctaR = 24;
    const ctaX = (W - ctaW) / 2;
    ctx.fillStyle = "#fff";
    ctx.beginPath();
    ctx.roundRect(ctaX, ctaY, ctaW, ctaH, ctaR);
    ctx.fill();

    // Score-based copy
    let line1: string, line2: string;
    if (score >= 75) { line1 = "Just SKAAPed this 🌿"; line2 = "Clean ingredients. Great score."; }
    else if (score >= 50) { line1 = "Just SKAAPed this 👀"; line2 = "Not bad. But check the additives."; }
    else if (score >= 25) { line1 = "Just SKAAPed this 😬"; line2 = "You might want to think twice."; }
    else { line1 = "Just SKAAPed this 🚨"; line2 = "This one scored pretty rough."; }

    ctx.textAlign = "center";
    ctx.fillStyle = "#1B2A4A";
    ctx.font = "800 26px Inter, system-ui, sans-serif";
    ctx.fillText(line1, W / 2, ctaY + 50);
    ctx.fillStyle = "#6B7280";
    ctx.font = "400 18px Inter, system-ui, sans-serif";
    ctx.fillText(line2, W / 2, ctaY + 82);
    ctx.fillStyle = "#E8314A";
    ctx.font = "600 16px Inter, system-ui, sans-serif";
    ctx.fillText("Try it free → useskaap.com/scan", W / 2, ctaY + 120);

    // Invisible watermark
    ctx.fillStyle = "rgba(255,255,255,0.02)";
    ctx.font = "400 8px Inter, system-ui, sans-serif";
    ctx.textAlign = "right";
    ctx.fillText("Made with SKAAP · useskaap.com", W - 12, H - 8);
    ctx.textAlign = "left";

    return new Promise<Blob | null>(resolve => canvas.toBlob(b => resolve(b), "image/png"));
  }, [productInfo, scoreBreakdown, currentBarcode]);

  const handleShareTap = useCallback(async () => {
    if (shareGenerating) return;
    setShareGenerating(true);
    const blob = await generateShareCard();
    setShareGenerating(false);
    if (!blob) return;
    setShareImageBlob(blob);
    setShareImageUrl(URL.createObjectURL(blob));
    setShareModalOpen(true);
  }, [generateShareCard, shareGenerating]);

  const handleShareAction = useCallback(async (target: "instagram" | "anywhere") => {
    if (!shareImageBlob) return;
    const file = new File([shareImageBlob], "my-skaap-score.png", { type: "image/png" });
    if (navigator.share && navigator.canShare?.({ files: [file] })) {
      try { await navigator.share({ files: [file], title: "My SKAAP Score" }); } catch {}
    } else {
      // Fallback: download
      const url = URL.createObjectURL(shareImageBlob);
      const a = document.createElement("a");
      a.href = url; a.download = "my-skaap-score.png";
      a.click(); URL.revokeObjectURL(url);
    }
    setShareModalOpen(false);
    if (shareImageUrl) { URL.revokeObjectURL(shareImageUrl); setShareImageUrl(null); }
    setShareState("shared");
    setTimeout(() => setShareState("idle"), 2000);
  }, [shareImageBlob, shareImageUrl]);

  const toggleTorch = async () => {
    const track = streamRef.current?.getVideoTracks()[0];
    if (!track) return;
    try {
      await track.applyConstraints({ advanced: [{ torch: !torchOn } as any] });
      setTorchOn(!torchOn);
    } catch {}
  };

  // ─── SCREEN: HOME ───
  if (screen === "home") {
    return (
      <div className="min-h-screen bg-background flex flex-col" style={{ maxWidth: 430, margin: "0 auto" }}>
        <div className="flex items-center justify-between px-5 pt-[env(safe-area-inset-top,12px)] h-14">
          <div className="flex items-center gap-2">
            <img src={skaapIcon} alt="Skaap" className="w-7 h-7 rounded-lg" width="28" height="28" />
            <span className="font-extrabold text-xl tracking-tight" style={{ color: "#1B2A4A" }}>Skaap</span>
          </div>
          <div className="flex items-center gap-2">
            {basket.length > 0 && (
              <motion.button whileTap={{ scale: 0.9 }} onClick={() => { setBasket(getBasket()); setScreen("basket"); }}
                className="w-10 h-10 rounded-full flex items-center justify-center relative" aria-label="Saved basket">
                <Heart size={22} style={{ color: "#E8314A" }} fill="#E8314A" />
                <span className="absolute -top-0.5 -right-0.5 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white" style={{ background: "#E8314A" }}>
                  {basket.length}
                </span>
              </motion.button>
            )}
            {history.length > 0 && (
              <motion.button whileTap={{ scale: 0.9 }} onClick={() => { setHistory(getHistory()); setScreen("history"); }}
                className="w-10 h-10 rounded-full flex items-center justify-center" aria-label="Scan history">
                <Clock size={22} style={{ color: "#1B2A4A" }} />
              </motion.button>
            )}
          </div>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center px-8 text-center" style={{ paddingBottom: 40 }}>
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="relative mb-8">
            <div className="w-28 h-28 rounded-3xl flex items-center justify-center" style={{ background: "#F7F7F7" }}>
              <motion.div animate={{ y: [0, -4, 0] }} transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}>
                <Barcode size={48} style={{ color: "#1B2A4A" }} />
              </motion.div>
              <motion.div animate={{ y: [-20, 20, -20] }} transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                className="absolute left-4 right-4 h-0.5 rounded-full" style={{ background: "#E8314A", opacity: 0.7 }} />
            </div>
          </motion.div>

          <h1 className="font-extrabold text-[28px] leading-tight tracking-tight mb-3" style={{ color: "#1B2A4A" }}>
            Know what's in<br />your food.
          </h1>
          <p className="text-base mb-10" style={{ color: "#6B7280" }}>Scan any barcode. Get the full picture instantly.</p>

          <motion.button whileTap={{ scale: 0.97 }} onClick={goToScan}
            className="w-full flex items-center justify-center gap-3 rounded-xl font-extrabold text-lg"
            style={{ background: "#E8314A", color: "#fff", height: 64, maxWidth: 400, borderRadius: 12 }}>
            <Barcode size={20} /> Scan a Product
          </motion.button>

          <div className="mt-6 flex items-center gap-2 text-sm" style={{ color: "#6B7280" }}>
            <span>or</span>
            <button onClick={() => {
              const code = prompt("Enter barcode number:");
              if (code?.trim()) handleBarcodeDetected(code.trim());
            }} className="font-semibold" style={{ color: "#E8314A" }}>Enter a barcode manually</button>
          </div>
        </div>

        <div className="flex items-center justify-center gap-2 pb-8">
          {[{ emoji: "🌿", label: "Nutri-Score" }, { emoji: "⚗️", label: "Additives" }, { emoji: "📋", label: "Ingredients" }].map(c => (
            <span key={c.label} className="text-xs font-semibold px-2.5 py-1.5 rounded-lg" style={{ background: "#F7F7F7", color: "#1B2A4A" }}>
              {c.emoji} {c.label}
            </span>
          ))}
        </div>
      </div>
    );
  }

  // ─── SCREEN: AI INFO ───
  if (screen === "ai-info") {
    return (
      <div className="min-h-screen bg-background" style={{ maxWidth: 430, margin: "0 auto" }}>
        <div className="flex items-center gap-3 px-5 pt-[env(safe-area-inset-top,12px)] h-14">
          <button onClick={() => setScreen("result")} aria-label="Back">
            <ArrowLeft size={20} style={{ color: "#1B2A4A" }} />
          </button>
          <h1 className="font-extrabold text-lg" style={{ color: "#1B2A4A" }}>How SKAAP uses AI</h1>
        </div>
        <div className="px-5 py-6 space-y-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Sparkles size={16} style={{ color: "#E8314A" }} />
              <h2 className="font-bold text-sm" style={{ color: "#1B2A4A" }}>Product Summaries</h2>
            </div>
            <p className="text-[13px] leading-relaxed" style={{ color: "#6B7280" }}>
              AI-generated summaries are created using Google Gemini based on Open Food Facts nutrition data. They provide a quick, plain-language overview of what the product is and what shoppers should know.
            </p>
          </div>
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Sparkles size={16} style={{ color: "#E8314A" }} />
              <h2 className="font-bold text-sm" style={{ color: "#1B2A4A" }}>Additive Explanations</h2>
            </div>
            <p className="text-[13px] leading-relaxed" style={{ color: "#6B7280" }}>
              When you tap an additive, AI generates a calm, factual explanation of what it is and its role in the product. Risk levels come from EFSA and IARC research data.
            </p>
          </div>
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Sparkles size={16} style={{ color: "#E8314A" }} />
              <h2 className="font-bold text-sm" style={{ color: "#1B2A4A" }}>Dietary Classifications</h2>
            </div>
            <p className="text-[13px] leading-relaxed" style={{ color: "#6B7280" }}>
              AI analyzes ingredient lists to classify products as Vegan, Vegetarian, Gluten-Free, etc. Hard safety overrides prevent incorrect labels — e.g., products with milk allergens will never be labeled Dairy-Free regardless of AI confidence.
            </p>
          </div>
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Sparkles size={16} style={{ color: "#E8314A" }} />
              <h2 className="font-bold text-sm" style={{ color: "#1B2A4A" }}>Smart Recommendations</h2>
            </div>
            <p className="text-[13px] leading-relaxed" style={{ color: "#6B7280" }}>
              AI suggests healthier alternatives based on the product's nutritional profile, additive count, and category. Recommendations prioritize widely available products with better Nutri-Scores.
            </p>
          </div>
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
      <div className="fixed inset-0 bg-black z-50">
        <video ref={videoRef} autoPlay playsInline muted className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between px-4" style={{ paddingTop: "calc(env(safe-area-inset-top, 12px) + 12px)" }}>
          <motion.button whileTap={{ scale: 0.9 }} onClick={() => { stopCamera(); setScreen("home"); }}
            className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: "rgba(0,0,0,0.4)" }} aria-label="Back">
            <ArrowLeft size={18} color="#fff" />
          </motion.button>
          <AnimatePresence>
            {hintVisible && (
              <motion.p initial={{ opacity: 0 }} animate={{ opacity: [1, 0.6, 1] }} exit={{ opacity: 0 }}
                transition={{ duration: 1.5, repeat: Infinity }} className="text-white text-sm font-semibold">
                Point at any barcode
              </motion.p>
            )}
          </AnimatePresence>
          {torchSupported ? (
            <motion.button whileTap={{ scale: 0.9 }} onClick={toggleTorch}
              className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: "rgba(0,0,0,0.4)" }} aria-label="Toggle flashlight">
              {torchOn ? <ZapOff size={18} color="#fff" /> : <Zap size={18} color="#fff" />}
            </motion.button>
          ) : <div className="w-9" />}
        </div>

        {/* Scan reticle */}
        <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none" style={{ paddingBottom: "10%" }}>
          <div className="relative" style={{ width: 260, height: 160 }}>
            {[
              { top: 0, left: 0, borderTop: "3px solid #fff", borderLeft: "3px solid #fff" },
              { top: 0, right: 0, borderTop: "3px solid #fff", borderRight: "3px solid #fff" },
              { bottom: 0, left: 0, borderBottom: "3px solid #fff", borderLeft: "3px solid #fff" },
              { bottom: 0, right: 0, borderBottom: "3px solid #fff", borderRight: "3px solid #fff" },
            ].map((style, i) => (
              <div key={i} className="absolute" style={{ ...style, width: 24, height: 24, borderRadius: 4 } as any} />
            ))}
            <motion.div animate={{ y: [0, 136, 0] }} transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
              className="absolute left-3 right-3" style={{ height: 2, background: "#E8314A", opacity: 0.8, borderRadius: 1, top: 12 }} />
          </div>
        </div>

        <AnimatePresence>
          {bottomHintVisible && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="absolute bottom-24 left-1/2 -translate-x-1/2 z-10 px-5 py-3 rounded-full"
              style={{ background: "rgba(0,0,0,0.3)", backdropFilter: "blur(12px)" }}>
              <p className="text-white text-xs font-normal text-center">Works on all barcodes — grocery, pharmacy, health foods</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  // ─── SCREEN: RESULT ───
  if (screen === "result") {
    const n = productInfo?.nutriments;
    const nl = productInfo?.nutrientLevels;
    const addCount = productInfo?.additivesTags?.length || 0;

    const getNutrientVerdict = (label: string, val: number | undefined, level?: string) => {
      if (level === "high") return label === "Protein" || label === "Fiber" ? "High amount" : `High ${label.toLowerCase()}`;
      if (level === "moderate") return `Some ${label.toLowerCase()}`;
      if (level === "low") return `Low ${label.toLowerCase()}`;
      if (val == null) return "—";
      return "";
    };

    const isPositiveNutrient = (label: string) => ["Protein", "Fiber"].includes(label);

    const nutrientRows = n ? [
      { label: "Calories", val: n.energyKcal100g, unit: "Cal", level: n.energyKcal100g != null ? (n.energyKcal100g > 300 ? "high" : n.energyKcal100g > 150 ? "moderate" : "low") : undefined, icon: "🔥" },
      { label: "Fat", val: n.fat100g, unit: "g", level: nl?.fat, icon: "💧" },
      { label: "Saturated fat", val: n.saturatedFat100g, unit: "g", level: nl?.saturatedFat, icon: "💧" },
      { label: "Sugars", val: n.sugars100g, unit: "g", level: nl?.sugars, icon: "🍬" },
      { label: "Salt", val: n.salt100g, unit: "g", level: nl?.salt, icon: "🧂" },
      { label: "Protein", val: n.protein100g, unit: "g", level: n.protein100g != null ? (n.protein100g > 10 ? "high" : n.protein100g > 5 ? "moderate" : "low") : undefined, icon: "🥩" },
      { label: "Fiber", val: n.fiber100g, unit: "g", level: n.fiber100g != null ? (n.fiber100g > 5 ? "high" : n.fiber100g > 2 ? "moderate" : "low") : undefined, icon: "🌾" },
      { label: "Carbohydrates", val: n.carbs100g, unit: "g", level: n.carbs100g != null ? (n.carbs100g > 50 ? "high" : n.carbs100g > 25 ? "moderate" : "low") : undefined, icon: "🍞" },
    ] : [];

    const negativeRows = nutrientRows.filter(r => !isPositiveNutrient(r.label));
    const positiveRows = nutrientRows.filter(r => isPositiveNutrient(r.label));

    const getNutrientDotColor = (label: string, level?: string) => {
      if (!level) return "#9CA3AF";
      if (isPositiveNutrient(label)) {
        return level === "high" ? "#2D7D46" : level === "moderate" ? "#2D7D46" : "#FF6D00";
      }
      return level === "high" ? "#E8314A" : level === "moderate" ? "#FF6D00" : "#2D7D46";
    };

    const sheetHeight = sheetExpanded ? "88vh" : "420px";

    const productName = productInfo?.productName || "";
    const displayName = productName.toUpperCase() === productName
      ? productName.replace(/\b\w+/g, w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
      : productName;
    const nameSize = displayName.length > 28 ? 13 : 15;

    return (
      <div className="fixed inset-0 bg-black/90 z-50 flex flex-col justify-end">
        {/* Score transparency modal */}
        <AnimatePresence>
          {showScoreModal && scoreBreakdown && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-[60] flex items-end justify-center" onClick={() => setShowScoreModal(false)}>
              <div className="absolute inset-0 bg-black/40" />
              <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
                transition={{ type: "spring", damping: 28, stiffness: 300 }}
                className="relative bg-background w-full rounded-t-[20px] z-10" style={{ maxHeight: "60vh" }}
                onClick={e => e.stopPropagation()}>
                <div className="flex justify-center pt-3"><div className="w-10 h-1 rounded-full" style={{ background: "#E5E7EB" }} /></div>
                <button onClick={() => setShowScoreModal(false)} className="absolute top-3 right-4" aria-label="Close">
                  <X size={24} style={{ color: "#1B2A4A" }} />
                </button>
                <div className="px-5 pb-6 pt-4 overflow-y-auto" style={{ maxHeight: "calc(60vh - 32px)" }}>
                  <h3 className="font-extrabold text-xl mb-5" style={{ color: "#1B2A4A" }}>How we scored this</h3>
                  <div className="py-4" style={{ borderBottom: "1px solid #F3F4F6" }}>
                    <div className="flex justify-between items-center">
                      <span className="font-semibold text-sm" style={{ color: "#1B2A4A" }}>Nutritional Quality</span>
                      <span className="font-semibold text-sm" style={{ color: nutriColors[scoreBreakdown.nutriScoreGrade?.toLowerCase() || ""]?.bg || "#6B7280" }}>
                        {scoreBreakdown.nutritionContribution} / 60 pts
                      </span>
                    </div>
                    <p className="text-xs mt-1" style={{ color: "#9CA3AF" }}>Based on Nutri-Score {scoreBreakdown.nutriScoreGrade?.toUpperCase() || "N/A"}</p>
                  </div>
                  <div className="py-4" style={{ borderBottom: "1px solid #F3F4F6" }}>
                    <div className="flex justify-between items-center">
                      <span className="font-semibold text-sm" style={{ color: "#1B2A4A" }}>Additives</span>
                      <span className="font-semibold text-sm" style={{ color: getAdditiveRiskColor(scoreBreakdown.worstAdditiveRisk) }}>
                        {scoreBreakdown.additiveContribution} / 30 pts
                      </span>
                    </div>
                    <p className="text-xs mt-1" style={{ color: "#9CA3AF" }}>{scoreBreakdown.additiveCount} additives · {scoreBreakdown.worstAdditiveRisk} risk</p>
                    {scoreBreakdown.hasHighRiskAdditive && (
                      <span className="inline-block mt-2 text-[11px] font-semibold px-2.5 py-1 rounded-md" style={{ background: "#FEF3C7", color: "#92400E" }}>
                        ⚠ Score capped at 49
                      </span>
                    )}
                  </div>
                  <div className="py-4" style={{ borderBottom: "1px solid #F3F4F6" }}>
                    <div className="flex justify-between items-center">
                      <span className="font-semibold text-sm" style={{ color: "#1B2A4A" }}>Organic</span>
                      <span className="font-semibold text-sm" style={{ color: scoreBreakdown.isOrganic ? "#2D7D46" : "#9CA3AF" }}>
                        {scoreBreakdown.organicContribution} / 10 pts
                      </span>
                    </div>
                    <p className="text-xs mt-1" style={{ color: "#9CA3AF" }}>
                      {scoreBreakdown.isOrganic ? "Organic certified" : "No organic certification"}
                    </p>
                  </div>
                  <p className="text-[11px] text-center mt-4" style={{ color: "#9CA3AF" }}>
                    Based on Nutri-Score, EFSA research, and IARC guidelines.
                  </p>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Compact bottom sheet */}
        <motion.div
          initial={{ y: "100%" }}
          animate={{ y: 0 }}
          transition={{ type: "spring", damping: 28, stiffness: 300 }}
          className="bg-background rounded-t-[20px] flex flex-col relative"
          style={{
            height: sheetHeight,
            maxHeight: "88vh",
            boxShadow: "0 -4px 32px rgba(0,0,0,0.12)",
            transition: "height 0.3s ease-out",
          }}
        >
          {/* Drag handle */}
          <button
            className="flex justify-center pt-[10px] pb-2 flex-shrink-0 cursor-grab active:cursor-grabbing w-full"
            onClick={() => setSheetExpanded(prev => !prev)}
            aria-label={sheetExpanded ? "Collapse sheet" : "Expand sheet"}
          >
            <div style={{ width: 36, height: 4, borderRadius: 2, background: "#E5E7EB" }} />
          </button>

          {/* Scrollable content area */}
          <div ref={sheetContentRef} className="flex-1 overflow-y-auto" style={{ overflowY: sheetExpanded ? "auto" : "hidden" }}>
            {/* ── SKELETON LOADER ── */}
            {loading && (
              <div className="px-5">
                {/* Product header skeleton */}
                <div className="flex items-center gap-3 mt-[14px]" style={{ height: 56 }}>
                  <Skeleton className="w-[44px] h-[44px] rounded-[10px] flex-shrink-0" />
                  <div className="flex-1 space-y-1.5">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                  <Skeleton className="w-[44px] h-[44px] rounded-full flex-shrink-0" />
                </div>
                {/* Divider */}
                <div className="mt-[14px]" style={{ height: 1, background: "#F3F4F6" }} />
                {/* Score row skeleton */}
                <div className="flex items-center gap-4 mt-3" style={{ height: 80 }}>
                  <Skeleton className="w-[72px] h-[72px] rounded-full flex-shrink-0" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-3 w-full" />
                    <Skeleton className="h-3 w-3/4" />
                  </div>
                </div>
                {/* Chips skeleton */}
                <div className="flex gap-2 mt-[10px]" style={{ height: 34 }}>
                  <Skeleton className="h-7 w-24 rounded-full" />
                  <Skeleton className="h-7 w-24 rounded-full" />
                  <Skeleton className="h-7 w-20 rounded-full" />
                </div>
                {/* Accordion rows skeleton */}
                {[1,2,3].map(i => (
                  <Skeleton key={i} className="h-[44px] w-full rounded-lg mt-1" />
                ))}
                {slowLoad && <p className="text-center text-sm mt-3" style={{ color: "#6B7280" }}>Taking longer than usual...</p>}
              </div>
            )}

            {/* ── NOT FOUND ── */}
            {notFound && !loading && (
              <div className="py-12 text-center px-5">
                <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: "#F7F7F7" }}>
                  <Barcode size={24} style={{ color: "#9CA3AF" }} />
                </div>
                <h3 className="font-semibold text-base" style={{ color: "#1B2A4A" }}>Product not found</h3>
                <p className="text-sm mt-2 max-w-[260px] mx-auto" style={{ color: "#6B7280" }}>This product may not be in our database yet.</p>
                <button onClick={() => {
                  const code = prompt("Enter barcode manually:");
                  if (code?.trim()) handleBarcodeDetected(code.trim());
                }} className="mt-4 px-5 py-2.5 rounded-xl text-sm font-semibold border" style={{ borderColor: "#E8314A", color: "#E8314A" }}>
                  Try Manual Search
                </button>
              </div>
            )}

            {/* ── PRODUCT RESULT ── */}
            {productInfo && !loading && (
              <>
                {/* PRODUCT HEADER ROW — 56px */}
                <div className="flex items-center gap-3 px-5" style={{ height: 56, marginTop: 14 }}>
                  {/* Product image 44x44 */}
                  <div className="flex-shrink-0 overflow-hidden" style={{ width: 44, height: 44, borderRadius: 10, background: "#F3F4F6" }}>
                    {productInfo.imageSmallUrl || productInfo.imageUrl ? (
                      <img
                        src={productInfo.imageSmallUrl || productInfo.imageUrl}
                        alt={productInfo.productName}
                        width={44} height={44}
                        className="w-full h-full object-cover"
                        loading="eager"
                        // @ts-ignore
                        fetchpriority="high"
                        onError={e => {
                          const t = e.target as HTMLImageElement;
                          t.style.display = "none";
                          t.parentElement!.innerHTML = '<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="7" y1="21" x2="17" y2="3"/></svg></div>';
                        }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Barcode size={16} style={{ color: "#9CA3AF" }} />
                      </div>
                    )}
                  </div>

                  {/* Name + brand */}
                  <div className="flex-1 min-w-0">
                    <p className="font-extrabold leading-tight truncate" style={{ fontSize: nameSize, color: "#1B2A4A" }}>
                      {displayName}
                    </p>
                    <p className="text-[12px] truncate" style={{ color: "#9CA3AF" }}>
                      {[productInfo.brand, productInfo.quantity].filter(Boolean).join(" · ")}
                    </p>
                  </div>

                  {/* Score badge 44px circle */}
                  {scoreBreakdown && (
                    <div
                      className="flex-shrink-0 flex items-center justify-center"
                      style={{
                        width: 44, height: 44, borderRadius: 22,
                        border: `3px solid ${getScoreColor(scoreBreakdown.total)}`,
                        background: "#fff",
                      }}
                    >
                      <span className="font-extrabold" style={{ fontSize: 18, color: getScoreColor(scoreBreakdown.total) }}>
                        {scoreBreakdown.total}
                      </span>
                    </div>
                  )}
                </div>

                {/* DIVIDER */}
                <div style={{ height: 1, background: "#F3F4F6", marginTop: 14 }} />

                {/* SKAAP SCORE ROW — 80px */}
                {scoreBreakdown && (
                  <div className="flex items-center gap-4 px-5" style={{ height: 80, marginTop: 12 }}>
                    {/* Score ring 72px — tappable */}
                    <button onClick={() => setShowScoreModal(true)} className="flex-shrink-0">
                      <ScoreRing score={scoreBreakdown.total} size={72} />
                    </button>

                    {/* Verdict + AI summary */}
                    <div className="flex-1 min-w-0">
                      <p className="font-extrabold" style={{ fontSize: 16, color: "#1B2A4A" }}>
                        {getScoreVerdict(scoreBreakdown.total)}
                      </p>
                      <div style={{ marginTop: 4 }}>
                        {aiSummaryLoading ? (
                          <div className="space-y-1">
                            <div className="h-3 rounded-full" style={{
                              background: "linear-gradient(90deg, #F3F4F6 25%, #E9EAEC 50%, #F3F4F6 75%)",
                              backgroundSize: "200% 100%",
                              animation: "shimmer 1.4s infinite",
                              width: "100%",
                            }} />
                            <div className="h-3 rounded-full" style={{
                              background: "linear-gradient(90deg, #F3F4F6 25%, #E9EAEC 50%, #F3F4F6 75%)",
                              backgroundSize: "200% 100%",
                              animation: "shimmer 1.4s infinite",
                              width: "75%",
                            }} />
                          </div>
                        ) : aiSummary ? (
                          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
                            <p className="text-[12px] leading-snug" style={{
                              color: "#6B7280",
                              display: "-webkit-box",
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: "vertical",
                              overflow: "hidden",
                            }}>{aiSummary}</p>
                            <p className="text-[10px] mt-0.5 flex items-center gap-1" style={{ color: "#9CA3AF" }}>
                              <Sparkles size={8} /> AI
                            </p>
                          </motion.div>
                        ) : (
                          <p className="text-[12px] leading-snug" style={{ color: "#6B7280" }}>
                            {getStaticSummary(scoreBreakdown, productInfo)}
                          </p>
                        )}
                      </div>
                      <p className="text-[10px] mt-1" style={{ color: "#9CA3AF" }}>Tap score for breakdown</p>
                    </div>
                  </div>
                )}

                {/* THREE SIGNAL CHIPS ROW — 34px */}
                <div className="flex gap-2 px-5 flex-nowrap overflow-x-auto" style={{ height: 34, marginTop: 10, scrollbarWidth: "none" }}>
                  {productInfo.nutriScoreGrade && (() => {
                    const nsColor = nutriColors[productInfo.nutriScoreGrade.toLowerCase()]?.bg || "#9CA3AF";
                    return (
                      <span className="inline-flex items-center gap-1.5 flex-shrink-0 font-semibold" style={{
                        height: 28, padding: "0 10px", borderRadius: 20, fontSize: 11,
                        background: `${nsColor}1F`, border: `1px solid ${nsColor}66`, color: "#1B2A4A",
                      }}>
                        <div className="rounded-full" style={{ width: 8, height: 8, background: nsColor }} />
                        Nutri-Score {productInfo.nutriScoreGrade.toUpperCase()}
                      </span>
                    );
                  })()}

                  {(() => {
                    const adColor = addCount === 0 ? "#2D7D46" : getAdditiveRiskColor(scoreBreakdown?.worstAdditiveRisk || "none");
                    const adBg = addCount === 0 ? "#D1FAE5" : adColor;
                    const adBorder = addCount === 0 ? "#6EE7B7" : adColor;
                    return (
                      <span className="inline-flex items-center gap-1.5 flex-shrink-0 font-semibold" style={{
                        height: 28, padding: "0 10px", borderRadius: 20, fontSize: 11,
                        background: `${adBg}1F`, border: `1px solid ${adBorder}66`, color: "#1B2A4A",
                      }}>
                        <div className="rounded-full" style={{ width: 8, height: 8, background: addCount === 0 ? "#2D7D46" : adColor }} />
                        {addCount === 0 ? "No additives" : `${addCount} additive${addCount > 1 ? "s" : ""}`}
                      </span>
                    );
                  })()}

                  {productInfo.novaGroup && novaColors[productInfo.novaGroup] && (
                    <span className="inline-flex items-center gap-1.5 flex-shrink-0 font-semibold" style={{
                      height: 28, padding: "0 10px", borderRadius: 20, fontSize: 11,
                      background: `${novaColors[productInfo.novaGroup].bg}1F`,
                      border: `1px solid ${novaColors[productInfo.novaGroup].bg}66`,
                      color: "#1B2A4A",
                    }}>
                      <div className="rounded-full" style={{ width: 8, height: 8, background: novaColors[productInfo.novaGroup].bg }} />
                      NOVA {productInfo.novaGroup}
                    </span>
                  )}
                </div>

                {/* DIETARY CHIPS ROW — 34px or hidden */}
                {dietaryTags && Object.keys(dietaryTags).length > 0 && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.2 }}
                    className="flex gap-2 px-5 flex-wrap"
                    style={{ height: 34, marginTop: 6 }}
                  >
                    {Object.keys(dietaryTags).map(key => (
                      <span key={key} className="inline-flex items-center font-semibold" style={{
                        height: 28, padding: "0 10px", borderRadius: 20, fontSize: 11,
                        background: "#F0FFF4", border: "1px solid #6EE7B7", color: "#065F46",
                      }}>
                        {DIETARY_LABELS[key] || key}
                      </span>
                    ))}
                  </motion.div>
                )}

                {/* SHARE PROMPT ROW — 44px */}
                {scoreBreakdown && (
                  <div className="flex items-center gap-[10px] px-5" style={{ height: 44, marginTop: 6 }}>
                    <p className="flex-1 font-semibold" style={{ fontSize: 13, color: "#1B2A4A" }}>
                      {scoreBreakdown.total >= 75 ? "You eat well 🌿 Show your friends."
                        : scoreBreakdown.total >= 50 ? "Not bad. Could be better. Share it."
                        : scoreBreakdown.total >= 25 ? "You might want to rethink this one 👀"
                        : "This one's rough. Share the warning."}
                    </p>
                    <motion.button
                      whileTap={{ scale: 0.95 }}
                      onClick={handleShareTap}
                      disabled={shareGenerating}
                      className="flex items-center gap-1.5 flex-shrink-0 font-semibold"
                      style={{
                        height: 32, padding: "0 14px", borderRadius: 20, fontSize: 12,
                        background: shareState === "shared" ? "#2D7D46" : "#E8314A",
                        color: "#fff", transition: "background 0.2s",
                      }}
                    >
                      <Share2 size={14} />
                      {shareState === "shared" ? "Shared ✓" : shareGenerating ? "..." : "Share Score"}
                    </motion.button>
                  </div>
                )}

                {/* THREE COLLAPSED ACCORDION ROWS — 44px each */}
                <div style={{ marginTop: 4 }}>
                  {/* Row 1: Nutrition */}
                  <div>
                    <button
                      onClick={() => toggleSection("nutrition")}
                      className="w-full flex items-center gap-3 px-5 text-left"
                      style={{ height: 44 }}
                    >
                      <span style={{ fontSize: 16, color: "#1B2A4A" }}>🍽</span>
                      <span className="flex-1 font-semibold" style={{ fontSize: 13, color: "#1B2A4A" }}>Nutrition</span>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {productInfo.nutriScoreGrade && (
                          <span className="font-bold text-white" style={{
                            fontSize: 10, padding: "2px 6px", borderRadius: 10,
                            background: nutriColors[productInfo.nutriScoreGrade.toLowerCase()]?.bg || "#9CA3AF",
                          }}>
                            {productInfo.nutriScoreGrade.toUpperCase()}
                          </span>
                        )}
                        <motion.div animate={{ rotate: expandedSections.has("nutrition") ? 90 : 0 }} transition={{ duration: 0.2 }}>
                          <ChevronDown size={14} style={{ color: "#9CA3AF", transform: "rotate(-90deg)" }} />
                        </motion.div>
                      </div>
                    </button>
                    {/* Expanded nutrition content */}
                    <div style={{
                      display: "grid",
                      gridTemplateRows: expandedSections.has("nutrition") ? "1fr" : "0fr",
                      transition: "grid-template-rows 220ms ease-out",
                    }}>
                      <div className="overflow-hidden" style={{ minHeight: 0 }}>
                        <div className="px-5 pb-3">
                          {negativeRows.length > 0 && (
                            <div className="mb-2">
                              <p className="text-[11px] font-bold mb-1" style={{ color: "#E8314A" }}>Negatives</p>
                              {negativeRows.map(row => (
                                <div key={row.label} className="flex items-center justify-between py-1.5" style={{ borderBottom: "1px solid #F9FAFB" }}>
                                  <div className="flex items-center gap-2">
                                    <span style={{ fontSize: 14 }}>{row.icon}</span>
                                    <span className="text-[12px] font-medium" style={{ color: "#1B2A4A" }}>{row.label}</span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <span className="text-[12px] font-semibold" style={{ color: "#1B2A4A" }}>
                                      {row.val != null ? `${Math.round(Number(row.val))}${row.unit}` : "—"}
                                    </span>
                                    <div className="rounded-full" style={{ width: 8, height: 8, background: getNutrientDotColor(row.label, row.level) }} />
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                          {positiveRows.length > 0 && (
                            <div>
                              <p className="text-[11px] font-bold mb-1" style={{ color: "#2D7D46" }}>Positives</p>
                              {positiveRows.map(row => (
                                <div key={row.label} className="flex items-center justify-between py-1.5" style={{ borderBottom: "1px solid #F9FAFB" }}>
                                  <div className="flex items-center gap-2">
                                    <span style={{ fontSize: 14 }}>{row.icon}</span>
                                    <span className="text-[12px] font-medium" style={{ color: "#1B2A4A" }}>{row.label}</span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <span className="text-[12px] font-semibold" style={{ color: "#1B2A4A" }}>
                                      {row.val != null ? `${Math.round(Number(row.val))}${row.unit}` : "—"}
                                    </span>
                                    <div className="rounded-full" style={{ width: 8, height: 8, background: getNutrientDotColor(row.label, row.level) }} />
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Row 2: Additives */}
                  <div>
                    <button
                      onClick={() => toggleSection("additives")}
                      className="w-full flex items-center gap-3 px-5 text-left"
                      style={{ height: 44 }}
                    >
                      <span style={{ fontSize: 16, color: "#1B2A4A" }}>⚗️</span>
                      <span className="flex-1 font-semibold" style={{ fontSize: 13, color: "#1B2A4A" }}>Additives</span>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {addCount === 0 ? (
                          <Check size={14} style={{ color: "#2D7D46" }} />
                        ) : (
                          <span className="font-bold text-white" style={{
                            fontSize: 10, padding: "2px 6px", borderRadius: 10,
                            background: getAdditiveRiskColor(scoreBreakdown?.worstAdditiveRisk || "none"),
                          }}>
                            {addCount}
                          </span>
                        )}
                        <motion.div animate={{ rotate: expandedSections.has("additives") ? 90 : 0 }} transition={{ duration: 0.2 }}>
                          <ChevronDown size={14} style={{ color: "#9CA3AF", transform: "rotate(-90deg)" }} />
                        </motion.div>
                      </div>
                    </button>
                    {/* Expanded additives content */}
                    <div style={{
                      display: "grid",
                      gridTemplateRows: expandedSections.has("additives") ? "1fr" : "0fr",
                      transition: "grid-template-rows 220ms ease-out",
                    }}>
                      <div className="overflow-hidden" style={{ minHeight: 0 }}>
                        <div className="px-5 pb-3" style={{ background: "#FAFAFA" }}>
                          {productInfo.additivesTags && productInfo.additivesTags.length > 0 ? (
                            productInfo.additivesTags.map((a, i) => {
                              const code = a.replace(/^en:/, "").replace(/-.*$/, "").toUpperCase();
                              const risk = getAdditiveRisk(a);
                              const riskColor = getAdditiveRiskColor(risk);
                              const riskLabel = getAdditiveRiskLabel(risk);
                              const desc = getAdditiveDescription(a);
                              const isExp = expandedAdditive === a;
                              return (
                                <div key={a} style={{ borderBottom: i < productInfo.additivesTags!.length - 1 ? "1px solid #F3F4F6" : "none" }}>
                                  <button onClick={() => handleAdditiveExpand(a, productInfo.productName)} className="w-full py-2 text-left">
                                    <div className="flex items-center justify-between">
                                      <span className="font-bold text-[12px]" style={{ color: "#1B2A4A" }}>{code} · <span className="font-normal">{formatTag(a)}</span></span>
                                      <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded text-white flex-shrink-0 ml-2" style={{ background: riskColor }}>{riskLabel}</span>
                                    </div>
                                    <p className="text-[10px] mt-0.5" style={{ color: "#6B7280" }}>{desc}</p>
                                  </button>
                                  <div style={{ display: "grid", gridTemplateRows: isExp ? "1fr" : "0fr", transition: "grid-template-rows 220ms ease-out" }}>
                                    <div className="overflow-hidden" style={{ minHeight: 0 }}>
                                      <div className="pb-2 pl-1">
                                        {additiveExplanationLoading && isExp ? (
                                          <div className="space-y-1">
                                            <Skeleton className="h-3 w-full rounded" />
                                            <Skeleton className="h-3 w-4/5 rounded" />
                                          </div>
                                        ) : additiveExplanation && isExp ? (
                                          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                                            <p className="text-[11px] leading-relaxed" style={{ color: "#4B5563" }}>{additiveExplanation}</p>
                                            <p className="text-[9px] mt-1 flex items-center gap-1" style={{ color: "#9CA3AF" }}>
                                              <Sparkles size={8} /> AI
                                            </p>
                                          </motion.div>
                                        ) : null}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              );
                            })
                          ) : (
                            <div className="text-center py-3">
                              <Check size={16} style={{ color: "#2D7D46", margin: "0 auto" }} />
                              <p className="font-semibold text-[12px] mt-1" style={{ color: "#2D7D46" }}>No additives detected</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Row 3: Ingredients & Alternatives */}
                  <div>
                    <button
                      onClick={() => toggleSection("more")}
                      className="w-full flex items-center gap-3 px-5 text-left"
                      style={{ height: 44 }}
                    >
                      <span style={{ fontSize: 16, color: "#1B2A4A" }}>•••</span>
                      <span className="flex-1 font-semibold" style={{ fontSize: 13, color: "#1B2A4A" }}>Ingredients & Alternatives</span>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {productInfo.ingredientsText && (
                          <span className="text-[11px]" style={{ color: "#9CA3AF" }}>
                            {productInfo.ingredientsText.split(",").length} ingredients
                          </span>
                        )}
                        <motion.div animate={{ rotate: expandedSections.has("more") ? 90 : 0 }} transition={{ duration: 0.2 }}>
                          <ChevronDown size={14} style={{ color: "#9CA3AF", transform: "rotate(-90deg)" }} />
                        </motion.div>
                      </div>
                    </button>
                    {/* Expanded: ingredients + certifications + recommendations */}
                    <div style={{
                      display: "grid",
                      gridTemplateRows: expandedSections.has("more") ? "1fr" : "0fr",
                      transition: "grid-template-rows 220ms ease-out",
                    }}>
                      <div className="overflow-hidden" style={{ minHeight: 0 }}>
                        <div className="px-5 pb-4">
                          {/* Ingredients */}
                          {productInfo.ingredientsText && (
                            <div className="mb-4">
                              <p className="text-[11px] font-bold mb-1.5" style={{ color: "#1B2A4A" }}>Ingredients</p>
                              <p className="text-[12px] leading-relaxed" style={{ color: "#6B7280" }}>
                                {productInfo.allergensTags?.length
                                  ? highlightAllergens(productInfo.ingredientsText, productInfo.allergensTags)
                                  : productInfo.ingredientsText}
                              </p>
                              {productInfo.allergensTags && productInfo.allergensTags.length > 0 && (
                                <div className="mt-2 flex flex-wrap gap-1">
                                  <span className="text-[10px] font-semibold" style={{ color: "#1B2A4A" }}>Allergens:</span>
                                  {productInfo.allergensTags.map(a => (
                                    <span key={a} className="text-[10px] font-bold px-1.5 py-0.5 rounded-full" style={{ background: "rgba(232,49,74,0.1)", color: "#E8314A" }}>
                                      {formatTag(a)}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                          )}

                          {/* Certifications */}
                          {productInfo.labelsTags && productInfo.labelsTags.length > 0 && (
                            <div className="mb-4">
                              <p className="text-[11px] font-bold mb-1.5" style={{ color: "#1B2A4A" }}>Certifications</p>
                              <div className="flex flex-wrap gap-1">
                                {productInfo.labelsTags.map(l => (
                                  <span key={l} className="text-[10px] font-semibold px-2 py-0.5 rounded border" style={{ borderColor: "#1B2A4A", color: "#1B2A4A" }}>
                                    {formatTag(l)}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* AI Recommendations */}
                          <div>
                            <div className="flex items-center gap-1.5 mb-2">
                              <p className="text-[11px] font-bold" style={{ color: "#1B2A4A" }}>Healthier Alternatives</p>
                              <Sparkles size={10} style={{ color: "#9CA3AF" }} />
                            </div>
                            {aiRecsLoading ? (
                              <div className="space-y-2">
                                {[1,2].map(i => (
                                  <div key={i} className="flex gap-2 p-2 rounded-xl" style={{ background: "#F9FAFB" }}>
                                    <Skeleton className="w-12 h-12 rounded-lg flex-shrink-0" />
                                    <div className="flex-1 space-y-1.5 py-0.5">
                                      <Skeleton className="h-3 w-3/4" />
                                      <Skeleton className="h-3 w-full" />
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ) : aiRecommendations && aiRecommendations.length > 0 ? (
                              <div className="space-y-2">
                                {aiRecommendations.map((rec, i) => {
                                  const scoreColor = nutriColors[rec.estimatedScore?.toLowerCase()]?.bg || "#2D7D46";
                                  return (
                                    <motion.div key={i} initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }}
                                      transition={{ delay: i * 0.1, duration: 0.25 }}
                                      className="flex gap-2 p-2 rounded-xl items-center" style={{ background: "#F9FAFB", border: "1px solid #F3F4F6" }}>
                                      <div className="flex-shrink-0 flex items-center justify-center" style={{
                                        width: 40, height: 40, borderRadius: 20,
                                        border: `2px solid ${scoreColor}`,
                                      }}>
                                        <span className="font-extrabold" style={{ fontSize: 14, color: scoreColor }}>
                                          {rec.estimatedScore?.toUpperCase() || "A"}
                                        </span>
                                      </div>
                                      <div className="flex-1 min-w-0">
                                        <p className="font-bold text-[12px] leading-tight truncate" style={{ color: "#1B2A4A" }}>{rec.name}</p>
                                        <p className="text-[10px] leading-snug truncate" style={{ color: "#6B7280" }}>{rec.reason}</p>
                                      </div>
                                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded flex-shrink-0" style={{ background: `${scoreColor}1A`, color: scoreColor }}>Better</span>
                                    </motion.div>
                                  );
                                })}
                              </div>
                            ) : (
                              <p className="text-[11px]" style={{ color: "#9CA3AF" }}>No recommendations available.</p>
                            )}
                          </div>

                          {/* AI info link */}
                          <button onClick={() => setScreen("ai-info")} className="mt-3 text-[10px] flex items-center gap-1 mx-auto" style={{ color: "#9CA3AF" }}>
                            <Sparkles size={9} /> How SKAAP uses AI
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* FIXED BOTTOM ACTION ROW — 64px */}
          <div
            className="flex-shrink-0 flex items-center gap-3 px-5"
            style={{
              height: 64,
              borderTop: "1px solid #F3F4F6",
              background: "#fff",
              paddingBottom: "env(safe-area-inset-bottom, 0px)",
            }}
          >
            <motion.button whileTap={{ scale: 0.97 }} onClick={scanAnother}
              className="flex-1 font-semibold flex items-center justify-center"
              style={{
                border: "1.5px solid #E8314A", color: "#E8314A", background: "#fff",
                height: 40, borderRadius: 10, fontSize: 13,
              }}>
              Scan Again
            </motion.button>
            <motion.button whileTap={{ scale: 0.97 }} onClick={handleSave}
              className="flex-1 font-semibold flex items-center justify-center gap-1.5"
              style={{
                background: savedState === "saved" ? "#fff" : isInBasket(currentBarcode) ? "#fff" : "#E8314A",
                color: savedState === "saved" ? "#2D7D46" : isInBasket(currentBarcode) ? "#E8314A" : "#fff",
                border: savedState === "saved" ? "1.5px solid #2D7D46" : isInBasket(currentBarcode) ? "1.5px solid #E8314A" : "1.5px solid #E8314A",
                height: 40, borderRadius: 10, fontSize: 13,
              }}>
              {savedState === "saved" ? (
                <>Saved ✓</>
              ) : isInBasket(currentBarcode) ? (
                <><Heart size={14} fill="#E8314A" /> Saved</>
              ) : (
                <><Heart size={14} /> Save</>
              )}
            </motion.button>
          </div>
        </motion.div>
      </div>
    );
  }

  // ─── SCREEN: HISTORY ───
  if (screen === "history") {

    const filteredHistory = history.filter(item => {
      const matchesSearch = !historySearch || 
        item.name.toLowerCase().includes(historySearch.toLowerCase()) ||
        (item.brand && item.brand.toLowerCase().includes(historySearch.toLowerCase()));
      
      let matchesScore = true;
      if (scoreFilter === "excellent" && (item.skaapScore == null || item.skaapScore < 75)) matchesScore = false;
      if (scoreFilter === "good" && (item.skaapScore == null || item.skaapScore < 50 || item.skaapScore >= 75)) matchesScore = false;
      if (scoreFilter === "poor" && (item.skaapScore == null || item.skaapScore >= 50)) matchesScore = false;
      
      return matchesSearch && matchesScore;
    });

    return (
      <div className="min-h-screen bg-background" style={{ maxWidth: 430, margin: "0 auto" }}>
        <div className="flex items-center justify-between px-5 pt-[env(safe-area-inset-top,12px)] h-14">
          <button onClick={() => setScreen("home")} className="flex items-center">
            <ArrowLeft size={20} style={{ color: "#1B2A4A" }} />
          </button>
          <h1 className="font-extrabold text-[20px] tracking-tight" style={{ color: "#1B2A4A" }}>Your Scans</h1>
          <button onClick={() => { clearHistory(); setHistory([]); }} className="text-[12px] font-semibold" style={{ color: "#E8314A" }}>Clear</button>
        </div>

        {/* Search bar */}
        <div className="px-5 pt-2 pb-1">
          <div className="flex items-center gap-2 px-3 h-10 rounded-xl" style={{ background: "#F5F5F5" }}>
            <Search size={16} style={{ color: "#9CA3AF" }} />
            <input
              type="text"
              placeholder="Search products..."
              value={historySearch}
              onChange={(e) => setHistorySearch(e.target.value)}
              className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
              style={{ color: "#1B2A4A" }}
            />
            {historySearch && (
              <button onClick={() => setHistorySearch("")}><X size={14} style={{ color: "#9CA3AF" }} /></button>
            )}
          </div>
        </div>

        {/* Score filter chips */}
        <div className="px-5 py-2 flex gap-2">
          {[
            { key: "all", label: "All" },
            { key: "excellent", label: "75+" },
            { key: "good", label: "50-74" },
            { key: "poor", label: "< 50" },
          ].map(f => (
            <button key={f.key} onClick={() => setScoreFilter(f.key)}
              className="px-3 py-1.5 rounded-full text-[12px] font-semibold transition-colors"
              style={{
                background: scoreFilter === f.key ? "#1B2A4A" : "#F5F5F5",
                color: scoreFilter === f.key ? "#fff" : "#6B7280",
              }}>
              {f.label}
            </button>
          ))}
        </div>

        <div className="px-5 pt-1 pb-24">
          {filteredHistory.length === 0 ? (
            <div className="text-center py-12">
              <Search size={32} style={{ color: "#E5E7EB", margin: "0 auto" }} />
              <p className="text-sm mt-3" style={{ color: "#6B7280" }}>
                {history.length === 0 ? "No scans yet" : "No products match your search"}
              </p>
            </div>
          ) : (
            <div className="divide-y" style={{ borderColor: "#F3F4F6" }}>
              {filteredHistory.map(item => (
                <button key={item.barcode + item.scannedAt} onClick={() => handleBarcodeDetected(item.barcode)}
                  className="w-full flex items-center gap-3 py-3 text-left">
                  <div className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0" style={{ background: "#F7F7F7" }}>
                    {item.image ? (
                      <img src={item.image} alt={item.name} className="w-full h-full object-contain p-0.5" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center"><Barcode size={16} style={{ color: "#9CA3AF" }} /></div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate" style={{ color: "#1B2A4A" }}>{item.name}</p>
                    {item.brand && <p className="text-[11px] truncate" style={{ color: "#6B7280" }}>{item.brand}</p>}
                  </div>
                  <div className="flex flex-col items-end gap-1 flex-shrink-0">
                    {item.skaapScore != null ? (
                      <span className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-extrabold text-white"
                        style={{ background: getScoreColor(item.skaapScore) }}>
                        {item.skaapScore}
                      </span>
                    ) : item.nutriScore ? (
                      <span className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-extrabold"
                        style={{ background: nutriColors[item.nutriScore.toLowerCase()]?.bg || "#E5E7EB", color: nutriColors[item.nutriScore.toLowerCase()]?.text || "#1B2A4A" }}>
                        {item.nutriScore.toUpperCase()}
                      </span>
                    ) : null}
                    <span className="text-[11px]" style={{ color: "#9CA3AF" }}>
                      {new Date(item.scannedAt).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                    </span>
                  </div>
                </button>
              ))}
            </div>
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

export default SkaapScan;
