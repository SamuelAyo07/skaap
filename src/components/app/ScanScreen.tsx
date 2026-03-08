import { useState, useEffect, useRef, useCallback } from "react";
import {
  ShoppingBag, Camera, Search, Loader2,
  Barcode, Trash2, ChevronDown, Leaf,
  Sparkles, X, RotateCcw
} from "lucide-react";
import { Product } from "@/data/products";
import { useCart } from "@/context/CartContext";
import { motion, AnimatePresence } from "framer-motion";
import { Html5Qrcode, Html5QrcodeSupportedFormats } from "html5-qrcode";
import { lookupBarcode } from "@/lib/openfoodfacts";
import { Input } from "@/components/ui/input";

interface ScanScreenProps {
  onOpenBag: () => void;
}

const nutriScoreColors: Record<string, string> = {
  a: "bg-green-600",
  b: "bg-lime-500",
  c: "bg-yellow-500",
  d: "bg-orange-500",
  e: "bg-red-600",
};

const NutritionPill = ({ label, value, unit }: { label: string; value?: number; unit: string }) => {
  if (value == null) return null;
  return (
    <div className="flex items-center gap-1.5 bg-muted/60 backdrop-blur-sm rounded-full px-3 py-1.5">
      <span className="text-[11px] font-semibold text-foreground">{Math.round(value)}{unit}</span>
      <span className="text-[10px] text-muted-foreground">{label}</span>
    </div>
  );
};

const ScanScreen = ({ onOpenBag }: ScanScreenProps) => {
  const { addItem, removeItem, items, itemCount, total } = useCart();
  const [lastScanned, setLastScanned] = useState<Product | null>(null);
  const [expandedNutrition, setExpandedNutrition] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [showAddedFeedback, setShowAddedFeedback] = useState<string | null>(null);
  const [manualBarcode, setManualBarcode] = useState("");
  const [isLookingUp, setIsLookingUp] = useState(false);
  const [lookupError, setLookupError] = useState<string | null>(null);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const isStartingRef = useRef(false);
  const processedBarcodesRef = useRef<Set<string>>(new Set());
  const autoRestartRef = useRef(false);

  const handleProductFound = useCallback((product: Product) => {
    setLastScanned(product);
    setExpandedNutrition(false);
    setLookupError(null);
  }, []);

  const handleBarcodeScan = useCallback(async (decodedText: string) => {
    const barcode = decodedText.trim();
    if (!barcode || processedBarcodesRef.current.has(barcode)) return;
    processedBarcodesRef.current.add(barcode);

    if (scannerRef.current) {
      try {
        await scannerRef.current.stop();
        scannerRef.current.clear();
      } catch {}
      scannerRef.current = null;
      setCameraActive(false);
    }

    setIsLookingUp(true);
    setLookupError(null);

    const product = await lookupBarcode(barcode);
    if (product) {
      handleProductFound(product);
      addItem(product);
      setShowAddedFeedback(product.id);
      setTimeout(() => setShowAddedFeedback(null), 1500);
      autoRestartRef.current = true;
    } else {
      setLookupError(`No product found for barcode: ${barcode}`);
    }

    setIsLookingUp(false);
    setTimeout(() => processedBarcodesRef.current.delete(barcode), 3000);
  }, [handleProductFound, addItem]);

  const handleManualLookup = useCallback(async () => {
    const barcode = manualBarcode.replace(/\s+/g, "").trim();
    if (!barcode) return;

    setIsLookingUp(true);
    setLookupError(null);

    const product = await lookupBarcode(barcode);
    if (product) {
      handleProductFound(product);
      addItem(product);
      setShowAddedFeedback(product.id);
      setTimeout(() => setShowAddedFeedback(null), 1500);
      setManualBarcode("");
    } else {
      setLookupError(`No product found for barcode: ${barcode}`);
    }
    setIsLookingUp(false);
  }, [manualBarcode, handleProductFound, addItem]);

  const startCamera = useCallback(async () => {
    if (scannerRef.current || isStartingRef.current || isLookingUp) return;
    isStartingRef.current = true;
    setLookupError(null);
    setCameraError(null);

    try {
      const scanner = new Html5Qrcode("scanner-container", {
        formatsToSupport: [
          Html5QrcodeSupportedFormats.EAN_13,
          Html5QrcodeSupportedFormats.EAN_8,
          Html5QrcodeSupportedFormats.UPC_A,
          Html5QrcodeSupportedFormats.UPC_E,
          Html5QrcodeSupportedFormats.CODE_128,
          Html5QrcodeSupportedFormats.CODE_39,
          Html5QrcodeSupportedFormats.QR_CODE,
        ],
        verbose: false,
      });
      scannerRef.current = scanner;

      const config = {
        fps: 12,
        qrbox: (viewfinderWidth: number, viewfinderHeight: number) => ({
          width: Math.max(Math.min(Math.floor(viewfinderWidth * 0.9), 340), 220),
          height: Math.max(Math.min(Math.floor(viewfinderHeight * 0.45), 200), 120),
        }),
        aspectRatio: 1.777,
      };

      const cameras = await Html5Qrcode.getCameras();
      const backCameraId = cameras.find((camera) => /back|rear|environment/i.test(camera.label))?.id;
      const defaultCameraId = cameras[0]?.id;

      const scanAttempts: Array<() => Promise<void>> = [];
      if (backCameraId) {
        scanAttempts.push(() => scanner.start(backCameraId, config, handleBarcodeScan, () => {}));
      }
      scanAttempts.push(() => scanner.start({ facingMode: { ideal: "environment" } }, config, handleBarcodeScan, () => {}));
      if (defaultCameraId && defaultCameraId !== backCameraId) {
        scanAttempts.push(() => scanner.start(defaultCameraId, config, handleBarcodeScan, () => {}));
      }

      let started = false;
      let lastError: unknown = null;
      for (const attempt of scanAttempts) {
        try {
          await attempt();
          started = true;
          break;
        } catch (error) {
          lastError = error;
        }
      }

      if (!started) {
        throw lastError || new Error("Unable to access camera");
      }

      setCameraActive(true);
      setCameraError(null);
    } catch {
      setCameraError("Camera unavailable. Allow camera access or use manual entry below.");
      setCameraActive(false);
      try {
        await scannerRef.current?.clear();
      } catch {}
      scannerRef.current = null;
    } finally {
      isStartingRef.current = false;
    }
  }, [handleBarcodeScan, isLookingUp]);

  const stopCamera = useCallback(async () => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop();
        scannerRef.current.clear();
      } catch {}
      scannerRef.current = null;
    }
    setCameraActive(false);
  }, []);

  useEffect(() => {
    if (!isLookingUp && autoRestartRef.current && !cameraActive) {
      autoRestartRef.current = false;
      const timer = setTimeout(() => startCamera(), 1500);
      return () => clearTimeout(timer);
    }
  }, [isLookingUp, cameraActive, startCamera]);

  useEffect(() => {
    return () => { stopCamera(); };
  }, [stopCamera]);

  const tax = total * 0.11;
  const grandTotal = total + tax;

  return (
    <div className="flex flex-col h-full bg-background">
      {/* ── Minimal header ── */}
      <div className="px-4 pt-10 pb-2">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground tracking-tight">Scan</h1>
          </div>
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={onOpenBag}
            className="relative w-11 h-11 bg-foreground/5 backdrop-blur-xl rounded-full flex items-center justify-center"
          >
            <ShoppingBag size={20} className="text-foreground" />
            {itemCount > 0 && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute -top-0.5 -right-0.5 bg-primary text-primary-foreground text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center shadow-lg"
              >
                {itemCount}
              </motion.span>
            )}
          </motion.button>
        </div>
      </div>

      {/* ── Camera viewfinder ── */}
      <div className="mx-4 rounded-2xl overflow-hidden relative bg-foreground/[0.03] aspect-[4/3]">
        <div id="scanner-container" className="w-full h-full [&>video]:object-cover" />

        {/* Loading overlay */}
        {isLookingUp && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 bg-background/80 backdrop-blur-xl flex flex-col items-center justify-center z-30"
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            >
              <Loader2 size={28} className="text-primary" />
            </motion.div>
            <p className="text-sm text-foreground font-medium mt-3">Looking up product…</p>
          </motion.div>
        )}

        {/* Idle state */}
        {!cameraActive && !isLookingUp && (
          <div className="absolute inset-0 flex flex-col items-center justify-center z-10">
            {/* Corner brackets */}
            <div className="absolute inset-6 pointer-events-none">
              <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-foreground/20 rounded-tl-xl" />
              <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-foreground/20 rounded-tr-xl" />
              <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-foreground/20 rounded-bl-xl" />
              <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-foreground/20 rounded-br-xl" />
            </div>

            {/* Scanning line */}
            <motion.div
              animate={{ y: [-40, 40, -40] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              className="absolute left-10 right-10 h-[1px] bg-gradient-to-r from-transparent via-primary/40 to-transparent"
            />

            <div className="flex flex-col items-center gap-4 z-20">
              <motion.button
                whileTap={{ scale: 0.95 }}
                whileHover={{ scale: 1.02 }}
                onClick={startCamera}
                className="bg-foreground text-background rounded-full px-7 py-3.5 flex items-center gap-2.5 font-semibold text-sm shadow-elevated"
              >
                <Camera size={18} /> Start Scanning
              </motion.button>

              <button
                onClick={() => setShowManualInput(!showManualInput)}
                className="text-xs text-muted-foreground font-medium flex items-center gap-1 hover:text-foreground transition-colors"
              >
                <Barcode size={13} /> Enter barcode manually
              </button>

              {cameraError && (
                <p className="text-xs text-destructive/80 text-center px-6">
                  Camera unavailable. Check permissions.
                </p>
              )}
            </div>
          </div>
        )}

        {/* Active camera overlay */}
        {cameraActive && !isLookingUp && (
          <>
            <div className="absolute inset-0 z-10 pointer-events-none">
              <div className="absolute inset-6">
                <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-primary/60 rounded-tl-xl" />
                <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-primary/60 rounded-tr-xl" />
                <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-primary/60 rounded-bl-xl" />
                <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-primary/60 rounded-br-xl" />
              </div>
              <motion.div
                animate={{ y: [24, 170, 24] }}
                transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
                className="absolute left-10 right-10 h-[1px] bg-gradient-to-r from-transparent via-primary to-transparent shadow-[0_0_8px_hsl(var(--primary)/0.3)]"
              />
            </div>
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={stopCamera}
              className="absolute top-4 right-4 z-20 w-9 h-9 bg-background/60 backdrop-blur-xl text-foreground rounded-full flex items-center justify-center"
            >
              <X size={16} />
            </motion.button>
            <div className="absolute bottom-4 left-4 right-4 z-20">
              <div className="bg-background/60 backdrop-blur-xl rounded-full px-4 py-2 flex items-center gap-2.5 w-fit mx-auto">
                <motion.div
                  animate={{ opacity: [1, 0.3, 1] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                  className="w-1.5 h-1.5 rounded-full bg-primary"
                />
                <p className="text-xs text-foreground font-medium">Scanning…</p>
              </div>
            </div>
          </>
        )}
      </div>

      {/* ── Manual barcode input (collapsible) ── */}
      <AnimatePresence>
        {showManualInput && !cameraActive && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="mx-5 mt-3">
              <form onSubmit={(e) => { e.preventDefault(); handleManualLookup(); }} className="flex gap-2">
                <div className="flex-1 relative">
                  <input
                    type="text"
                    inputMode="numeric"
                    value={manualBarcode}
                    onChange={(e) => setManualBarcode(e.target.value)}
                    placeholder="Enter barcode…"
                    className="w-full bg-foreground/[0.03] rounded-full pl-4 pr-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                    disabled={isLookingUp}
                    autoFocus
                  />
                </div>
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  type="submit"
                  disabled={isLookingUp || !manualBarcode.trim()}
                  className="bg-foreground text-background rounded-full w-11 h-11 flex items-center justify-center disabled:opacity-30"
                >
                  <Search size={16} />
                </motion.button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error message */}
      <AnimatePresence>
        {lookupError && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mx-5 mt-2"
          >
            <p className="text-xs text-destructive bg-destructive/5 rounded-full py-2 px-4 text-center">
              {lookupError}
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Content area ── */}
      <div className="flex-1 overflow-y-auto px-4 pt-3 pb-24">

        {/* Added feedback toast */}
        <AnimatePresence>
          {showAddedFeedback && (
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              className="flex items-center gap-2 bg-foreground text-background rounded-full px-4 py-2.5 mb-4 w-fit mx-auto shadow-elevated"
            >
              <Sparkles size={14} />
              <span className="text-xs font-semibold">Added to cart</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Last scanned product */}
        <AnimatePresence mode="popLayout">
          {lastScanned && (
            <motion.div
              key={`detail-${lastScanned.id}`}
              initial={{ opacity: 0, y: 20, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="bg-card rounded-3xl p-5 mb-4 border border-border/50"
              style={{ boxShadow: "0 2px 20px -4px hsl(var(--foreground) / 0.06)" }}
            >
              <div className="flex items-start gap-4">
                <div className="w-[72px] h-[72px] rounded-2xl overflow-hidden bg-muted/40 flex-shrink-0 flex items-center justify-center">
                  <img
                    src={lastScanned.image}
                    alt={lastScanned.name}
                    className="w-full h-full object-contain p-1.5"
                    onError={(e) => { (e.target as HTMLImageElement).src = '/placeholder.svg'; }}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-[15px] text-foreground leading-tight line-clamp-2">{lastScanned.name}</h3>
                  {lastScanned.brand && (
                    <p className="text-xs text-muted-foreground mt-0.5">{lastScanned.brand}</p>
                  )}
                  <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                    {lastScanned.weight && (
                      <span className="text-[10px] text-muted-foreground bg-muted/60 rounded-full px-2.5 py-0.5">{lastScanned.weight}</span>
                    )}
                    {lastScanned.nutriScore && (
                      <span className={`text-[10px] font-bold text-white rounded-full px-2.5 py-0.5 uppercase ${nutriScoreColors[lastScanned.nutriScore.toLowerCase()] || "bg-muted-foreground"}`}>
                        {lastScanned.nutriScore.toUpperCase()}
                      </span>
                    )}
                  </div>
                  <p className="text-xl font-black text-foreground mt-2">${lastScanned.price.toFixed(2)}</p>
                </div>
              </div>

              {/* Nutrition pills */}
              {lastScanned.nutrition && (
                <div className="flex gap-1.5 mt-4 overflow-x-auto pb-1 scrollbar-hide">
                  <NutritionPill label="Cal" value={lastScanned.nutrition.calories} unit="" />
                  <NutritionPill label="Fat" value={lastScanned.nutrition.fat} unit="g" />
                  <NutritionPill label="Sugar" value={lastScanned.nutrition.sugars} unit="g" />
                  <NutritionPill label="Protein" value={lastScanned.nutrition.protein} unit="g" />
                  <NutritionPill label="Salt" value={lastScanned.nutrition.salt} unit="g" />
                </div>
              )}

              {/* Ingredients toggle */}
              {lastScanned.ingredients && (
                <>
                  <button
                    onClick={() => setExpandedNutrition(!expandedNutrition)}
                    className="w-full mt-3 flex items-center justify-between text-xs text-muted-foreground hover:text-foreground transition-colors py-1.5"
                  >
                    <span className="flex items-center gap-1.5"><Leaf size={12} /> Ingredients</span>
                    <motion.div animate={{ rotate: expandedNutrition ? 180 : 0 }}>
                      <ChevronDown size={14} />
                    </motion.div>
                  </button>
                  <AnimatePresence>
                    {expandedNutrition && (
                      <motion.p
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="text-[11px] text-muted-foreground leading-relaxed overflow-hidden"
                      >
                        {lastScanned.ingredients}
                      </motion.p>
                    )}
                  </AnimatePresence>
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Cart items */}
        {items.length > 0 && (
          <div className="mb-4">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-3">
              Your Cart
            </p>
            <div className="space-y-2">
              {items.map((item) => (
                <motion.div
                  key={item.product.id}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-3 bg-card rounded-2xl p-3 border border-border/50"
                  style={{ boxShadow: "0 1px 8px -2px hsl(var(--foreground) / 0.04)" }}
                >
                  <div className="w-11 h-11 rounded-xl overflow-hidden bg-muted/40 flex-shrink-0">
                    <img
                      src={item.product.image}
                      alt={item.product.name}
                      className="w-full h-full object-contain p-0.5"
                      onError={(e) => { (e.target as HTMLImageElement).src = '/placeholder.svg'; }}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-[13px] font-semibold text-foreground truncate">{item.product.name}</h4>
                    <p className="text-xs text-muted-foreground">
                      ${item.product.price.toFixed(2)} {item.quantity > 1 && `× ${item.quantity}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <p className="text-sm font-bold text-foreground mr-2">${(item.product.price * item.quantity).toFixed(2)}</p>
                    <button
                      onClick={() => removeItem(item.product.id)}
                      className="w-7 h-7 rounded-full bg-foreground/5 flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Summary */}
            <div className="mt-4 bg-foreground/[0.02] rounded-2xl p-4 space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="font-medium text-foreground">${total.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Tax</span>
                <span className="font-medium text-foreground">${tax.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm font-bold pt-2 border-t border-border/50">
                <span className="text-foreground">Total</span>
                <span className="text-foreground">${grandTotal.toFixed(2)}</span>
              </div>
            </div>

            {/* Checkout button */}
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={onOpenBag}
              className="w-full mt-4 bg-foreground text-background rounded-full py-4 font-semibold text-[15px] shadow-elevated"
            >
              Checkout · ${grandTotal.toFixed(2)}
            </motion.button>
          </div>
        )}

        {/* Empty state */}
        {items.length === 0 && !lastScanned && (
          <div className="flex flex-col items-center justify-center pt-12 text-center">
            <div className="w-16 h-16 rounded-full bg-foreground/[0.03] flex items-center justify-center mb-4">
              <Barcode size={28} className="text-muted-foreground/40" />
            </div>
            <p className="text-sm font-semibold text-foreground">Ready to scan</p>
            <p className="text-xs text-muted-foreground mt-1 max-w-[200px]">
              Point your camera at a barcode to get started
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ScanScreen;
