import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Trophy, TrendingUp, Star, Barcode, ChevronRight, Sparkles } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { BottomNavBar } from "./BottomNavBar";

interface TopProductsScreenProps {
  onScanProduct: (barcode: string) => void;
  onNavChange: (nav: string) => void;
}

interface TrendingProduct {
  code: string;
  product_name: string;
  brands?: string;
  image_front_small_url?: string;
  nutriscore_grade?: string;
  ecoscore_grade?: string;
}

const CATEGORIES = [
  { key: "popular", label: "🔥 Popular", query: "popular" },
  { key: "healthy", label: "🥗 Healthiest", query: "nutriscore_grade:a" },
  { key: "snacks", label: "🍿 Snacks", query: "snacks" },
  { key: "drinks", label: "🥤 Drinks", query: "beverages" },
  { key: "organic", label: "🌿 Organic", query: "organic" },
];

const CURATED_BARCODES = [
  "3017620422003",  // Nutella
  "5449000000996",  // Coca-Cola
  "7622210449283",  // Oreo
  "3175680011534",  // Evian
  "5000159407236",  // Heinz Ketchup
  "3228857000166",  // President Butter
  "8000500310427",  // Ferrero Rocher
  "5053990156009",  // Heinz Baked Beans
  "3033710065967",  // BN Biscuits
  "5010029220230",  // Marmite
];

const nutriColors: Record<string, { bg: string; color: string }> = {
  a: { bg: "#F0FDF4", color: "#15803D" },
  b: { bg: "#F0FDF4", color: "#22C55E" },
  c: { bg: "#FFFBEB", color: "#CA8A04" },
  d: { bg: "#FFF7ED", color: "#EA580C" },
  e: { bg: "#FEF2F2", color: "#DC2626" },
};

export function TopProductsScreen({ onScanProduct, onNavChange }: TopProductsScreenProps) {
  const [activeCategory, setActiveCategory] = useState("popular");
  const [products, setProducts] = useState<TrendingProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [featuredProducts, setFeaturedProducts] = useState<TrendingProduct[]>([]);

  const fetchProducts = useCallback(async (category: string) => {
    setLoading(true);
    try {
      const cat = CATEGORIES.find(c => c.key === category);
      const searchTerm = cat?.query || "popular";

      const res = await fetch(
        `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(searchTerm)}&json=1&page_size=15&sort_by=unique_scans_n&fields=code,product_name,brands,image_front_small_url,nutriscore_grade,ecoscore_grade`
      );
      const data = await res.json();
      const items = (data.products || []).filter((p: any) => p.product_name && p.image_front_small_url);
      setProducts(items);
    } catch {
      setProducts([]);
    }
    setLoading(false);
  }, []);

  // Fetch curated featured products
  useEffect(() => {
    const fetchFeatured = async () => {
      const results: TrendingProduct[] = [];
      const shuffled = [...CURATED_BARCODES].sort(() => 0.5 - Math.random()).slice(0, 3);
      for (const barcode of shuffled) {
        try {
          const res = await fetch(`https://world.openfoodfacts.org/api/v0/product/${barcode}.json?fields=code,product_name,brands,image_front_small_url,nutriscore_grade`);
          const data = await res.json();
          if (data.product?.product_name) results.push(data.product);
        } catch {}
      }
      setFeaturedProducts(results);
    };
    fetchFeatured();
  }, []);

  useEffect(() => {
    fetchProducts(activeCategory);
  }, [activeCategory, fetchProducts]);

  const getVerdict = (grade?: string) => {
    if (!grade) return null;
    const g = grade.toLowerCase();
    return nutriColors[g] || null;
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ maxWidth: 430, margin: "0 auto", background: "#FFFFFF" }}>
      {/* Header */}
      <div className="px-5 pt-[env(safe-area-inset-top,12px)] mt-2">
        <div className="flex items-center gap-2">
          <Trophy size={20} style={{ color: "#E8314A" }} />
          <h1 className="font-extrabold text-[22px]" style={{ color: "#1A1A1A" }}>Top Products</h1>
        </div>
        <p className="text-[13px] mt-1" style={{ color: "#9CA3AF" }}>
          Discover trending and top-rated products
        </p>
      </div>

      {/* Featured hero cards */}
      {featuredProducts.length > 0 && (
        <div className="px-5 mt-4">
          <div className="flex items-center gap-1.5 mb-3">
            <Sparkles size={14} style={{ color: "#F59E0B" }} />
            <span className="text-[12px] font-bold uppercase tracking-wider" style={{ color: "#F59E0B" }}>Featured</span>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-1 -mx-1 px-1" style={{ scrollSnapType: "x mandatory" }}>
            {featuredProducts.map((p, i) => {
              const ns = getVerdict(p.nutriscore_grade);
              return (
                <motion.button
                  key={p.code}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => onScanProduct(p.code)}
                  className="flex-shrink-0 rounded-2xl overflow-hidden text-left"
                  style={{
                    width: 150,
                    background: "#F9FAFB",
                    border: "1px solid #F3F4F6",
                    scrollSnapAlign: "start",
                  }}
                >
                  <div className="h-[100px] flex items-center justify-center p-3" style={{ background: "#FFFFFF" }}>
                    {p.image_front_small_url ? (
                      <img src={p.image_front_small_url} alt={p.product_name} className="max-h-full max-w-full object-contain" loading="lazy" />
                    ) : (
                      <Barcode size={24} style={{ color: "#D1D5DB" }} />
                    )}
                  </div>
                  <div className="p-3">
                    <p className="text-[12px] font-bold truncate" style={{ color: "#1A1A1A" }}>{p.product_name}</p>
                    {p.brands && <p className="text-[10px] truncate mt-0.5" style={{ color: "#9CA3AF" }}>{p.brands}</p>}
                    {ns && p.nutriscore_grade && (
                      <span className="inline-flex items-center mt-2 px-2 py-0.5 rounded-full text-[10px] font-bold"
                        style={{ background: ns.bg, color: ns.color }}>
                        Nutri-Score {p.nutriscore_grade.toUpperCase()}
                      </span>
                    )}
                  </div>
                </motion.button>
              );
            })}
          </div>
        </div>
      )}

      {/* Category pills */}
      <div className="flex gap-2 px-5 mt-5 overflow-x-auto pb-1">
        {CATEGORIES.map(cat => (
          <button
            key={cat.key}
            onClick={() => setActiveCategory(cat.key)}
            className="flex-shrink-0 px-4 py-2 rounded-full text-[13px] font-semibold transition-all whitespace-nowrap"
            style={{
              background: activeCategory === cat.key ? "#E8314A" : "#F3F4F6",
              color: activeCategory === cat.key ? "#fff" : "#6B7280",
              border: `1px solid ${activeCategory === cat.key ? "#E8314A" : "#E5E7EB"}`,
            }}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Trending section title */}
      <div className="flex items-center gap-1.5 px-5 mt-5 mb-3">
        <TrendingUp size={14} style={{ color: "#E8314A" }} />
        <span className="text-[12px] font-bold uppercase tracking-wider" style={{ color: "#E8314A" }}>
          {CATEGORIES.find(c => c.key === activeCategory)?.label.replace(/^.\s/, "") || "Trending"}
        </span>
      </div>

      {/* Product list */}
      <div className="flex-1 overflow-y-auto px-5 pb-24">
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="flex gap-3 p-3 rounded-2xl" style={{ background: "#F9FAFB", border: "1px solid #F3F4F6" }}>
                <Skeleton className="w-14 h-14 rounded-xl flex-shrink-0" style={{ background: "#E5E7EB" }} />
                <div className="flex-1 space-y-2 py-1">
                  <Skeleton className="h-3 w-3/4" style={{ background: "#E5E7EB" }} />
                  <Skeleton className="h-3 w-1/2" style={{ background: "#E5E7EB" }} />
                </div>
              </div>
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-16">
            <Star size={32} style={{ color: "#E5E7EB" }} className="mx-auto" />
            <p className="text-[14px] mt-3 font-medium" style={{ color: "#9CA3AF" }}>No products found</p>
          </div>
        ) : (
          <div className="space-y-2">
            {products.map((p, idx) => {
              const ns = getVerdict(p.nutriscore_grade);
              return (
                <motion.button
                  key={p.code}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => onScanProduct(p.code)}
                  className="w-full flex items-center gap-3 px-4 py-3 text-left rounded-2xl"
                  style={{ background: "#F9FAFB", border: "1px solid #F3F4F6" }}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.03 }}
                >
                  {/* Rank number */}
                  <span className="text-[14px] font-extrabold w-6 text-center flex-shrink-0"
                    style={{ color: idx < 3 ? "#E8314A" : "#D1D5DB" }}>
                    {idx + 1}
                  </span>

                  {/* Product image */}
                  <div className="w-12 h-12 rounded-xl overflow-hidden flex-shrink-0" style={{ background: "#FFFFFF", border: "1px solid #F3F4F6" }}>
                    {p.image_front_small_url ? (
                      <img src={p.image_front_small_url} alt={p.product_name} className="w-full h-full object-contain p-0.5" loading="lazy" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Barcode size={14} style={{ color: "#D1D5DB" }} />
                      </div>
                    )}
                  </div>

                  {/* Name + brand */}
                  <div className="flex-1 min-w-0">
                    <p className="text-[14px] font-semibold truncate" style={{ color: "#1A1A1A" }}>{p.product_name}</p>
                    {p.brands && <p className="text-[11px] truncate" style={{ color: "#9CA3AF" }}>{p.brands}</p>}
                  </div>

                  {/* Nutri-Score badge */}
                  {ns && p.nutriscore_grade && (
                    <span className="text-[11px] font-extrabold px-2 py-1 rounded-lg flex-shrink-0"
                      style={{ background: ns.bg, color: ns.color }}>
                      {p.nutriscore_grade.toUpperCase()}
                    </span>
                  )}

                  <ChevronRight size={14} style={{ color: "#D1D5DB" }} className="flex-shrink-0" />
                </motion.button>
              );
            })}
          </div>
        )}
      </div>

      <BottomNavBar active="home" onNavigate={onNavChange} />
    </div>
  );
}
