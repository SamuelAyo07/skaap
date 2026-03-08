import { useState, useEffect, useRef, useCallback } from "react";
import {
  ShoppingBag,
  Camera,
  Search,
  Loader2,
  Barcode,
  Trash2,
  Sparkles,
  X,
  Flashlight,
  FlashlightOff,
  
} from "lucide-react";
import { Product } from "@/data/products";
import { useCart } from "@/context/CartContext";
import { motion, AnimatePresence } from "framer-motion";
import { lookupBarcode } from "@/lib/openfoodfacts";
import { Input } from "@/components/ui/input";

interface ScanScreenProps {
  onOpenBag: () => void;
}

declare global {
  interface Window {
    ZXing?: any;
  }
}

const ZXING_SCRIPT_ID = "zxing-umd-script";
const ZXING_SCRIPT_SRC = "https://unpkg.com/@zxing/library@latest/umd/index.min.js";

const ALLERGEN_KEYWORDS = [
  "milk",
  "egg",
  "eggs",
  "peanut",
  "peanuts",
  "tree nut",
  "almond",
  "cashew",
  "walnut",
  "soy",
  "wheat",
  "gluten",
  "sesame",
  "fish",
  "shellfish",
  "shrimp",
  "crab",
  "lobster",
  "mustard",
];

const loadZxingLibrary = async (): Promise<any> => {
  if (window.ZXing) return window.ZXing;

  const existing = document.getElementById(ZXING_SCRIPT_ID) as HTMLScriptElement | null;
  if (existing) {
    await new Promise<void>((resolve, reject) => {
      if (window.ZXing) {
        resolve();
        return;
      }

      const handleLoad = () => {
        cleanup();
        resolve();
      };

      const handleError = () => {
        cleanup();
        reject(new Error("Failed to load ZXing scanner"));
      };

      const cleanup = () => {
        existing.removeEventListener("load", handleLoad);
        existing.removeEventListener("error", handleError);
      };

      existing.addEventListener("load", handleLoad);
      existing.addEventListener("error", handleError);
    });
    return window.ZXing;
  }

  await new Promise<void>((resolve, reject) => {
    const script = document.createElement("script");
    script.id = ZXING_SCRIPT_ID;
    script.src = ZXING_SCRIPT_SRC;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load ZXing scanner"));
    document.body.appendChild(script);
  });

  if (!window.ZXing) {
    throw new Error("ZXing scanner unavailable");
  }

  return window.ZXing;
};

const playScanBeep = () => {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;

    const ctx = new AudioCtx();
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(880, ctx.currentTime);
    gainNode.gain.setValueAtTime(0.0001, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.18, ctx.currentTime + 0.01);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.18);

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);
    oscillator.start();
    oscillator.stop(ctx.currentTime + 0.2);

    setTimeout(() => {
      void ctx.close();
    }, 250);
  } catch {
    // no-op beep fallback
  }
};

const normalizeAllergenText = (value: string) =>
  value
    .toLowerCase()
    .replace(/[_-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const ZXING_FORMAT_MAP: Record<number, string> = {
  0: "AZTEC", 1: "CODABAR", 2: "CODE-39", 3: "CODE-93", 4: "CODE-128",
  5: "DATA_MATRIX", 6: "EAN-8", 7: "EAN-13", 8: "ITF", 9: "MAXICODE",
  10: "PDF-417", 11: "QR", 12: "RSS-14", 13: "RSS-EXP", 14: "UPC-A",
  15: "UPC-E", 16: "UPC/EAN",
};

const formatZXingName = (fmt: any): string => {
  if (typeof fmt === "number") return ZXING_FORMAT_MAP[fmt] || `FORMAT-${fmt}`;
  if (typeof fmt === "string") return fmt.replace(/_/g, "-");
  return String(fmt);
};

const inferFormat = (barcode: string): string => {
  const digits = barcode.replace(/[^0-9]/g, "");
  if (digits.length === 13) return "EAN-13";
  if (digits.length === 8) return "EAN-8";
  if (digits.length === 12) return "UPC-A";
  if (digits.length === 6 || digits.length === 7) return "UPC-E";
  return "CODE-128";
};

const ScanScreen = ({ onOpenBag }: ScanScreenProps) => {
  const { addItem, removeItem, items, itemCount, total } = useCart();

  const [lastScanned, setLastScanned] = useState<Product | null>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [showNutritionDetails, setShowNutritionDetails] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [showAddedFeedback, setShowAddedFeedback] = useState<string | null>(null);
  const [manualBarcode, setManualBarcode] = useState("");
  const [isLookingUp, setIsLookingUp] = useState(false);
  const [lookupError, setLookupError] = useState<string | null>(null);
  const [torchSupported, setTorchSupported] = useState(false);
  const [torchOn, setTorchOn] = useState(false);
  const [detectedFormat, setDetectedFormat] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const readerRef = useRef<any>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const isStartingRef = useRef(false);
  const processedBarcodesRef = useRef<Set<string>>(new Set());
  const manualInputRef = useRef<HTMLInputElement | null>(null);
  const cameraTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const allergens = useMemo(() => {
    if (!lastScanned) return [] as string[];

    if (lastScanned.allergens?.length) {
      return [...new Set(lastScanned.allergens.map(normalizeAllergenText))];
    }

    if (!lastScanned.ingredients) return [] as string[];

    const normalizedIngredients = normalizeAllergenText(lastScanned.ingredients);
    return ALLERGEN_KEYWORDS.filter((keyword) => normalizedIngredients.includes(keyword));
  }, [lastScanned]);

  const stopCamera = useCallback(async () => {
    if (cameraTimeoutRef.current) {
      clearTimeout(cameraTimeoutRef.current);
      cameraTimeoutRef.current = null;
    }

    try {
      if (readerRef.current?.reset) {
        readerRef.current.reset();
      }
    } catch {
      // no-op
    }

    readerRef.current = null;

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    setTorchOn(false);
    setTorchSupported(false);
    setCameraActive(false);
  }, []);

  const lookupAndShowProduct = useCallback(async (barcode: string) => {
    setIsLookingUp(true);
    setLookupError(null);

    const product = await lookupBarcode(barcode);

    if (!product) {
      setLookupError("Product not found — please scan again.");
      setIsLookingUp(false);
      return;
    }

    setLastScanned(product);
    setLookupError(null);
    setIsLookingUp(false);
  }, []);

  const handleDetectedBarcode = useCallback(
    async (rawText: string, formatName?: string) => {
      const barcode = rawText.trim();
      if (!barcode || processedBarcodesRef.current.has(barcode)) return;

      processedBarcodesRef.current.add(barcode);
      setDetectedFormat(formatName || inferFormat(barcode));
      await stopCamera();
      playScanBeep();
      await lookupAndShowProduct(barcode);

      setTimeout(() => {
        processedBarcodesRef.current.delete(barcode);
      }, 1200);
    },
    [lookupAndShowProduct, stopCamera]
  );

  const startCamera = useCallback(async () => {
    if (cameraActive || isStartingRef.current || isLookingUp) return;

    isStartingRef.current = true;
    setCameraError(null);
    setLookupError(null);

    try {
      const ZXing = await loadZxingLibrary();

      const constraintsExact: MediaStreamConstraints = {
        audio: false,
        video: {
          facingMode: { exact: "environment" },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      };

      const constraintsFallback: MediaStreamConstraints = {
        audio: false,
        video: {
          facingMode: { ideal: "environment" },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      };

      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia(constraintsExact);
      } catch {
        stream = await navigator.mediaDevices.getUserMedia(constraintsFallback);
      }

      if (!videoRef.current) {
        throw new Error("Camera preview not ready");
      }

      streamRef.current = stream;
      videoRef.current.srcObject = stream;
      await videoRef.current.play();

      const track = stream.getVideoTracks()[0];
      const capabilities = track?.getCapabilities?.() as MediaTrackCapabilities & { torch?: boolean };
      setTorchSupported(Boolean(capabilities?.torch));

      const hints = new Map();
      hints.set(ZXing.DecodeHintType.POSSIBLE_FORMATS, [
        ZXing.BarcodeFormat.EAN_13,
        ZXing.BarcodeFormat.EAN_8,
        ZXing.BarcodeFormat.UPC_A,
        ZXing.BarcodeFormat.UPC_E,
        ZXing.BarcodeFormat.CODE_128,
        ZXing.BarcodeFormat.CODE_39,
      ]);

      const reader = new ZXing.BrowserMultiFormatReader(hints, 100);
      readerRef.current = reader;
      setCameraActive(true);

      // After 12 seconds with no detection, stop camera and nudge user to manual entry
      cameraTimeoutRef.current = setTimeout(() => {
        void stopCamera();
        setCameraError("Couldn't detect a barcode — try typing it manually below.");
        setTimeout(() => manualInputRef.current?.focus(), 300);
      }, 12000);

      const onDecode = (result: any, error: any) => {
        if (result) {
          const text = typeof result.getText === "function" ? result.getText() : result.text;
          const fmt = typeof result.getBarcodeFormat === "function"
            ? formatZXingName(result.getBarcodeFormat())
            : undefined;
          void handleDetectedBarcode(text, fmt);
          return;
        }

        if (!error) return;
        // Silently ignore all scan errors — user has manual entry as fallback
      };

      if (typeof reader.decodeFromStream === "function") {
        reader.decodeFromStream(stream, videoRef.current, onDecode);
      } else {
        reader.decodeFromVideoDevice(undefined, videoRef.current, onDecode);
      }
    } catch (error: any) {
      const message = String(error?.message || "").toLowerCase();
      if (message.includes("notallowed") || message.includes("permission") || message.includes("denied")) {
        setCameraError("Please allow camera access in your browser settings.");
      } else {
        setCameraError("Camera unavailable. Please try again or use manual barcode entry.");
      }
      await stopCamera();
    } finally {
      isStartingRef.current = false;
    }
  }, [cameraActive, handleDetectedBarcode, isLookingUp, stopCamera]);

  const toggleTorch = useCallback(async () => {
    const track = streamRef.current?.getVideoTracks?.()[0];
    if (!track) return;

    try {
      const next = !torchOn;
      await track.applyConstraints({ advanced: [{ torch: next } as any] });
      setTorchOn(next);
    } catch {
      setCameraError("Flashlight is not available on this device.");
      setTorchSupported(false);
    }
  }, [torchOn]);

  const handleManualLookup = useCallback(async () => {
    const barcode = manualBarcode.replace(/\s+/g, "").trim();
    if (!barcode) return;

    setDetectedFormat(inferFormat(barcode));
    await lookupAndShowProduct(barcode);
    setManualBarcode("");
  }, [lookupAndShowProduct, manualBarcode]);

  const handleAddToCart = useCallback(() => {
    if (!lastScanned) return;

    addItem(lastScanned);
    setShowAddedFeedback(lastScanned.id);
    setTimeout(() => setShowAddedFeedback(null), 1200);
  }, [addItem, lastScanned]);

  useEffect(() => {
    return () => {
      void stopCamera();
    };
  }, [stopCamera]);

  const tax = total * 0.11;
  const grandTotal = total + tax;

  return (
    <div className="flex flex-col h-full bg-background">
      <div className="px-4 pt-10 pb-2">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-foreground tracking-tight">Scan</h1>
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={onOpenBag}
            className="relative w-11 h-11 bg-foreground/5 rounded-full flex items-center justify-center"
          >
            <ShoppingBag size={20} className="text-foreground" />
            {itemCount > 0 && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute -top-0.5 -right-0.5 bg-primary text-primary-foreground text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center"
              >
                {itemCount}
              </motion.span>
            )}
          </motion.button>
        </div>
      </div>

      <div className="mx-4 rounded-2xl overflow-hidden relative bg-scanner-ink/10 border border-scanner-ink/20 aspect-[4/3]">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="w-full h-full object-cover bg-muted"
        />

        {!cameraActive && (
          <div className="absolute inset-0 bg-background/75 backdrop-blur-[2px] flex flex-col items-center justify-center gap-4 px-6 z-10">
            <motion.button
              whileTap={{ scale: 0.96 }}
              onClick={startCamera}
              className="bg-scanner-accent text-primary-foreground rounded-full px-7 py-3.5 flex items-center gap-2.5 font-semibold text-sm shadow-elevated"
            >
              <Camera size={18} /> Scan with Camera
            </motion.button>
            {cameraError && (
              <p className="text-xs text-destructive text-center max-w-[260px]">{cameraError}</p>
            )}
          </div>
        )}

        {cameraActive && (
          <>
            <div className="absolute inset-0 z-10 pointer-events-none">
              <div className="absolute inset-5 border border-scanner-accent/60 rounded-xl" />
              <motion.div
                animate={{ y: [10, 200, 10] }}
                transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
                className="absolute left-8 right-8 h-[2px] bg-scanner-accent shadow-[0_0_16px_hsl(var(--scanner-accent)/0.9)]"
              />
            </div>

            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => void stopCamera()}
              className="absolute top-3 right-3 z-20 w-9 h-9 bg-background/80 text-foreground rounded-full flex items-center justify-center"
              aria-label="Stop camera"
            >
              <X size={16} />
            </motion.button>

            {torchSupported && (
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => void toggleTorch()}
                className="absolute top-3 left-3 z-20 h-9 px-3 bg-scanner-ink/85 text-primary-foreground rounded-full text-xs font-semibold flex items-center gap-1.5"
              >
                {torchOn ? <FlashlightOff size={14} /> : <Flashlight size={14} />}
                {torchOn ? "Torch off" : "Torch on"}
              </motion.button>
            )}

            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20 bg-background/85 text-scanner-ink rounded-full px-3 py-1.5 text-[11px] font-medium">
              Align barcode in the red line
            </div>
          </>
        )}

        {isLookingUp && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 bg-background/80 backdrop-blur-sm flex flex-col items-center justify-center z-30"
          >
            <Loader2 size={26} className="text-scanner-accent animate-spin" />
            <p className="text-sm text-foreground font-medium mt-2">Looking up product…</p>
          </motion.div>
        )}
      </div>

      <div className="mx-5 mt-3 rounded-2xl bg-muted/30 border border-border/40 p-3">
        <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-widest mb-2">
          Manual barcode entry
        </p>
        <form onSubmit={(e) => { e.preventDefault(); void handleManualLookup(); }} className="flex gap-2">
          <Input
            ref={manualInputRef}
            type="text"
            inputMode="numeric"
            value={manualBarcode}
            onChange={(e) => setManualBarcode(e.target.value.replace(/[^0-9A-Za-z-]/g, ""))}
            placeholder="Enter barcode"
            className="h-11 rounded-full bg-background"
            disabled={isLookingUp}
            aria-label="Manual barcode input"
          />
          <motion.button
            whileTap={{ scale: 0.95 }}
            type="submit"
            disabled={isLookingUp || !manualBarcode.trim()}
            className="bg-scanner-accent text-primary-foreground rounded-full w-11 h-11 flex items-center justify-center disabled:opacity-40"
            aria-label="Lookup barcode"
          >
            <Search size={16} />
          </motion.button>
        </form>
      </div>

      <AnimatePresence>
        {lookupError && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mx-5 mt-2"
          >
            <p className="text-xs text-destructive bg-destructive/10 rounded-full py-2 px-4 text-center">
              {lookupError}
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex-1 overflow-y-auto px-4 pt-3 pb-32">
        <AnimatePresence>
          {showAddedFeedback && (
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              className="flex items-center gap-2 bg-scanner-ink text-primary-foreground rounded-full px-4 py-2.5 mb-3 w-fit mx-auto"
            >
              <Sparkles size={14} />
              <span className="text-xs font-semibold">Added to cart</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Compact scanned product preview */}
        {lastScanned && !items.find(i => i.product.id === lastScanned.id) && (
          <motion.div
            key={`preview-${lastScanned.id}`}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-3 bg-card rounded-2xl p-3 border-2 border-scanner-accent/30 mb-3"
          >
            <div className="w-14 h-14 rounded-xl overflow-hidden bg-muted/40 flex-shrink-0">
              <img
                src={lastScanned.image}
                alt={lastScanned.name}
                className="w-full h-full object-contain p-1"
                onError={(e) => { (e.target as HTMLImageElement).src = "/placeholder.svg"; }}
              />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-bold text-foreground leading-tight line-clamp-2">{lastScanned.name}</h4>
              <p className="text-xs text-muted-foreground mt-0.5">{lastScanned.weight}</p>
              <p className="text-sm font-bold text-scanner-accent mt-0.5">${lastScanned.price.toFixed(2)}ea</p>
            </div>
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={handleAddToCart}
              className="w-10 h-10 rounded-full bg-scanner-accent text-primary-foreground flex items-center justify-center flex-shrink-0"
            >
              <span className="text-xl font-bold leading-none">+</span>
            </motion.button>
          </motion.div>
        )}

        {/* Cart items list - compact rows */}
        {items.length > 0 && (
          <div className="space-y-2">
            {items.map((item, i) => (
              <motion.div
                key={item.product.id}
                layout
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
                className="flex items-center gap-3 bg-card rounded-2xl p-3 border border-border/50"
              >
                <div className="w-14 h-14 rounded-xl overflow-hidden bg-muted/40 flex-shrink-0">
                  <img
                    src={item.product.image}
                    alt={item.product.name}
                    className="w-full h-full object-contain p-1"
                    onError={(e) => { (e.target as HTMLImageElement).src = "/placeholder.svg"; }}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-bold text-foreground leading-tight line-clamp-2">{item.product.name}</h4>
                  <p className="text-xs text-muted-foreground mt-0.5">{item.product.weight}</p>
                  <p className="text-sm font-bold text-scanner-accent mt-0.5">
                    ${item.product.price.toFixed(2)}ea
                    {item.quantity > 1 && <span className="text-muted-foreground font-medium ml-1">× {item.quantity}</span>}
                  </p>
                </div>
                <button
                  onClick={() => removeItem(item.product.id)}
                  className="w-8 h-8 rounded-full bg-foreground/5 flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all flex-shrink-0"
                >
                  <Trash2 size={14} />
                </button>
              </motion.div>
            ))}
          </div>
        )}

        {items.length === 0 && !lastScanned && (
          <div className="flex flex-col items-center justify-center pt-12 text-center">
            <div className="w-16 h-16 rounded-full bg-foreground/[0.03] flex items-center justify-center mb-4">
              <Barcode size={28} className="text-muted-foreground/40" />
            </div>
            <p className="text-sm font-semibold text-foreground">Ready to scan</p>
            <p className="text-xs text-muted-foreground mt-1 max-w-[220px]">
              Tap "Scan with Camera" and hold the barcode over the red line
            </p>
          </div>
        )}
      </div>

      {/* Sticky ADD TO BAG / Checkout button */}
      {items.length > 0 && (
        <div className="absolute bottom-16 left-0 right-0 px-4 pb-3 pt-2.5">
          <motion.button
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            whileTap={{ scale: 0.97 }}
            onClick={onOpenBag}
            className="w-full bg-scanner-accent text-primary-foreground rounded-2xl py-4 font-bold text-[15px] tracking-tight flex items-center justify-between px-6"
          >
            <span>ADD TO BAG</span>
            <span>${grandTotal.toFixed(2)}</span>
          </motion.button>
        </div>
      )}
    </div>
  );
};

export default ScanScreen;
