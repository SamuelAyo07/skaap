import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, Zap, ZapOff, Barcode, Clock, ChevronDown, Leaf, X, Check,
} from "lucide-react";
import { fetchProductInfo, ProductFullInfo } from "@/lib/productInfoApi";
import { Skeleton } from "@/components/ui/skeleton";
import skaapIcon from "@/assets/skaap-icon.png";
import {
  calculateSkaapScore, getScoreColor, getScoreVerdict,
  getAdditiveRisk, getAdditiveRiskColor, getAdditiveRiskLabel,
  getAdditiveDescription, SkaapScoreBreakdown,
} from "@/lib/skaapScore";

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

type Screen = "home" | "scanning" | "result" | "history";

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
function ScoreRing({ score, size = 120 }: { score: number; size?: number }) {
  const color = getScoreColor(score);
  const r = (size - 12) / 2;
  const circumference = 2 * Math.PI * r;
  const offset = circumference - (score / 100) * circumference;
  const reducedMotion = typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#F3F4F6" strokeWidth="6" />
        <circle
          cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={reducedMotion ? offset : circumference}
          style={reducedMotion ? {} : {
            transition: "stroke-dashoffset 0.6s ease-out 0.3s",
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
        <span className="font-extrabold leading-none" style={{ fontSize: 40, color }}>{score}</span>
        <span className="font-semibold text-[10px] uppercase tracking-wider mt-1" style={{ color: "#9CA3AF" }}>SKAAP SCORE</span>
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

  // History
  const [history, setHistory] = useState<ScanHistoryItem[]>(getHistory());

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
    } else {
      setNotFound(true);
    }
    setLoading(false);
  }, [stopCamera]);

  const toggleSection = (key: string) => {
    setExpandedSections(prev => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  };

  const scanAnother = () => {
    setProductInfo(null);
    setNotFound(false);
    setScanDetected(false);
    setHintVisible(true);
    setBottomHintVisible(true);
    setScoreBreakdown(null);
    setShowScoreModal(false);
    setSavedState("idle");
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
      addToHistory({
        barcode: currentBarcode, name: productInfo.productName, brand: productInfo.brand,
        image: productInfo.imageUrl, nutriScore: productInfo.nutriScoreGrade,
        skaapScore: scoreBreakdown?.total, scannedAt: Date.now(),
      });
      setHistory(getHistory());
      setSavedState("saved");
      setTimeout(() => setSavedState("idle"), 1500);
    }
  };

  useEffect(() => {
    return () => stopCamera();
  }, [stopCamera]);

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
          {history.length > 0 && (
            <motion.button whileTap={{ scale: 0.9 }} onClick={() => { setHistory(getHistory()); setScreen("history"); }}
              className="w-10 h-10 rounded-full flex items-center justify-center" aria-label="Scan history">
              <Clock size={22} style={{ color: "#1B2A4A" }} />
            </motion.button>
          )}
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
                {/* Handle */}
                <div className="flex justify-center pt-3"><div className="w-10 h-1 rounded-full" style={{ background: "#E5E7EB" }} /></div>
                <button onClick={() => setShowScoreModal(false)} className="absolute top-3 right-4" aria-label="Close">
                  <X size={24} style={{ color: "#1B2A4A" }} />
                </button>

                <div className="px-5 pb-6 pt-4 overflow-y-auto" style={{ maxHeight: "calc(60vh - 32px)" }}>
                  <h3 className="font-extrabold text-xl mb-5" style={{ color: "#1B2A4A" }}>How we scored this</h3>

                  {/* Nutrition */}
                  <div className="py-4" style={{ borderBottom: "1px solid #F3F4F6" }}>
                    <div className="flex justify-between items-center">
                      <span className="font-semibold text-sm" style={{ color: "#1B2A4A" }}>Nutritional Quality</span>
                      <span className="font-semibold text-sm" style={{ color: nutriColors[scoreBreakdown.nutriScoreGrade?.toLowerCase() || ""]?.bg || "#6B7280" }}>
                        {scoreBreakdown.nutritionContribution} / 60 pts
                      </span>
                    </div>
                    <p className="text-xs mt-1" style={{ color: "#9CA3AF" }}>
                      Based on Nutri-Score {scoreBreakdown.nutriScoreGrade?.toUpperCase() || "N/A"} · Sugar, fat, fiber, protein, calories
                    </p>
                  </div>

                  {/* Additives */}
                  <div className="py-4" style={{ borderBottom: "1px solid #F3F4F6" }}>
                    <div className="flex justify-between items-center">
                      <span className="font-semibold text-sm" style={{ color: "#1B2A4A" }}>Additives</span>
                      <span className="font-semibold text-sm" style={{ color: getAdditiveRiskColor(scoreBreakdown.worstAdditiveRisk) }}>
                        {scoreBreakdown.additiveContribution} / 30 pts
                      </span>
                    </div>
                    <p className="text-xs mt-1" style={{ color: "#9CA3AF" }}>
                      {scoreBreakdown.additiveCount} additives found · {scoreBreakdown.worstAdditiveRisk} risk detected
                    </p>
                    {scoreBreakdown.hasHighRiskAdditive && (
                      <span className="inline-block mt-2 text-[11px] font-semibold px-2.5 py-1 rounded-md" style={{ background: "#FEF3C7", color: "#92400E" }}>
                        ⚠ Score capped at 49 due to high-risk additive
                      </span>
                    )}
                  </div>

                  {/* Organic */}
                  <div className="py-4" style={{ borderBottom: "1px solid #F3F4F6" }}>
                    <div className="flex justify-between items-center">
                      <span className="font-semibold text-sm" style={{ color: "#1B2A4A" }}>Organic</span>
                      <span className="font-semibold text-sm" style={{ color: scoreBreakdown.isOrganic ? "#2D7D46" : "#9CA3AF" }}>
                        {scoreBreakdown.organicContribution} / 10 pts
                      </span>
                    </div>
                    <p className="text-xs mt-1" style={{ color: "#9CA3AF" }}>
                      {scoreBreakdown.isOrganic ? "Organic certification reduces pesticide exposure" : "No organic certification found"}
                    </p>
                  </div>

                  <p className="text-[11px] text-center mt-4" style={{ color: "#9CA3AF" }}>
                    Scoring methodology based on Nutri-Score, EFSA additive research, and IARC guidelines. Data from Open Food Facts.
                  </p>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Bottom sheet */}
        <motion.div initial={{ y: "100%" }} animate={{ y: 0 }}
          transition={{ type: "spring", damping: 28, stiffness: 300 }}
          className="bg-background rounded-t-[20px] overflow-hidden flex flex-col" style={{ maxHeight: "75vh" }}>
          <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
            <div className="w-10 h-1 rounded-full" style={{ background: "#E5E7EB" }} />
          </div>

          <div className="flex-1 overflow-y-auto px-5 pb-2">
            {/* Loading skeleton */}
            {loading && (
              <div className="space-y-4 py-4">
                <div className="flex gap-3 items-center">
                  <Skeleton className="w-12 h-12 rounded-xl flex-shrink-0" />
                  <div className="flex-1 space-y-1.5">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                </div>
                <div className="flex justify-center"><Skeleton className="w-[120px] h-[120px] rounded-full" /></div>
                <div className="flex gap-3">
                  <Skeleton className="h-[72px] flex-1 rounded-xl" />
                  <Skeleton className="h-[72px] flex-1 rounded-xl" />
                </div>
                {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-12 w-full rounded-xl" />)}
                {slowLoad && <p className="text-center text-sm" style={{ color: "#6B7280" }}>Taking longer than usual...</p>}
              </div>
            )}

            {/* Not found */}
            {notFound && !loading && (
              <div className="py-12 text-center">
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

            {/* Product result */}
            {productInfo && !loading && (
              <div className="space-y-4 pt-2">
                {/* Compact product header — 48px image */}
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-[10px] overflow-hidden flex-shrink-0 border" style={{ borderColor: "#E5E7EB", background: "#F7F7F7" }}>
                    {productInfo.imageUrl ? (
                      <img src={productInfo.imageUrl} alt={productInfo.productName} className="w-full h-full object-contain p-0.5"
                        width="48" height="48" onError={e => { (e.target as HTMLImageElement).src = "/placeholder.svg"; }} />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center"><Barcode size={20} style={{ color: "#9CA3AF" }} /></div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-extrabold text-base leading-snug truncate" style={{ color: "#1B2A4A" }}>{productInfo.productName}</h3>
                    <p className="text-xs truncate" style={{ color: "#9CA3AF" }}>
                      {[productInfo.brand, productInfo.quantity].filter(Boolean).join(" · ")}
                    </p>
                  </div>
                </div>

                {/* SKAAP Score hero */}
                {scoreBreakdown && (
                  <div className="flex flex-col items-center py-2">
                    <button onClick={() => setShowScoreModal(true)}
                      aria-label={`SKAAP Score: ${scoreBreakdown.total} out of 100, ${getScoreVerdict(scoreBreakdown.total)}`}>
                      <ScoreRing score={scoreBreakdown.total} />
                    </button>
                    <p className="font-semibold text-[15px] mt-3" style={{ color: getScoreColor(scoreBreakdown.total) }}>
                      {getScoreVerdict(scoreBreakdown.total)}
                    </p>
                  </div>
                )}

                {/* Nutri-Score + NOVA badges (compact 72px) */}
                <div className="flex gap-3">
                  <div className="flex-1 rounded-xl flex flex-col items-center justify-center" style={{
                    background: productInfo.nutriScoreGrade ? nutriColors[productInfo.nutriScoreGrade.toLowerCase()]?.bg || "#E5E7EB" : "#E5E7EB",
                    color: productInfo.nutriScoreGrade ? nutriColors[productInfo.nutriScoreGrade.toLowerCase()]?.text || "#1B2A4A" : "#9CA3AF",
                    height: 72,
                  }}>
                    <span className="text-[9px] font-semibold uppercase tracking-wider opacity-80">NUTRI-SCORE</span>
                    <span className="text-4xl font-extrabold leading-none">{productInfo.nutriScoreGrade?.toUpperCase() || "—"}</span>
                  </div>
                  <div className="flex-1 rounded-xl flex flex-col items-center justify-center" style={{
                    background: productInfo.novaGroup ? novaColors[productInfo.novaGroup]?.bg || "#E5E7EB" : "#E5E7EB",
                    color: productInfo.novaGroup ? novaColors[productInfo.novaGroup]?.text || "#1B2A4A" : "#9CA3AF",
                    height: 72,
                  }}>
                    <span className="text-[9px] font-semibold uppercase tracking-wider opacity-80">NOVA GROUP</span>
                    <span className="text-4xl font-extrabold leading-none">{productInfo.novaGroup || "—"}</span>
                    {productInfo.novaGroup && <span className="text-[9px] font-normal opacity-80">{novaColors[productInfo.novaGroup]?.label}</span>}
                  </div>
                </div>

                {/* Score breakdown chips */}
                {scoreBreakdown && (
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full flex items-center gap-1.5" style={{ background: "#F7F7F7", color: "#1B2A4A" }}>
                      <span className="w-1.5 h-1.5 rounded-full" style={{ background: nutriColors[scoreBreakdown.nutriScoreGrade?.toLowerCase() || ""]?.bg || "#9CA3AF" }} />
                      Nutrition · {scoreBreakdown.nutriScoreGrade?.toUpperCase() || "—"}
                    </span>
                    <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full flex items-center gap-1.5" style={{ background: "#F7F7F7", color: "#1B2A4A" }}>
                      <span className="w-1.5 h-1.5 rounded-full" style={{ background: getAdditiveRiskColor(scoreBreakdown.worstAdditiveRisk) }} />
                      {scoreBreakdown.additiveCount} additives
                    </span>
                    <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full" style={{
                      background: "#F7F7F7", color: scoreBreakdown.isOrganic ? "#2D7D46" : "#9CA3AF",
                    }}>
                      {scoreBreakdown.isOrganic ? "Organic ✓" : "Non-organic"}
                    </span>
                  </div>
                )}

                {/* Divider */}
                <div style={{ borderTop: "1px solid #F3F4F6" }} />

                {/* Nutrition */}
                {n && (
                  <AccordionSection title="Nutrition Facts" isOpen={expandedSections.has("nutrition")} onToggle={() => toggleSection("nutrition")}
                    indicator={<div className="w-2 h-2 rounded-full" style={{ background: nl?.fat === "high" || nl?.sugars === "high" || nl?.salt === "high" ? "#E8314A" : nl?.fat === "moderate" || nl?.sugars === "moderate" ? "#FFC107" : "#2D7D46" }} />}>
                    <div className="space-y-2.5">
                      {[
                        { label: "Calories", val: n.energyKcal100g, unit: "kcal", level: undefined, max: 800 },
                        { label: "Fat", val: n.fat100g, unit: "g", level: nl?.fat, max: 100 },
                        { label: "Saturated Fat", val: n.saturatedFat100g, unit: "g", level: nl?.saturatedFat, max: 40 },
                        { label: "Carbohydrates", val: n.carbs100g, unit: "g", level: undefined, max: 100 },
                        { label: "Sugars", val: n.sugars100g, unit: "g", level: nl?.sugars, max: 100 },
                        { label: "Fiber", val: n.fiber100g, unit: "g", level: undefined, max: 30 },
                        { label: "Protein", val: n.protein100g, unit: "g", level: undefined, max: 50 },
                        { label: "Salt", val: n.salt100g, unit: "g", level: nl?.salt, max: 6 },
                      ].map(row => {
                        const pct = row.val != null ? Math.min((Number(row.val) / row.max) * 100, 100) : 0;
                        return (
                          <div key={row.label}>
                            <div className="flex justify-between text-sm mb-0.5">
                              <span style={{ color: "#6B7280" }}>{row.label}</span>
                              <span className="font-semibold" style={{ color: "#1B2A4A" }}>{row.val != null ? `${Number(row.val).toFixed(1)} ${row.unit}` : "—"}</span>
                            </div>
                            <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "#F3F4F6" }}>
                              <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ delay: 0.2, duration: 0.5 }}
                                className="h-full rounded-full" style={{ background: row.level ? nutrientLevelColor(row.level) : "rgba(27,42,74,0.2)" }} />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </AccordionSection>
                )}

                {/* Ingredients */}
                {productInfo.ingredientsText && (
                  <AccordionSection title="Ingredients" isOpen={expandedSections.has("ingredients")} onToggle={() => toggleSection("ingredients")}
                    indicator={<span className="text-[11px] font-semibold px-2 py-0.5 rounded-full" style={{ background: "#1B2A4A", color: "#fff" }}>
                      {productInfo.ingredientsText.split(",").length}
                    </span>}>
                    <p className="text-[13px] leading-relaxed" style={{ color: "#6B7280" }}>
                      {productInfo.allergensTags?.length
                        ? highlightAllergens(productInfo.ingredientsText, productInfo.allergensTags)
                        : productInfo.ingredientsText}
                    </p>
                    {productInfo.allergensTags && productInfo.allergensTags.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        <span className="text-[11px] font-semibold" style={{ color: "#1B2A4A" }}>Allergens:</span>
                        {productInfo.allergensTags.map(a => (
                          <span key={a} className="text-[11px] font-bold px-2 py-0.5 rounded-full" style={{ background: "rgba(232,49,74,0.1)", color: "#E8314A" }}>
                            {formatTag(a)}
                          </span>
                        ))}
                      </div>
                    )}
                  </AccordionSection>
                )}

                {/* Additives — upgraded with descriptions */}
                <AccordionSection title="Additives" isOpen={expandedSections.has("additives")} onToggle={() => toggleSection("additives")}
                  indicator={
                    productInfo.additivesTags && productInfo.additivesTags.length > 0
                      ? <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full" style={{ background: "#1B2A4A", color: "#fff" }}>{productInfo.additivesTags.length}</span>
                      : <span className="text-[11px] font-semibold" style={{ color: "#2D7D46" }}>None detected ✓</span>
                  }>
                  {productInfo.additivesTags && productInfo.additivesTags.length > 0 ? (
                    <div>
                      {productInfo.additivesTags.map((a, i) => {
                        const code = a.replace(/^en:/, "").replace(/-.*$/, "").toUpperCase();
                        const risk = getAdditiveRisk(a);
                        const riskColor = getAdditiveRiskColor(risk);
                        const riskLabel = getAdditiveRiskLabel(risk);
                        const desc = getAdditiveDescription(a);
                        return (
                          <div key={a} className="py-3" style={{ borderBottom: i < productInfo.additivesTags!.length - 1 ? "1px solid #F3F4F6" : "none" }}>
                            <div className="flex items-center justify-between">
                              <span>
                                <span className="font-bold text-[13px]" style={{ color: "#1B2A4A" }}>{code}</span>
                                <span className="font-semibold text-[13px] ml-1" style={{ color: "#1B2A4A" }}> · {formatTag(a)}</span>
                              </span>
                              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md text-white flex-shrink-0" style={{ background: riskColor }}>
                                {riskLabel}
                              </span>
                            </div>
                            <p className="text-xs mt-1" style={{ color: "#6B7280" }}>{desc}</p>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-4">
                      <motion.div initial={{ scale: 0.5 }} animate={{ scale: 1 }} transition={{ duration: 0.3, ease: "easeOut" }}
                        className="w-10 h-10 rounded-full flex items-center justify-center mx-auto mb-2" style={{ background: "rgba(45,125,70,0.1)" }}>
                        <Check size={20} style={{ color: "#2D7D46" }} />
                      </motion.div>
                      <p className="font-semibold text-[15px]" style={{ color: "#2D7D46" }}>No additives detected</p>
                      <p className="text-[13px] mt-1" style={{ color: "#9CA3AF" }}>This product contains no artificial additives.</p>
                    </div>
                  )}
                </AccordionSection>

                {/* Labels */}
                {productInfo.labelsTags && productInfo.labelsTags.length > 0 && (
                  <AccordionSection title="Certifications" isOpen={expandedSections.has("labels")} onToggle={() => toggleSection("labels")}>
                    <div className="flex flex-wrap gap-1.5">
                      {productInfo.labelsTags.map(l => (
                        <span key={l} className="text-xs font-semibold px-2.5 py-1 rounded-lg border" style={{ borderColor: "#1B2A4A", color: "#1B2A4A" }}>
                          {formatTag(l)}
                        </span>
                      ))}
                    </div>
                  </AccordionSection>
                )}
              </div>
            )}
          </div>

          {/* Bottom action row — Scan Again + Save */}
          <div className="px-5 pb-6 pt-2 flex-shrink-0 flex gap-3" style={{ paddingBottom: "calc(env(safe-area-inset-bottom, 16px) + 16px)" }}>
            <motion.button whileTap={{ scale: 0.97 }} onClick={scanAnother}
              className="flex-1 font-semibold text-sm flex items-center justify-center gap-2"
              style={{ border: "1px solid #E8314A", color: "#E8314A", background: "#fff", height: 44, borderRadius: 12 }}>
              Scan Again
            </motion.button>
            <motion.button whileTap={{ scale: 0.97 }} onClick={handleSave}
              className="flex-1 font-semibold text-sm flex items-center justify-center gap-2"
              style={{
                border: savedState === "saved" ? "1px solid #2D7D46" : "1px solid #1B2A4A",
                color: savedState === "saved" ? "#2D7D46" : "#1B2A4A",
                background: "#fff", height: 44, borderRadius: 12,
              }}>
              {savedState === "saved" ? "Saved ✓" : "Save"}
            </motion.button>
          </div>

          <p className="text-center pb-2 text-[11px]" style={{ color: "#9CA3AF" }}>
            Powered by Open Food Facts · Data may vary from physical product
          </p>
        </motion.div>
      </div>
    );
  }

  // ─── SCREEN: HISTORY ───
  if (screen === "history") {
    return (
      <div className="min-h-screen bg-background" style={{ maxWidth: 430, margin: "0 auto" }}>
        <div className="flex items-center justify-between px-5 pt-[env(safe-area-inset-top,12px)] h-14">
          <h1 className="font-extrabold text-[22px] tracking-tight" style={{ color: "#1B2A4A" }}>Your Scans</h1>
          <button onClick={() => { clearHistory(); setHistory([]); }} className="text-sm font-semibold" style={{ color: "#E8314A" }}>Clear all</button>
        </div>
        <div className="px-5 pt-2">
          {history.length === 0 ? (
            <div className="text-center py-16"><p className="text-sm" style={{ color: "#6B7280" }}>No scans yet</p></div>
          ) : (
            <div className="divide-y" style={{ borderColor: "#F3F4F6" }}>
              {history.map(item => (
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
        <div className="fixed bottom-0 left-0 right-0 px-5 pb-6 pt-3" style={{ maxWidth: 430, margin: "0 auto", paddingBottom: "calc(env(safe-area-inset-bottom, 16px) + 16px)" }}>
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

// ─── Accordion Section Component ───
function AccordionSection({ title, isOpen, onToggle, indicator, children }: {
  title: string; isOpen: boolean; onToggle: () => void;
  indicator?: React.ReactNode; children: React.ReactNode;
}) {
  return (
    <div className="border rounded-xl overflow-hidden" style={{ borderColor: "#F3F4F6" }}>
      <button onClick={onToggle} className="w-full flex items-center justify-between px-4 py-3 text-left">
        <span className="font-semibold text-[15px]" style={{ color: "#1B2A4A" }}>{title}</span>
        <div className="flex items-center gap-2">
          {indicator}
          <motion.div animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.2 }}>
            <ChevronDown size={16} style={{ color: "#9CA3AF" }} />
          </motion.div>
        </div>
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }}>
            <div className="px-4 pb-4">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
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
