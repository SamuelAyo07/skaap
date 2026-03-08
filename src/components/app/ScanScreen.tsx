import { useState, useEffect, useRef, useCallback } from "react";
import {
  ShoppingBag, Plus, Camera, CameraOff, Search, Loader2,
  Package, Barcode, Trash2, ChevronDown, ChevronUp, Leaf, Flame, Droplets
} from "lucide-react";
import { Product } from "@/data/products";
import { useCart } from "@/context/CartContext";
import { motion, AnimatePresence } from "framer-motion";
import { Html5Qrcode, Html5QrcodeSupportedFormats } from "html5-qrcode";
import { lookupBarcode } from "@/lib/openfoodfacts";

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

const NutritionBadge = ({ label, value, unit }: { label: string; value?: number; unit: string }) => {
  if (value == null) return null;
  return (
    <div className="flex flex-col items-center bg-muted rounded-lg px-2 py-1.5 min-w-[54px]">
      <span className="text-xs font-bold text-foreground">{Math.round(value)}</span>
      <span className="text-[9px] text-muted-foreground">{unit}</span>
      <span className="text-[9px] text-muted-foreground mt-0.5">{label}</span>
    </div>
  );
};

const ScanScreen = ({ onOpenBag }: ScanScreenProps) => {
  const { addItem, removeItem, items, itemCount, total } = useCart();
  const [lastScanned, setLastScanned] = useState<Product | null>(null);
  const [expandedNutrition, setExpandedNutrition] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState(false);
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

    // Stop camera when barcode detected
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
      // Signal auto-restart
      autoRestartRef.current = true;
    } else {
      setLookupError(`No product found for barcode: ${barcode}`);
    }

    setIsLookingUp(false);
    setTimeout(() => processedBarcodesRef.current.delete(barcode), 3000);
  }, [handleProductFound, addItem]);

  const handleManualLookup = useCallback(async () => {
    const barcode = manualBarcode.trim();
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
    if (scannerRef.current || isStartingRef.current) return;
    isStartingRef.current = true;
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
      await scanner.start(
        { facingMode: "environment" },
        { fps: 15, qrbox: { width: 280, height: 160 }, aspectRatio: 1.333 },
        handleBarcodeScan,
        () => {}
      );
      setCameraActive(true);
      setCameraError(false);
    } catch {
      setCameraError(true);
      setCameraActive(false);
      scannerRef.current = null;
    }
    isStartingRef.current = false;
  }, [handleBarcodeScan]);

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

  // Auto-restart camera after a scan
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
      {/* Header */}
      <div className="px-5 pt-14 pb-2">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-extrabold text-secondary tracking-tight">SKAAP</h1>
            <p className="text-[10px] text-muted-foreground font-medium tracking-wide mt-0.5">
              Scan it. Skip the line. Escape the wait.
            </p>
          </div>
          <button onClick={onOpenBag} className="relative p-2.5 bg-secondary text-secondary-foreground rounded-xl">
            <ShoppingBag size={20} />
            {itemCount > 0 && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center"
              >
                {itemCount}
              </motion.span>
            )}
          </button>
        </div>
      </div>

      {/* Camera viewfinder */}
      <div className="mx-4 rounded-2xl overflow-hidden relative bg-secondary aspect-[4/3] border border-border">
        <div id="scanner-container" className="w-full h-full [&>video]:object-cover" />

        {isLookingUp && (
          <div className="absolute inset-0 bg-secondary/95 backdrop-blur-md flex flex-col items-center justify-center z-30">
            <Loader2 size={32} className="text-primary animate-spin mb-3" />
            <p className="text-sm text-secondary-foreground font-semibold">Looking up product…</p>
          </div>
        )}

        {!cameraActive && !isLookingUp && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-secondary z-10">
            <div className="absolute inset-5 rounded-xl pointer-events-none">
              <div className="absolute top-0 left-0 w-10 h-10 rounded-tl-lg border-t-[3px] border-l-[3px] border-primary" />
              <div className="absolute top-0 right-0 w-10 h-10 rounded-tr-lg border-t-[3px] border-r-[3px] border-primary" />
              <div className="absolute bottom-0 left-0 w-10 h-10 rounded-bl-lg border-b-[3px] border-l-[3px] border-primary" />
              <div className="absolute bottom-0 right-0 w-10 h-10 rounded-br-lg border-b-[3px] border-r-[3px] border-primary" />
            </div>
            <motion.div
              animate={{ y: [-50, 50, -50] }}
              transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
              className="absolute left-8 right-8 h-0.5 bg-gradient-to-r from-transparent via-primary/60 to-transparent rounded-full z-20"
            />
            <div className="flex flex-col items-center gap-3 z-30">
              <div className="bg-secondary-foreground/10 backdrop-blur-sm rounded-full p-4 mb-1">
                <Camera size={28} className="text-primary" />
              </div>
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={startCamera}
                className="bg-primary text-primary-foreground rounded-2xl px-7 py-3.5 flex items-center gap-2.5 font-bold text-sm shadow-lg"
              >
                <Camera size={18} /> Scan with Camera
              </motion.button>
              {cameraError && (
                <p className="text-xs text-primary-foreground/80 text-center px-6 bg-primary/20 rounded-lg py-2">
                  Camera access denied. Allow permissions.
                </p>
              )}
            </div>
          </div>
        )}

        {cameraActive && !isLookingUp && (
          <>
            <div className="absolute inset-0 z-10 pointer-events-none">
              <div className="absolute inset-5 rounded-xl">
                <div className="absolute top-0 left-0 w-10 h-10 rounded-tl-lg border-t-[3px] border-l-[3px] border-primary" />
                <div className="absolute top-0 right-0 w-10 h-10 rounded-tr-lg border-t-[3px] border-r-[3px] border-primary" />
                <div className="absolute bottom-0 left-0 w-10 h-10 rounded-bl-lg border-b-[3px] border-l-[3px] border-primary" />
                <div className="absolute bottom-0 right-0 w-10 h-10 rounded-br-lg border-b-[3px] border-r-[3px] border-primary" />
              </div>
              <motion.div
                animate={{ y: [20, 180, 20] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                className="absolute left-8 right-8 h-0.5 bg-gradient-to-r from-transparent via-primary/80 to-transparent rounded-full shadow-[0_0_12px_hsl(var(--primary)/0.4)]"
              />
            </div>
            <button
              onClick={stopCamera}
              className="absolute top-3 right-3 z-20 bg-secondary-foreground/20 backdrop-blur-sm text-secondary-foreground p-2.5 rounded-xl"
            >
              <CameraOff size={16} />
            </button>
            <div className="absolute bottom-3 left-3 right-3 z-20">
              <div className="bg-secondary-foreground/10 backdrop-blur-sm rounded-xl px-3 py-2 flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                <p className="text-xs text-secondary-foreground font-medium">Scanning for barcodes…</p>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Manual barcode input */}
      <div className="mx-4 mt-3">
        <form onSubmit={(e) => { e.preventDefault(); handleManualLookup(); }} className="flex gap-2">
          <div className="flex-1 relative">
            <Barcode size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              inputMode="numeric"
              value={manualBarcode}
              onChange={(e) => setManualBarcode(e.target.value)}
              placeholder="Enter barcode number…"
              className="w-full bg-card border border-border rounded-xl pl-10 pr-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/30 transition-all"
              disabled={isLookingUp}
            />
          </div>
          <motion.button
            whileTap={{ scale: 0.95 }}
            type="submit"
            disabled={isLookingUp || !manualBarcode.trim()}
            className="bg-primary text-primary-foreground rounded-xl px-4 py-2.5 flex items-center gap-1.5 text-sm font-semibold disabled:opacity-40"
          >
            <Search size={16} /> Look up
          </motion.button>
        </form>
        <AnimatePresence>
          {lookupError && (
            <motion.p
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="text-xs text-destructive mt-2 bg-destructive/5 rounded-lg py-1.5 px-3"
            >
              {lookupError}
            </motion.p>
          )}
        </AnimatePresence>
      </div>

      {/* Content area */}
      <div className="flex-1 overflow-y-auto px-4 pt-3 pb-24">
        {/* Last scanned product detail */}
        <AnimatePresence mode="popLayout">
          {lastScanned && (
            <motion.div
              key={`detail-${lastScanned.id}`}
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-card rounded-2xl shadow-card p-4 mb-4 border border-border"
            >
              <div className="flex items-start gap-3">
                <div className="w-20 h-20 rounded-xl overflow-hidden bg-muted flex-shrink-0 border border-border">
                  <img
                    src={lastScanned.image}
                    alt={lastScanned.name}
                    className="w-full h-full object-contain p-1"
                    onError={(e) => { (e.target as HTMLImageElement).src = '/placeholder.svg'; }}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-sm text-foreground line-clamp-2 leading-tight">{lastScanned.name}</h3>
                  {lastScanned.brand && (
                    <p className="text-xs text-muted-foreground mt-0.5">{lastScanned.brand}</p>
                  )}
                  <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                    {lastScanned.weight && (
                      <span className="text-[10px] text-muted-foreground bg-muted rounded-md px-2 py-0.5">{lastScanned.weight}</span>
                    )}
                    {lastScanned.nutriScore && (
                      <span className={`text-[10px] font-bold text-white rounded-md px-2 py-0.5 uppercase ${nutriScoreColors[lastScanned.nutriScore.toLowerCase()] || "bg-muted-foreground"}`}>
                        Nutri-Score {lastScanned.nutriScore.toUpperCase()}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <p className="text-lg font-extrabold text-primary">${lastScanned.price.toFixed(2)}</p>
                    <span className="text-[10px] text-muted-foreground bg-success/10 text-success font-semibold rounded-md px-2 py-0.5">
                      ✓ Added to cart
                    </span>
                  </div>
                </div>
              </div>

              {/* Nutrition row */}
              {lastScanned.nutrition && (
                <div className="mt-3">
                  <div className="flex gap-1.5 overflow-x-auto pb-1">
                    <NutritionBadge label="Cal" value={lastScanned.nutrition.calories} unit="kcal" />
                    <NutritionBadge label="Fat" value={lastScanned.nutrition.fat} unit="g" />
                    <NutritionBadge label="Sugar" value={lastScanned.nutrition.sugars} unit="g" />
                    <NutritionBadge label="Protein" value={lastScanned.nutrition.protein} unit="g" />
                    <NutritionBadge label="Salt" value={lastScanned.nutrition.salt} unit="g" />
                  </div>
                </div>
              )}

              {/* Expandable ingredients */}
              {lastScanned.ingredients && (
                <button
                  onClick={() => setExpandedNutrition(!expandedNutrition)}
                  className="w-full mt-2 flex items-center justify-between text-xs text-muted-foreground hover:text-foreground transition-colors py-1"
                >
                  <span className="flex items-center gap-1"><Leaf size={12} /> Ingredients</span>
                  {expandedNutrition ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                </button>
              )}
              <AnimatePresence>
                {expandedNutrition && lastScanned.ingredients && (
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
            </motion.div>
          )}
        </AnimatePresence>

        {/* Running cart */}
        {items.length > 0 && (
          <div className="mb-4">
            <p className="text-xs font-bold text-secondary uppercase tracking-wider mb-2">
              Cart ({itemCount} {itemCount === 1 ? "item" : "items"})
            </p>
            <div className="bg-card rounded-2xl border border-border overflow-hidden">
              {items.map((item, i) => (
                <div key={item.product.id} className={`flex items-center gap-3 p-3 ${i > 0 ? "border-t border-border" : ""}`}>
                  <div className="w-10 h-10 rounded-lg overflow-hidden bg-muted flex-shrink-0 border border-border">
                    <img
                      src={item.product.image}
                      alt={item.product.name}
                      className="w-full h-full object-contain p-0.5"
                      onError={(e) => { (e.target as HTMLImageElement).src = '/placeholder.svg'; }}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-xs font-semibold text-foreground truncate">{item.product.name}</h4>
                    {item.product.brand && <p className="text-[10px] text-muted-foreground truncate">{item.product.brand}</p>}
                  </div>
                  <div className="text-right flex items-center gap-2">
                    <div>
                      <p className="text-sm font-bold text-primary">${(item.product.price * item.quantity).toFixed(2)}</p>
                      {item.quantity > 1 && <p className="text-[10px] text-muted-foreground">×{item.quantity}</p>}
                    </div>
                    <button
                      onClick={() => removeItem(item.product.id)}
                      className="p-1.5 text-muted-foreground hover:text-destructive transition-colors rounded-lg hover:bg-destructive/10"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}

              {/* Summary */}
              <div className="border-t border-border bg-muted/50 p-3 space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="font-medium text-foreground">${total.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Tax</span>
                  <span className="font-medium text-foreground">${tax.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm font-bold pt-1 border-t border-border">
                  <span className="text-foreground">Total</span>
                  <span className="text-primary">${grandTotal.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Checkout */}
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={onOpenBag}
              className="w-full mt-3 bg-primary text-primary-foreground rounded-2xl py-3.5 font-bold text-sm shadow-lg"
            >
              Checkout · ${grandTotal.toFixed(2)}
            </motion.button>
          </div>
        )}

        {items.length === 0 && !lastScanned && (
          <div className="flex flex-col items-center justify-center pt-10 text-muted-foreground">
            <div className="bg-muted/50 rounded-2xl p-5 mb-4">
              <Package size={36} className="opacity-40" />
            </div>
            <p className="text-sm font-medium">No products scanned yet</p>
            <p className="text-xs mt-1 text-muted-foreground/70">Tap "Scan with Camera" or enter a barcode</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ScanScreen;
