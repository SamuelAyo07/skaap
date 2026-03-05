import { useState, useCallback } from "react";
import { ShoppingBag, ScanLine, Plus, Zap } from "lucide-react";
import { products, Product } from "@/data/products";
import { useCart } from "@/context/CartContext";

interface ScanScreenProps {
  onOpenBag: () => void;
}

const ScanScreen = ({ onOpenBag }: ScanScreenProps) => {
  const { addItem, itemCount } = useCart();
  const [scannedProducts, setScannedProducts] = useState<Product[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [lastScanned, setLastScanned] = useState<Product | null>(null);

  const simulateScan = useCallback(() => {
    if (isScanning) return;
    setIsScanning(true);

    // Pick a random product not yet scanned, or any random one
    const unscanned = products.filter((p) => !scannedProducts.find((s) => s.id === p.id));
    const pool = unscanned.length > 0 ? unscanned : products;
    const product = pool[Math.floor(Math.random() * pool.length)];

    setTimeout(() => {
      setLastScanned(product);
      if (!scannedProducts.find((s) => s.id === product.id)) {
        setScannedProducts((prev) => [product, ...prev]);
      }
      setIsScanning(false);
    }, 800);
  }, [isScanning, scannedProducts]);

  const handleAddToBag = (product: Product) => {
    addItem(product);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-14 pb-3">
        <h1 className="text-xl font-bold text-foreground">Scan your product</h1>
        <button onClick={onOpenBag} className="relative p-2">
          <ShoppingBag size={22} className="text-foreground" />
          {itemCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 bg-primary text-primary-foreground text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
              {itemCount}
            </span>
          )}
        </button>
      </div>

      {/* Camera viewfinder */}
      <div className="mx-5 rounded-2xl overflow-hidden relative bg-secondary aspect-[4/3] flex items-center justify-center">
        <div className="absolute inset-0 bg-gradient-to-b from-secondary/50 to-secondary/90" />
        
        {/* Scanner overlay */}
        <div className="absolute inset-4 border-2 border-primary-foreground/30 rounded-xl">
          {/* Corner markers */}
          <div className="absolute top-0 left-0 w-6 h-6 border-t-3 border-l-3 border-primary rounded-tl-lg" style={{ borderWidth: '3px 0 0 3px' }} />
          <div className="absolute top-0 right-0 w-6 h-6 border-t-3 border-r-3 border-primary rounded-tr-lg" style={{ borderWidth: '3px 3px 0 0' }} />
          <div className="absolute bottom-0 left-0 w-6 h-6 border-b-3 border-l-3 border-primary rounded-bl-lg" style={{ borderWidth: '0 0 3px 3px' }} />
          <div className="absolute bottom-0 right-0 w-6 h-6 border-b-3 border-r-3 border-primary rounded-br-lg" style={{ borderWidth: '0 3px 3px 0' }} />
        </div>

        {/* Scanning line animation */}
        {isScanning && (
          <div className="absolute left-4 right-4 h-0.5 bg-primary scanner-line opacity-80" />
        )}

        <div className="relative z-10 flex flex-col items-center gap-3">
          <ScanLine size={48} className="text-primary-foreground/60" />
          <p className="text-primary-foreground/60 text-sm font-medium">
            {isScanning ? "Scanning..." : "Tap to scan a product"}
          </p>
        </div>

        {/* Tap overlay */}
        <button
          onClick={simulateScan}
          className="absolute inset-0 z-20"
          aria-label="Scan product"
        />
      </div>

      {/* Scanned items list */}
      <div className="flex-1 overflow-y-auto px-5 pt-4 pb-24">
        {lastScanned && (
          <div className="bg-card rounded-2xl shadow-card p-3 mb-3 slide-up border border-border">
            <div className="flex items-center gap-3">
              <img
                src={lastScanned.image}
                alt={lastScanned.name}
                className="w-14 h-14 rounded-xl object-cover bg-muted"
              />
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-sm text-foreground truncate">{lastScanned.name}</h3>
                <p className="text-xs text-muted-foreground">{lastScanned.weight}</p>
                <p className="text-sm font-bold text-primary">${lastScanned.price.toFixed(2)}ea</p>
              </div>
              <button
                onClick={() => handleAddToBag(lastScanned)}
                className="bg-primary text-primary-foreground rounded-xl px-3 py-2 flex items-center gap-1 text-xs font-semibold active:scale-95 transition-transform"
              >
                <Plus size={14} />
                Add
              </button>
            </div>
          </div>
        )}

        {scannedProducts.filter(p => p.id !== lastScanned?.id).map((product) => (
          <div
            key={product.id}
            className="flex items-center gap-3 py-3 border-b border-border last:border-0"
          >
            <img
              src={product.image}
              alt={product.name}
              className="w-10 h-10 rounded-lg object-cover bg-muted"
            />
            <div className="flex-1 min-w-0">
              <h3 className="font-medium text-sm text-foreground truncate">{product.name}</h3>
              <p className="text-xs text-muted-foreground">{product.weight}</p>
            </div>
            <p className="text-sm font-bold text-primary">${product.price.toFixed(2)}</p>
            <button
              onClick={() => handleAddToBag(product)}
              className="text-primary p-1.5 rounded-lg hover:bg-primary/10 transition-colors"
            >
              <Plus size={16} />
            </button>
          </div>
        ))}

        {scannedProducts.length === 0 && !lastScanned && (
          <div className="flex flex-col items-center justify-center pt-8 text-muted-foreground">
            <Zap size={32} className="mb-2 opacity-40" />
            <p className="text-sm">Tap the camera to scan items</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ScanScreen;
