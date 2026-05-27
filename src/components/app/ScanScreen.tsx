import { useState, useEffect, useRef, useCallback } from "react";
import {
  ShoppingBag,
  Camera,
  Search,
  Loader2,
  Barcode,
  Sparkles,
  X,
  Flashlight,
  FlashlightOff,
  Plus,
  Minus,
  Share2,
} from "lucide-react";
import { Product } from "@/data/products";
import { ProductImage } from "@/components/app/ProductImage";
import { useCart } from "@/context/CartContext";
import { motion, AnimatePresence } from "framer-motion";
import { lookupBarcode } from "@/lib/openfoodfacts";
import { Input } from "@/components/ui/input";
import ProductInfoSheet, { ProductInfoButton } from "@/components/app/ProductInfoSheet";
import { trackEvent } from "@/lib/analytics";
import * as ZXing from "@zxing/library";

interface ScanScreenProps {
  onOpenBag: () => void;
}

// Bundled ZXing instead of CDN script for supply-chain safety
const loadZxingLibrary = async (): Promise<typeof ZXing> => ZXing;

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
  const { addItem, removeItem, updateQuantity, items, itemCount, total } = useCart();

  const [lastScanned, setLastScanned] = useState<Product | null>(null);
  const [cameraActive, setCameraActive] = useState(false);
  
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [showAddedFeedback, setShowAddedFeedback] = useState<string | null>(null);
  const [manualBarcode, setManualBarcode] = useState("");
  const [isLookingUp, setIsLookingUp] = useState(false);
  const [lookupError, setLookupError] = useState<string | null>(null);
  const [torchSupported, setTorchSupported] = useState(false);
  const [torchOn, setTorchOn] = useState(false);
  const [detectedFormat, setDetectedFormat] = useState<string | null>(null);
  const [infoProduct, setInfoProduct] = useState<Product | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const readerRef = useRef<any>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const isStartingRef = useRef(false);
  const processedBarcodesRef = useRef<Set<string>>(new Set());
  const manualInputRef = useRef<HTMLInputElement | null>(null);
  const cameraTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);


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
      setLookupError("We couldn’t match that barcode yet. Try a steadier scan or enter the full number.");
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
      trackEvent("scan_success", { barcode, format: formatName || inferFormat(barcode) });
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

      // Prefer higher-res rear camera with continuous autofocus + auto exposure
      const buildVideo = (rearMode: ConstrainDOMString): MediaTrackConstraints => ({
        facingMode: rearMode,
        width: { ideal: 1920 },
        height: { ideal: 1080 },
        frameRate: { ideal: 30, max: 60 },
        advanced: [
          { focusMode: "continuous" } as any,
          { exposureMode: "continuous" } as any,
          { whiteBalanceMode: "continuous" } as any,
        ],
      });


      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          audio: false,
          video: buildVideo({ exact: "environment" } as any),
        });
      } catch {
        try {
          stream = await navigator.mediaDevices.getUserMedia({
            audio: false,
            video: buildVideo({ ideal: "environment" } as any),
          });
        } catch {
          // Last-resort fallback for desktops with no rear camera
          stream = await navigator.mediaDevices.getUserMedia({
            audio: false,
            video: { width: { ideal: 1280 }, height: { ideal: 720 } },
          });
        }
      }

      if (!videoRef.current) {
        throw new Error("Camera preview not ready");
      }

      streamRef.current = stream;
      videoRef.current.srcObject = stream;
      await videoRef.current.play();

      const track = stream.getVideoTracks()[0];
      const capabilities = track?.getCapabilities?.() as MediaTrackCapabilities & { torch?: boolean; focusMode?: string[] };
      setTorchSupported(Boolean(capabilities?.torch));

      // Best-effort continuous autofocus once track is live
      try {
        if (capabilities?.focusMode?.includes("continuous")) {
          await track.applyConstraints({ advanced: [{ focusMode: "continuous" } as any] });
        }
      } catch { /* ignore */ }

      const hints = new Map();
      hints.set(ZXing.DecodeHintType.POSSIBLE_FORMATS, [
        ZXing.BarcodeFormat.EAN_13,
        ZXing.BarcodeFormat.EAN_8,
        ZXing.BarcodeFormat.UPC_A,
        ZXing.BarcodeFormat.UPC_E,
        ZXing.BarcodeFormat.CODE_128,
        ZXing.BarcodeFormat.CODE_39,
        ZXing.BarcodeFormat.CODE_93,
        ZXing.BarcodeFormat.ITF,
        ZXing.BarcodeFormat.CODABAR,
        ZXing.BarcodeFormat.QR_CODE,
        ZXing.BarcodeFormat.DATA_MATRIX,
      ]);
      hints.set(ZXing.DecodeHintType.TRY_HARDER, true);

      // 200ms scan interval = ~5fps decode, much smoother than 100ms and reduces false misses
      const reader = new ZXing.BrowserMultiFormatReader(hints, 200);
      readerRef.current = reader;
      setCameraActive(true);

      // After 18 seconds without a hit, nudge user to manual entry (was 12s, too aggressive)
      cameraTimeoutRef.current = setTimeout(() => {
        void stopCamera();
        setCameraError("Couldn't read the barcode. Try moving closer, steadier hands, or enter the number below.");
        setTimeout(() => manualInputRef.current?.focus(), 300);
      }, 18000);

      const onDecode = (result: any, error: any) => {
        if (result) {
          const text = typeof result.getText === "function" ? result.getText() : result.text;
          const fmt = typeof result.getBarcodeFormat === "function"
            ? formatZXingName(result.getBarcodeFormat())
            : undefined;
          // Soft haptic on success when supported
          try { (navigator as any).vibrate?.(40); } catch { /* ignore */ }
          void handleDetectedBarcode(text, fmt);
          return;
        }
        if (!error) return;
        // Silently ignore not-found / checksum noise — user has manual fallback
      };

      if (typeof reader.decodeFromStream === "function") {
        reader.decodeFromStream(stream, videoRef.current, onDecode);
      } else {
        reader.decodeFromVideoDevice(undefined, videoRef.current, onDecode);
      }
    } catch (error: any) {
      const message = String(error?.message || "").toLowerCase();
      if (message.includes("notallowed") || message.includes("permission") || message.includes("denied")) {
        setCameraError("Please allow camera access to scan product barcodes.");
      } else {
        setCameraError("Camera unavailable. Try again or enter the barcode number manually.");
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

    if (barcode.length < 8) {
      setLookupError("Enter the full barcode number to find the exact product.");
      return;
    }

    setDetectedFormat(inferFormat(barcode));
    await lookupAndShowProduct(barcode);
    setManualBarcode("");
  }, [lookupAndShowProduct, manualBarcode]);

  const handleAddToCart = useCallback(() => {
    if (!lastScanned) return;

    addItem(lastScanned);
    trackEvent("add_to_cart", { product: lastScanned.name, price: lastScanned.price });
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
      <div className="px-4 pt-7 pb-2">
        <div className="flex items-center justify-between">
          <h1 className="text-[22px] font-bold text-foreground tracking-tight leading-tight">Scan a real product</h1>
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={onOpenBag}
            className="relative w-10 h-10 bg-foreground/5 rounded-full flex items-center justify-center"
          >
            <ShoppingBag size={18} className="text-foreground" />
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


      <div className="mx-4 rounded-2xl overflow-hidden relative bg-scanner-ink border border-white/[0.08] aspect-[12/7] shadow-elevated">

        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="w-full h-full object-cover"
        />

        {/* Premium gradient overlays */}
        <div className="absolute inset-0 pointer-events-none z-[5]">
          <div className="absolute inset-x-0 top-0 h-12 bg-gradient-to-b from-scanner-ink/60 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-scanner-ink/60 to-transparent" />
          <div className="absolute inset-y-0 left-0 w-8 bg-gradient-to-r from-scanner-ink/40 to-transparent" />
          <div className="absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-scanner-ink/40 to-transparent" />
        </div>

        {!cameraActive && (
          <div className="absolute inset-0 bg-scanner-ink/90 backdrop-blur-sm flex flex-col items-center justify-center gap-3 px-6 z-10">
            <motion.button
              whileTap={{ scale: 0.96 }}
              onClick={startCamera}
              className="bg-scanner-accent text-primary-foreground rounded-full px-6 py-3 flex items-center gap-2 font-semibold text-[13px] shadow-elevated"
            >
              <Camera size={16} /> Scan product barcode
            </motion.button>
            {cameraError && (
              <p className="text-[11px] text-destructive text-center max-w-[240px]">{cameraError}</p>
            )}
          </div>
        )}

        {cameraActive && (
          <>
            <div className="absolute inset-0 z-10 pointer-events-none">
              <div className="absolute inset-4 border border-scanner-accent/40 rounded-lg" />
              <motion.div
                animate={{ y: [8, 140, 8] }}
                transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
                className="absolute left-6 right-6 h-[1.5px] bg-scanner-accent/80 shadow-[0_0_12px_hsl(var(--scanner-accent)/0.7)]"
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
              Center the barcode in the red line
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
            <p className="text-sm text-foreground font-medium mt-2">Finding product details…</p>
          </motion.div>
        )}
      </div>

      <div className="mx-4 mt-2.5">
        <form onSubmit={(e) => { e.preventDefault(); void handleManualLookup(); }} className="flex gap-2 items-center">
          <div className="flex-1 relative">
            <Barcode size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground/50" />
            <Input
              ref={manualInputRef}
              type="text"
              inputMode="numeric"
              value={manualBarcode}
              onChange={(e) => setManualBarcode(e.target.value.replace(/[^0-9A-Za-z-]/g, ""))}
              placeholder="Enter barcode number"
              className="h-10 rounded-full bg-muted/40 border-border/30 pl-9 text-[13px]"
              disabled={isLookingUp}
              aria-label="Manual barcode input"
            />
          </div>
          <motion.button
            whileTap={{ scale: 0.95 }}
            type="submit"
            disabled={isLookingUp || !manualBarcode.trim()}
            className="bg-scanner-accent text-primary-foreground rounded-full w-10 h-10 flex items-center justify-center disabled:opacity-40 flex-shrink-0"
            aria-label="Lookup barcode"
          >
            <Search size={15} />
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

      {/* Bottom sheet style scanned items */}
      <div className="flex-1 overflow-y-auto pb-32">
        {(items.length > 0 || lastScanned) && (
          <div className="mx-0 mt-2 bg-background rounded-t-3xl pt-2">
            <div className="flex justify-center py-1.5">
              <div className="w-10 h-1 rounded-full bg-muted-foreground/20" />
            </div>
            <div className="px-4 space-y-2 pb-4">
              <AnimatePresence>
                {showAddedFeedback && (
                  <motion.div
                    initial={{ opacity: 0, y: -10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -10, scale: 0.95 }}
                    className="flex items-center gap-2 bg-scanner-ink text-primary-foreground rounded-full px-4 py-2 mb-2 w-fit mx-auto"
                  >
                    <Sparkles size={13} />
                    <span className="text-xs font-semibold">Added to cart</span>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Scanned product preview */}
              {lastScanned && !items.find(i => i.product.id === lastScanned.id) && (
                <motion.div
                  key={`preview-${lastScanned.id}`}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-3 bg-card rounded-2xl p-3 border-2 border-scanner-accent/20"
                >
                  <div className="w-16 h-16 rounded-xl overflow-hidden bg-muted/30 flex-shrink-0">
                    <ProductImage
                      barcode={lastScanned.barcode}
                      name={lastScanned.name}
                      brand={lastScanned.brand}
                      fallbackImage={lastScanned.image}
                      category={lastScanned.category}
                      className="w-full h-full object-contain p-1.5"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-[15px] font-bold text-foreground leading-snug line-clamp-2">{lastScanned.name}</h4>
                    <p className="text-xs text-muted-foreground mt-0.5">{lastScanned.weight}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <p className="text-[15px] font-bold text-scanner-accent">${lastScanned.price.toFixed(2)}ea</p>
                      <ProductInfoButton onClick={() => setInfoProduct(lastScanned)} />
                    </div>
                  </div>
                  <motion.button whileTap={{ scale: 0.9 }} onClick={handleAddToCart} className="w-9 h-9 rounded-full bg-scanner-accent text-primary-foreground flex items-center justify-center flex-shrink-0">
                    <span className="text-lg font-bold leading-none">+</span>
                  </motion.button>
                </motion.div>
              )}

              {/* Share strip — appears right after a scan */}
              {lastScanned && (
                <motion.div
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="flex items-center justify-between gap-3 bg-foreground/[0.04] rounded-2xl px-3.5 py-2.5"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-7 h-7 rounded-full bg-foreground flex items-center justify-center flex-shrink-0">
                      <Share2 size={13} className="text-background" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[12px] font-semibold text-foreground leading-tight truncate">Share this find</p>
                      <p className="text-[10px] text-muted-foreground leading-tight truncate">Help a friend skip the line</p>
                    </div>
                  </div>
                  <motion.button
                    whileTap={{ scale: 0.94 }}
                    onClick={async () => {
                      const shareData = {
                        title: lastScanned.name,
                        text: `Just scanned ${lastScanned.name} on SKAAP — skip every line.`,
                        url: typeof window !== "undefined" ? window.location.origin : "https://useskaap.com",
                      };
                      trackEvent("share_scan", { product: lastScanned.name });
                      try {
                        if (navigator.share) {
                          await navigator.share(shareData);
                        } else {
                          await navigator.clipboard?.writeText(`${shareData.text} ${shareData.url}`);
                          setShowAddedFeedback("link-copied");
                          setTimeout(() => setShowAddedFeedback(null), 1200);
                        }
                      } catch { /* user cancelled */ }
                    }}
                    className="bg-foreground text-background rounded-full px-3.5 py-1.5 text-[11px] font-semibold tracking-tight"
                  >
                    Share
                  </motion.button>
                </motion.div>
              )}

              {/* Cart items */}
              {items.map((item, i) => (
                <motion.div
                  key={item.product.id}
                  layout
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03 }}
                  className="flex items-center gap-3 bg-card rounded-2xl p-3 border border-border/50"
                >
                  <div className="w-16 h-16 rounded-xl overflow-hidden bg-muted/30 flex-shrink-0">
                    <ProductImage
                      barcode={item.product.barcode}
                      name={item.product.name}
                      brand={item.product.brand}
                      fallbackImage={item.product.image}
                      category={item.product.category}
                      className="w-full h-full object-contain p-1.5"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-[15px] font-bold text-foreground leading-snug line-clamp-2">{item.product.name}</h4>
                    <p className="text-xs text-muted-foreground mt-0.5">{item.product.weight}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <p className="text-[15px] font-bold text-scanner-accent">${item.product.price.toFixed(2)}ea</p>
                      <ProductInfoButton onClick={() => setInfoProduct(item.product)} />
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <button onClick={() => updateQuantity(item.product.id, item.quantity - 1)} className="w-7 h-7 rounded-full bg-foreground/[0.06] flex items-center justify-center">
                      <Minus size={12} className="text-foreground" />
                    </button>
                    <span className="text-xs font-bold text-foreground w-5 text-center">{item.quantity}</span>
                    <button onClick={() => updateQuantity(item.product.id, item.quantity + 1)} className="w-7 h-7 rounded-full bg-foreground/[0.06] flex items-center justify-center">
                      <Plus size={12} className="text-foreground" />
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {items.length === 0 && !lastScanned && (
          <div className="flex flex-col items-center justify-center pt-12 text-center px-4">
            <div className="w-14 h-14 rounded-full bg-foreground/[0.03] flex items-center justify-center mb-3">
              <Barcode size={24} className="text-muted-foreground/40" />
            </div>
            <p className="text-sm font-semibold text-foreground">Ready to scan</p>
            <p className="text-xs text-muted-foreground mt-1 max-w-[220px]">
              Tap "Scan product barcode" or enter the full barcode number below
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

      <ProductInfoSheet
        product={infoProduct}
        open={!!infoProduct}
        onClose={() => setInfoProduct(null)}
      />
    </div>
  );
};

export default ScanScreen;
