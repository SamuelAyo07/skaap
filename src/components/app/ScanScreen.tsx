import { useState, useEffect, useRef, useCallback } from "react";
import { ShoppingBag, Plus, Camera, CameraOff, Search, Loader2, Package, Barcode } from "lucide-react";
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
        {
          fps: 15,
          qrbox: { width: 280, height: 160 },
          aspectRatio: 1.333,
        },
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
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-14 pb-2">
        <div>
          <h1 className="text-xl font-bold text-foreground">Scan & Shop</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Point camera at any barcode</p>
        </div>
        <button onClick={onOpenBag} className="relative p-2.5 bg-card rounded-xl border border-border">
          <ShoppingBag size={20} className="text-foreground" />
          {itemCount > 0 && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center shadow-lg"
            >
              {itemCount}
            </motion.span>
          )}
        </button>
      </div>

      {/* Camera viewfinder */}
      <div className="mx-4 rounded-2xl overflow-hidden relative bg-secondary/80 aspect-[4/3] border border-border shadow-sm">
        <div id="scanner-container" className="w-full h-full [&>video]:object-cover" />

        {/* Loading overlay */}
        {isLookingUp && (
          <div className="absolute inset-0 bg-background/90 backdrop-blur-md flex flex-col items-center justify-center z-30">
            <div className="bg-card rounded-2xl p-6 flex flex-col items-center shadow-lg border border-border">
              <Loader2 size={28} className="text-primary animate-spin mb-3" />
              <p className="text-sm text-foreground font-semibold">Looking up product…</p>
              <p className="text-xs text-muted-foreground mt-1">Searching Open Food Facts</p>
            </div>
          </div>
        )}

        {!cameraActive && !isLookingUp && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-secondary z-10">
            {/* Corner brackets */}
            <div className="absolute inset-5 rounded-xl">
              <div className="absolute top-0 left-0 w-10 h-10 rounded-tl-lg" style={{ borderWidth: '3px 0 0 3px', borderStyle: 'solid', borderColor: 'hsl(var(--primary))' }} />
              <div className="absolute top-0 right-0 w-10 h-10 rounded-tr-lg" style={{ borderWidth: '3px 3px 0 0', borderStyle: 'solid', borderColor: 'hsl(var(--primary))' }} />
              <div className="absolute bottom-0 left-0 w-10 h-10 rounded-bl-lg" style={{ borderWidth: '0 0 3px 3px', borderStyle: 'solid', borderColor: 'hsl(var(--primary))' }} />
              <div className="absolute bottom-0 right-0 w-10 h-10 rounded-br-lg" style={{ borderWidth: '0 3px 3px 0', borderStyle: 'solid', borderColor: 'hsl(var(--primary))' }} />
            </div>
            {/* Scan line animation */}
            <motion.div
              animate={{ y: [-50, 50, -50] }}
              transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
              className="absolute left-8 right-8 h-0.5 bg-gradient-to-r from-transparent via-primary/60 to-transparent rounded-full z-20"
            />
            <div className="flex flex-col items-center gap-3 z-30">
              <div className="bg-card/80 backdrop-blur-sm rounded-full p-4 mb-2 border border-border">
                <Camera size={28} className="text-primary" />
              </div>
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={startCamera}
                className="bg-primary text-primary-foreground rounded-2xl px-7 py-3.5 flex items-center gap-2.5 font-semibold text-sm shadow-lg shadow-primary/25"
              >
                <Camera size={18} /> Open Camera
              </motion.button>
              {cameraError && (
                <p className="text-xs text-destructive text-center px-8 bg-destructive/10 rounded-lg py-2 mx-4">
                  Camera access denied. Please allow camera permissions.
                </p>
              )}
            </div>
          </div>
        )}

        {cameraActive && !isLookingUp && (
          <>
            <div className="absolute inset-0 z-10 pointer-events-none">
              <div className="absolute inset-5 rounded-xl">
                <div className="absolute top-0 left-0 w-10 h-10 rounded-tl-lg" style={{ borderWidth: '3px 0 0 3px', borderStyle: 'solid', borderColor: 'hsl(var(--primary))' }} />
                <div className="absolute top-0 right-0 w-10 h-10 rounded-tr-lg" style={{ borderWidth: '3px 3px 0 0', borderStyle: 'solid', borderColor: 'hsl(var(--primary))' }} />
                <div className="absolute bottom-0 left-0 w-10 h-10 rounded-bl-lg" style={{ borderWidth: '0 0 3px 3px', borderStyle: 'solid', borderColor: 'hsl(var(--primary))' }} />
                <div className="absolute bottom-0 right-0 w-10 h-10 rounded-br-lg" style={{ borderWidth: '0 3px 3px 0', borderStyle: 'solid', borderColor: 'hsl(var(--primary))' }} />
              </div>
              <motion.div
                animate={{ y: [20, 180, 20] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                className="absolute left-8 right-8 h-0.5 bg-gradient-to-r from-transparent via-primary/80 to-transparent rounded-full shadow-[0_0_12px_hsl(var(--primary)/0.4)]"
              />
            </div>
            <button
              onClick={stopCamera}
              className="absolute top-3 right-3 z-20 bg-card/90 backdrop-blur-sm text-foreground p-2.5 rounded-xl border border-border shadow-sm"
            >
              <CameraOff size={16} />
            </button>
            <div className="absolute bottom-3 left-3 right-3 z-20">
              <div className="bg-card/90 backdrop-blur-sm rounded-xl px-3 py-2 flex items-center gap-2 border border-border">
                <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                <p className="text-xs text-foreground font-medium">Camera active — scanning for barcodes</p>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Manual barcode input */}
      <div className="mx-4 mt-3">
        <form
          onSubmit={(e) => { e.preventDefault(); handleManualLookup(); }}
          className="flex gap-2"
        >
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
            className="bg-primary text-primary-foreground rounded-xl px-4 py-2.5 flex items-center gap-1.5 text-sm font-semibold disabled:opacity-40 shadow-sm"
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
              className="text-xs text-destructive mt-2 px-1 bg-destructive/5 rounded-lg py-1.5 px-3"
            >
              {lookupError}
            </motion.p>
          )}
        </AnimatePresence>
      </div>

      {/* Scanned items list */}
      <div className="flex-1 overflow-y-auto px-4 pt-3 pb-24">
        <AnimatePresence mode="popLayout">
          {lastScanned && (
            <motion.div
              key={`last-${lastScanned.id}`}
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-card rounded-2xl shadow-sm p-4 mb-3 border border-border"
            >
              <div className="flex items-start gap-3">
                <div className="w-16 h-16 rounded-xl overflow-hidden bg-muted flex-shrink-0 border border-border">
                  <img
                    src={lastScanned.image}
                    alt={lastScanned.name}
                    className="w-full h-full object-contain p-1"
                    onError={(e) => { (e.target as HTMLImageElement).src = '/placeholder.svg'; }}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <h3 className="font-semibold text-sm text-foreground line-clamp-2 leading-tight">{lastScanned.name}</h3>
                      {lastScanned.weight && (
                        <span className="inline-block mt-1 text-[11px] text-muted-foreground bg-muted/50 rounded-md px-2 py-0.5">{lastScanned.weight}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center justify-between mt-2.5">
                    {lastScanned.price > 0 ? (
                      <p className="text-sm font-bold text-primary">${lastScanned.price.toFixed(2)}</p>
                    ) : (
                      <span className="text-xs text-muted-foreground italic">Demo — no price</span>
                    )}
                    <motion.button
                      whileTap={{ scale: 0.9 }}
                      onClick={() => handleAddToBag(lastScanned)}
                      className="bg-primary text-primary-foreground rounded-xl px-4 py-2 flex items-center gap-1.5 text-xs font-semibold shadow-sm"
                    >
                      <AnimatePresence mode="wait">
                        {showAddedFeedback === lastScanned.id ? (
                          <motion.span key="added" initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -10, opacity: 0 }}>✓ Added</motion.span>
                        ) : (
                          <motion.span key="add" initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -10, opacity: 0 }} className="flex items-center gap-1">
                            <Plus size={14} /> Add to Bag
                          </motion.span>
                        )}
                      </AnimatePresence>
                    </motion.button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Previously scanned */}
        {scannedProducts.filter(p => p.id !== lastScanned?.id).length > 0 && (
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 mt-1">Previously scanned</p>
        )}
        {scannedProducts.filter(p => p.id !== lastScanned?.id).map((product, i) => (
          <motion.div
            key={product.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.05 }}
            className="flex items-center gap-3 py-3 border-b border-border/50 last:border-0"
          >
            <div className="w-11 h-11 rounded-lg overflow-hidden bg-muted flex-shrink-0 border border-border">
              <img
                src={product.image}
                alt={product.name}
                className="w-full h-full object-contain p-0.5"
                onError={(e) => { (e.target as HTMLImageElement).src = '/placeholder.svg'; }}
              />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-medium text-sm text-foreground truncate">{product.name}</h3>
              {product.weight && <p className="text-xs text-muted-foreground">{product.weight}</p>}
            </div>
            <motion.button
              whileTap={{ scale: 0.85 }}
              onClick={() => handleAddToBag(product)}
              className="text-primary p-2 rounded-xl hover:bg-primary/10 transition-colors"
            >
              {showAddedFeedback === product.id ? (
                <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} className="text-xs font-bold">✓</motion.span>
              ) : (
                <Plus size={18} />
              )}
            </motion.button>
          </motion.div>
        ))}

        {scannedProducts.length === 0 && !lastScanned && (
          <div className="flex flex-col items-center justify-center pt-10 text-muted-foreground">
            <div className="bg-muted/50 rounded-2xl p-5 mb-4">
              <Package size={36} className="opacity-40" />
            </div>
            <p className="text-sm font-medium">No products scanned yet</p>
            <p className="text-xs mt-1 text-muted-foreground/70">Open camera or enter a barcode above</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ScanScreen;
