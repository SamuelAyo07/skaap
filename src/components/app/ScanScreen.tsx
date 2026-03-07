import { useState, useEffect, useRef, useCallback } from "react";
import { ShoppingBag, Plus, Zap, Camera, CameraOff, Search, Loader2 } from "lucide-react";
import { Product } from "@/data/products";
import { useCart } from "@/context/CartContext";
import { motion, AnimatePresence } from "framer-motion";
import { Html5Qrcode } from "html5-qrcode";
import { lookupBarcode } from "@/lib/openfoodfacts";

interface ScanScreenProps {
  onOpenBag: () => void;
}

const ScanScreen = ({ onOpenBag }: ScanScreenProps) => {
  const { addItem, itemCount } = useCart();
  const [scannedProducts, setScannedProducts] = useState<Product[]>([]);
  const [lastScanned, setLastScanned] = useState<Product | null>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState(false);
  const [showAddedFeedback, setShowAddedFeedback] = useState<string | null>(null);
  const [manualBarcode, setManualBarcode] = useState("");
  const [isLookingUp, setIsLookingUp] = useState(false);
  const [lookupError, setLookupError] = useState<string | null>(null);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const isStartingRef = useRef(false);
  const processedBarcodesRef = useRef<Set<string>>(new Set());

  const handleProductFound = useCallback((product: Product) => {
    setLastScanned(product);
    setScannedProducts((prev) => {
      if (prev.find((s) => s.id === product.id)) return prev;
      return [product, ...prev];
    });
    setLookupError(null);
  }, []);

  const handleBarcodeScan = useCallback(async (decodedText: string) => {
    const barcode = decodedText.trim();
    if (!barcode || processedBarcodesRef.current.has(barcode)) return;
    processedBarcodesRef.current.add(barcode);

    // Pause scanner while looking up
    if (scannerRef.current) {
      scannerRef.current.pause(true);
    }

    setIsLookingUp(true);
    setLookupError(null);

    const product = await lookupBarcode(barcode);
    if (product) {
      handleProductFound(product);
    } else {
      setLookupError(`No product found for barcode: ${barcode}`);
    }

    setIsLookingUp(false);

    // Resume scanning after delay
    setTimeout(() => {
      processedBarcodesRef.current.delete(barcode);
      try { scannerRef.current?.resume(); } catch {}
    }, 3000);
  }, [handleProductFound]);

  const handleManualLookup = useCallback(async () => {
    const barcode = manualBarcode.trim();
    if (!barcode) return;

    setIsLookingUp(true);
    setLookupError(null);

    const product = await lookupBarcode(barcode);
    if (product) {
      handleProductFound(product);
      setManualBarcode("");
    } else {
      setLookupError(`No product found for barcode: ${barcode}`);
    }
    setIsLookingUp(false);
  }, [manualBarcode, handleProductFound]);

  const startCamera = useCallback(async () => {
    if (scannerRef.current || isStartingRef.current) return;
    isStartingRef.current = true;
    try {
      const scanner = new Html5Qrcode("scanner-container");
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

  useEffect(() => {
    return () => { stopCamera(); };
  }, [stopCamera]);

  const handleAddToBag = (product: Product) => {
    addItem(product);
    setShowAddedFeedback(product.id);
    setTimeout(() => setShowAddedFeedback(null), 1200);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-14 pb-3">
        <h1 className="text-xl font-bold text-foreground">Scan your product</h1>
        <button onClick={onOpenBag} className="relative p-2">
          <ShoppingBag size={22} className="text-foreground" />
          {itemCount > 0 && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute -top-0.5 -right-0.5 bg-primary text-primary-foreground text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center"
            >
              {itemCount}
            </motion.span>
          )}
        </button>
      </div>

      {/* Camera viewfinder */}
      <div className="mx-5 rounded-2xl overflow-hidden relative bg-secondary aspect-[4/3]">
        <div id="scanner-container" className="w-full h-full" />

        {/* Loading overlay */}
        {isLookingUp && (
          <div className="absolute inset-0 bg-secondary/80 backdrop-blur-sm flex flex-col items-center justify-center z-30">
            <Loader2 size={32} className="text-primary animate-spin mb-2" />
            <p className="text-sm text-foreground font-medium">Looking up product…</p>
          </div>
        )}

        {!cameraActive && !isLookingUp && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-secondary z-10">
            <div className="absolute inset-4 border-2 border-primary-foreground/20 rounded-xl">
              <div className="absolute top-0 left-0 w-8 h-8" style={{ borderWidth: '3px 0 0 3px', borderStyle: 'solid', borderColor: 'hsl(var(--primary))' }} />
              <div className="absolute top-0 right-0 w-8 h-8" style={{ borderWidth: '3px 3px 0 0', borderStyle: 'solid', borderColor: 'hsl(var(--primary))' }} />
              <div className="absolute bottom-0 left-0 w-8 h-8" style={{ borderWidth: '0 0 3px 3px', borderStyle: 'solid', borderColor: 'hsl(var(--primary))' }} />
              <div className="absolute bottom-0 right-0 w-8 h-8" style={{ borderWidth: '0 3px 3px 0', borderStyle: 'solid', borderColor: 'hsl(var(--primary))' }} />
            </div>
            <motion.div
              animate={{ y: [-60, 60, -60] }}
              transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
              className="absolute left-6 right-6 h-0.5 bg-primary/60 rounded-full z-20"
            />
            <div className="flex flex-col items-center gap-3 z-30">
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={startCamera}
                className="bg-primary text-primary-foreground rounded-2xl px-6 py-3.5 flex items-center gap-2 font-semibold text-sm shadow-lg shadow-primary/25"
              >
                <Camera size={18} /> Open Camera
              </motion.button>
              {cameraError && (
                <p className="text-xs text-primary-foreground/60 text-center px-8">
                  Camera access denied or unavailable.
                </p>
              )}
            </div>
          </div>
        )}

        {cameraActive && !isLookingUp && (
          <>
            <div className="absolute inset-0 z-10 pointer-events-none">
              <div className="absolute inset-4 border-2 border-primary-foreground/20 rounded-xl">
                <div className="absolute top-0 left-0 w-8 h-8" style={{ borderWidth: '3px 0 0 3px', borderStyle: 'solid', borderColor: 'hsl(var(--primary))' }} />
                <div className="absolute top-0 right-0 w-8 h-8" style={{ borderWidth: '3px 3px 0 0', borderStyle: 'solid', borderColor: 'hsl(var(--primary))' }} />
                <div className="absolute bottom-0 left-0 w-8 h-8" style={{ borderWidth: '0 0 3px 3px', borderStyle: 'solid', borderColor: 'hsl(var(--primary))' }} />
                <div className="absolute bottom-0 right-0 w-8 h-8" style={{ borderWidth: '0 3px 3px 0', borderStyle: 'solid', borderColor: 'hsl(var(--primary))' }} />
              </div>
              <motion.div
                animate={{ y: [20, 200, 20] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                className="absolute left-6 right-6 h-0.5 bg-primary/80 rounded-full shadow-[0_0_8px_hsl(var(--primary)/0.5)]"
              />
            </div>
            <button
              onClick={stopCamera}
              className="absolute top-3 right-3 z-20 bg-secondary/80 backdrop-blur-sm text-primary-foreground p-2 rounded-xl"
            >
              <CameraOff size={16} />
            </button>
          </>
        )}
      </div>

      {/* Manual barcode input */}
      <div className="mx-5 mt-3">
        <form
          onSubmit={(e) => { e.preventDefault(); handleManualLookup(); }}
          className="flex gap-2"
        >
          <input
            type="text"
            inputMode="numeric"
            value={manualBarcode}
            onChange={(e) => setManualBarcode(e.target.value)}
            placeholder="Enter barcode number…"
            className="flex-1 bg-card border border-border rounded-xl px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
            disabled={isLookingUp}
          />
          <motion.button
            whileTap={{ scale: 0.95 }}
            type="submit"
            disabled={isLookingUp || !manualBarcode.trim()}
            className="bg-primary text-primary-foreground rounded-xl px-4 py-2.5 flex items-center gap-1.5 text-sm font-semibold disabled:opacity-50"
          >
            <Search size={16} /> Look up
          </motion.button>
        </form>
        {lookupError && (
          <p className="text-xs text-destructive mt-1.5 px-1">{lookupError}</p>
        )}
      </div>

      {/* Scanned items list */}
      <div className="flex-1 overflow-y-auto px-5 pt-4 pb-24">
        <AnimatePresence mode="popLayout">
          {lastScanned && (
            <motion.div
              key={`last-${lastScanned.id}`}
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-card rounded-2xl shadow-card p-3 mb-3 border border-border"
            >
              <div className="flex items-center gap-3">
                <img src={lastScanned.image} alt={lastScanned.name} className="w-14 h-14 rounded-xl object-cover bg-muted" />
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-sm text-foreground truncate">{lastScanned.name}</h3>
                  {lastScanned.weight && <p className="text-xs text-muted-foreground">{lastScanned.weight}</p>}
                  {lastScanned.price > 0 && <p className="text-sm font-bold text-primary">${lastScanned.price.toFixed(2)}ea</p>}
                </div>
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={() => handleAddToBag(lastScanned)}
                  className="bg-primary text-primary-foreground rounded-xl px-3 py-2 flex items-center gap-1 text-xs font-semibold relative overflow-hidden"
                >
                  <AnimatePresence mode="wait">
                    {showAddedFeedback === lastScanned.id ? (
                      <motion.span key="added" initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -10, opacity: 0 }}>✓ Added</motion.span>
                    ) : (
                      <motion.span key="add" initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -10, opacity: 0 }} className="flex items-center gap-1">
                        <Plus size={14} /> Add
                      </motion.span>
                    )}
                  </AnimatePresence>
                </motion.button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {scannedProducts.filter(p => p.id !== lastScanned?.id).map((product, i) => (
          <motion.div
            key={product.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.05 }}
            className="flex items-center gap-3 py-3 border-b border-border last:border-0"
          >
            <img src={product.image} alt={product.name} className="w-10 h-10 rounded-lg object-cover bg-muted" />
            <div className="flex-1 min-w-0">
              <h3 className="font-medium text-sm text-foreground truncate">{product.name}</h3>
              {product.weight && <p className="text-xs text-muted-foreground">{product.weight}</p>}
            </div>
            {product.price > 0 && <p className="text-sm font-bold text-primary">${product.price.toFixed(2)}</p>}
            <motion.button
              whileTap={{ scale: 0.85 }}
              onClick={() => handleAddToBag(product)}
              className="text-primary p-1.5 rounded-lg hover:bg-primary/10 transition-colors"
            >
              {showAddedFeedback === product.id ? (
                <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} className="text-xs font-bold">✓</motion.span>
              ) : (
                <Plus size={16} />
              )}
            </motion.button>
          </motion.div>
        ))}

        {scannedProducts.length === 0 && !lastScanned && (
          <div className="flex flex-col items-center justify-center pt-8 text-muted-foreground">
            <Zap size={32} className="mb-2 opacity-40" />
            <p className="text-sm">Scan a barcode or enter one above</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ScanScreen;
