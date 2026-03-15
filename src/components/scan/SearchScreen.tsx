import { useState, useCallback, useRef } from "react";
import { motion } from "framer-motion";
import { Search, X, Barcode, Lock } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useSubscription } from "@/context/SubscriptionContext";
import { BottomNavBar } from "./BottomNavBar";

interface SearchResult {
  code: string;
  product_name: string;
  brands?: string;
  image_front_small_url?: string;
  nutriscore_grade?: string;
}

interface SearchScreenProps {
  onScanProduct: (barcode: string) => void;
  onNavChange: (nav: string) => void;
  onOpenScanner: () => void;
}

const nutriColors: Record<string, string> = {
  a: "#2D7D46", b: "#4CAF50", c: "#FFC107", d: "#FF6D00", e: "#E8314A",
};

export function SearchScreen({ onScanProduct, onNavChange, onOpenScanner }: SearchScreenProps) {
  const { isPlus, openUpgrade } = useSubscription();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();
  const inputRef = useRef<HTMLInputElement>(null);

  const doSearch = useCallback(async (q: string) => {
    if (!q.trim()) { setResults([]); setSearched(false); return; }
    setLoading(true);
    setSearched(true);
    try {
      const res = await fetch(
        `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(q)}&json=1&page_size=20&fields=code,product_name,brands,image_front_small_url,nutriscore_grade`
      );
      const data = await res.json();
      setResults((data.products || []).filter((p: any) => p.product_name));
    } catch {
      setResults([]);
    }
    setLoading(false);
  }, []);

  const handleInput = (val: string) => {
    setQuery(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => doSearch(val), 300);
  };

  // Member gate for free users
  if (!isPlus) {
    return (
      <div className="min-h-screen flex flex-col" style={{ maxWidth: 430, margin: "0 auto", background: "#FFFFFF" }}>
        {/* Member access gate — Yuka style */}
        <div className="flex-1 flex flex-col items-center justify-center px-8 text-center">
          <div className="w-16 h-16 rounded-full flex items-center justify-center mb-6" style={{ background: "#FEF2F2" }}>
            <Lock size={28} style={{ color: "#E8314A" }} />
          </div>
          <p className="text-[12px] font-bold tracking-widest uppercase mb-3" style={{ color: "#E8314A" }}>
            Member Access
          </p>
          <h2 className="font-extrabold text-[22px] leading-tight" style={{ color: "#1B2A4A" }}>
            Search for any product
          </h2>
          <p className="text-[14px] mt-3 leading-relaxed" style={{ color: "#6B7280" }}>
            3 million+ food and cosmetic products available.
          </p>
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={() => openUpgrade("Product search")}
            className="mt-8 w-full font-bold text-[15px] text-white"
            style={{
              height: 52,
              borderRadius: 14,
              background: "linear-gradient(135deg, #E8314A, #c42040)",
              maxWidth: 280,
            }}
          >
            Become a Member
          </motion.button>
        </div>

        <BottomNavBar active="search" onNavigate={onNavChange} />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ maxWidth: 430, margin: "0 auto", background: "#FFFFFF" }}>
      {/* Search bar */}
      <div className="px-5 mt-[env(safe-area-inset-top,12px)] pt-4">
        <div className="flex items-center gap-3 px-4 h-[52px] rounded-2xl" style={{ background: "#F3F4F6", border: "1px solid #E5E7EB", borderRadius: 16 }}>
          <Search size={18} style={{ color: "#9CA3AF" }} />
          <input
            ref={inputRef}
            type="text"
            placeholder="Search any food product..."
            value={query}
            onChange={e => handleInput(e.target.value)}
            className="flex-1 bg-transparent text-[15px] outline-none placeholder:text-gray-400"
            style={{ color: "#1B2A4A" }}
            autoFocus
          />
          {query && (
            <button onClick={() => { setQuery(""); setResults([]); setSearched(false); }}>
              <X size={16} style={{ color: "#9CA3AF" }} />
            </button>
          )}
        </div>
      </div>

      {/* Results */}
      <div className="flex-1 overflow-y-auto px-5 mt-4 pb-24">
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="flex gap-3 p-4 rounded-2xl" style={{ background: "#F9FAFB", border: "1px solid #E5E7EB" }}>
                <Skeleton className="w-12 h-12 rounded-xl flex-shrink-0" style={{ background: "#E5E7EB" }} />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-3 w-3/4" style={{ background: "#E5E7EB" }} />
                  <Skeleton className="h-3 w-1/2" style={{ background: "#E5E7EB" }} />
                </div>
              </div>
            ))}
          </div>
        ) : searched && results.length === 0 ? (
          <div className="text-center py-16 rounded-2xl" style={{ background: "#F9FAFB", border: "1px solid #E5E7EB", borderRadius: 20 }}>
            <Search size={32} style={{ color: "#D1D5DB" }} className="mx-auto" />
            <p className="text-sm mt-3 font-semibold" style={{ color: "#1B2A4A" }}>No products found</p>
            <p className="text-[12px] mt-1" style={{ color: "#9CA3AF" }}>Try scanning the barcode directly</p>
            <motion.button whileTap={{ scale: 0.97 }}
              onClick={onOpenScanner}
              className="mt-4 px-6 py-3 rounded-2xl font-bold text-sm text-white"
              style={{ background: "linear-gradient(135deg, #E8314A, #c42040)" }}>
              Open Scanner
            </motion.button>
          </div>
        ) : (
          <div className="space-y-2">
            {results.map(r => (
              <motion.button
                key={r.code}
                whileTap={{ scale: 0.98 }}
                onClick={() => onScanProduct(r.code)}
                className="w-full flex items-center gap-3 px-4 py-3 text-left rounded-2xl"
                style={{ background: "#F9FAFB", border: "1px solid #E5E7EB" }}
              >
                <div className="w-12 h-12 rounded-xl overflow-hidden flex-shrink-0" style={{ background: "#F3F4F6" }}>
                  {r.image_front_small_url ? (
                    <img src={r.image_front_small_url} alt={r.product_name} className="w-full h-full object-contain p-0.5" loading="lazy" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Barcode size={16} style={{ color: "#D1D5DB" }} />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate" style={{ color: "#1B2A4A" }}>{r.product_name}</p>
                  {r.brands && <p className="text-[11px] truncate" style={{ color: "#9CA3AF" }}>{r.brands}</p>}
                </div>
                {r.nutriscore_grade && (
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ background: nutriColors[r.nutriscore_grade.toLowerCase()] || "#D1D5DB" }}>
                    <span className="font-extrabold text-xs text-white">{r.nutriscore_grade.toUpperCase()}</span>
                  </div>
                )}
              </motion.button>
            ))}
          </div>
        )}
      </div>

      <BottomNavBar active="search" onNavigate={onNavChange} />
    </div>
  );
}
