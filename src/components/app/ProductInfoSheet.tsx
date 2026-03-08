import { useState, useEffect } from "react";
import { X, Info, Leaf } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Product } from "@/data/products";
import { fetchProductInfo, ProductFullInfo } from "@/lib/productInfoApi";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface ProductInfoSheetProps {
  product: Product | null;
  open: boolean;
  onClose: () => void;
}

// --- Nutri-Score colors ---
const nutriScoreColors: Record<string, string> = {
  a: "bg-[hsl(142,71%,35%)] text-white",
  b: "bg-[hsl(88,50%,50%)] text-white",
  c: "bg-[hsl(48,95%,55%)] text-foreground",
  d: "bg-[hsl(30,90%,55%)] text-white",
  e: "bg-[hsl(0,72%,51%)] text-white",
};

// --- NOVA labels ---
const novaLabels: Record<number, { label: string; color: string }> = {
  1: { label: "Unprocessed or minimally processed", color: "bg-[hsl(142,71%,35%)] text-white" },
  2: { label: "Processed culinary ingredient", color: "bg-[hsl(88,50%,50%)] text-white" },
  3: { label: "Processed food", color: "bg-[hsl(30,90%,55%)] text-white" },
  4: { label: "Ultra-processed food", color: "bg-[hsl(0,72%,51%)] text-white" },
};

// --- Nutrient level colors ---
function nutrientLevelColor(level?: string): string {
  if (level === "low") return "bg-[hsl(142,71%,45%)]";
  if (level === "moderate") return "bg-[hsl(48,95%,55%)]";
  if (level === "high") return "bg-[hsl(0,72%,51%)]";
  return "bg-muted-foreground/30";
}

// --- Additive risk (simplified heuristic) ---
function additiveRisk(tag: string): { label: string; color: string } {
  const code = tag.replace(/^en:/, "").toUpperCase();
  // Known high-risk additives
  const highRisk = ["E150D", "E950", "E951", "E952", "E954", "E621", "E631", "E627", "E171"];
  const moderateRisk = ["E160A", "E160B", "E120", "E122", "E129", "E102", "E110", "E124", "E104", "E133"];
  if (highRisk.includes(code)) return { label: "High risk", color: "bg-[hsl(0,72%,51%)] text-white" };
  if (moderateRisk.includes(code)) return { label: "Moderate risk", color: "bg-[hsl(30,90%,55%)] text-white" };
  if (code.startsWith("E3") || code.startsWith("E4")) return { label: "Limited risk", color: "bg-[hsl(48,95%,55%)] text-foreground" };
  return { label: "No known risk", color: "bg-[hsl(142,71%,45%)] text-white" };
}

function formatAllergen(tag: string): string {
  return tag
    .replace(/^en:/, "")
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function formatAdditive(tag: string): string {
  return tag.replace(/^en:/, "").replace(/-/g, " ").toUpperCase();
}

function formatLabel(tag: string): string {
  return tag
    .replace(/^en:/, "")
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

// --- Info Button Component (exported for reuse) ---
export const ProductInfoButton = ({
  onClick,
  className = "",
}: {
  onClick: () => void;
  className?: string;
}) => (
  <motion.button
    whileTap={{ scale: 0.9 }}
    onClick={(e) => {
      e.stopPropagation();
      onClick();
    }}
    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full border border-scanner-accent/40 bg-background text-scanner-accent text-[11px] font-semibold hover:bg-scanner-accent/5 transition-colors ${className}`}
    aria-label="Product Info"
  >
    <Leaf size={12} />
    <span>Info</span>
  </motion.button>
);

// --- Skeleton Loader ---
const SheetSkeleton = () => (
  <div className="space-y-5 p-5">
    <div className="flex gap-4">
      <Skeleton className="w-20 h-20 rounded-xl flex-shrink-0" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="h-3.5 w-1/2" />
        <Skeleton className="h-3.5 w-1/3" />
      </div>
    </div>
    <div className="flex gap-3">
      <Skeleton className="h-8 w-24 rounded-full" />
      <Skeleton className="h-8 w-20 rounded-full" />
    </div>
    {[...Array(6)].map((_, i) => (
      <Skeleton key={i} className="h-4 w-full" />
    ))}
  </div>
);

// --- Main Sheet ---
const ProductInfoSheet = ({ product, open, onClose }: ProductInfoSheetProps) => {
  const [info, setInfo] = useState<ProductFullInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!open || !product) {
      setInfo(null);
      setNotFound(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setNotFound(false);

    fetchProductInfo(product.barcode).then((result) => {
      if (cancelled) return;
      setLoading(false);
      if (result) {
        setInfo(result);
      } else {
        setNotFound(true);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [open, product]);

  if (!product) return null;

  const n = info?.nutriments;
  const nl = info?.nutrientLevels;

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-foreground/40 z-50"
          />
          {/* Sheet */}
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 300 }}
            drag="y"
            dragConstraints={{ top: 0 }}
            dragElastic={0.1}
            onDragEnd={(_, dragInfo) => {
              if (dragInfo.offset.y > 100) onClose();
            }}
            className="fixed bottom-0 left-0 right-0 z-50 bg-background rounded-t-3xl max-h-[75vh] flex flex-col shadow-elevated"
          >
            {/* Drag handle */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 rounded-full bg-muted-foreground/20" />
            </div>

            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute top-3.5 right-4 w-8 h-8 rounded-full bg-muted/60 flex items-center justify-center z-10"
              aria-label="Close"
            >
              <X size={16} className="text-muted-foreground" />
            </button>

            {/* Scrollable content */}
            <div className="flex-1 overflow-y-auto overscroll-contain px-5 pb-8">
              {loading ? (
                <SheetSkeleton />
              ) : notFound ? (
                <div className="py-10 text-center">
                  <div className="w-16 h-16 rounded-full bg-muted/40 flex items-center justify-center mx-auto mb-4">
                    <Info size={24} className="text-muted-foreground/50" />
                  </div>
                  <h3 className="font-bold text-foreground text-lg">{product.name}</h3>
                  <p className="text-sm text-muted-foreground mt-1">${product.price.toFixed(2)}</p>
                  <p className="text-sm text-muted-foreground mt-4 max-w-[260px] mx-auto">
                    Nutritional information not yet available for this product.
                  </p>
                </div>
              ) : info ? (
                <div className="space-y-5">
                  {/* 1. Product Header */}
                  <div className="flex gap-4 pt-2">
                    <div className="w-20 h-20 rounded-xl overflow-hidden bg-muted/20 flex-shrink-0">
                      <img
                        src={info.imageUrl || product.image}
                        alt={info.productName}
                        className="w-full h-full object-contain p-1"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = "/placeholder.svg";
                        }}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-[17px] text-foreground leading-snug line-clamp-2">
                        {info.productName}
                      </h3>
                      {info.brand && (
                        <p className="text-xs text-muted-foreground mt-0.5">{info.brand}</p>
                      )}
                      {info.quantity && (
                        <p className="text-xs text-muted-foreground">{info.quantity}</p>
                      )}
                    </div>
                  </div>

                  {/* 2. Nutri-Score + 3. NOVA Group */}
                  <div className="flex flex-wrap gap-2">
                    <TooltipProvider delayDuration={200}>
                      {info.nutriScoreGrade ? (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div
                              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold ${nutriScoreColors[info.nutriScoreGrade.toLowerCase()] || "bg-muted text-muted-foreground"}`}
                            >
                              Nutri-Score {info.nutriScoreGrade.toUpperCase()}
                            </div>
                          </TooltipTrigger>
                          <TooltipContent side="bottom" className="max-w-[240px] text-xs">
                            Nutri-Score is a European nutritional rating from A (best) to E (worst), based on
                            nutritional quality per 100g.
                          </TooltipContent>
                        </Tooltip>
                      ) : (
                        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-muted text-muted-foreground">
                          Score Unavailable
                        </div>
                      )}

                      {info.novaGroup && novaLabels[info.novaGroup] && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div
                              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold ${novaLabels[info.novaGroup].color}`}
                            >
                              NOVA {info.novaGroup}
                            </div>
                          </TooltipTrigger>
                          <TooltipContent side="bottom" className="max-w-[240px] text-xs">
                            {novaLabels[info.novaGroup].label}
                          </TooltipContent>
                        </Tooltip>
                      )}
                    </TooltipProvider>
                  </div>

                  {/* 4. Nutrition Facts Panel */}
                  {n && (
                    <div>
                      <h4 className="text-sm font-bold text-foreground mb-2">Nutrition Facts</h4>
                      <p className="text-[11px] text-muted-foreground mb-2">Per 100g</p>
                      <div className="rounded-xl border border-border/50 overflow-hidden">
                        {[
                          { label: "Calories", value: n.energyKcal100g, unit: "kcal", level: undefined },
                          { label: "Fat", value: n.fat100g, unit: "g", level: nl?.fat },
                          { label: "  Saturated Fat", value: n.saturatedFat100g, unit: "g", level: nl?.saturatedFat, indent: true },
                          { label: "Carbohydrates", value: n.carbs100g, unit: "g", level: undefined },
                          { label: "  Sugars", value: n.sugars100g, unit: "g", level: nl?.sugars, indent: true },
                          { label: "Fiber", value: n.fiber100g, unit: "g", level: undefined },
                          { label: "Protein", value: n.protein100g, unit: "g", level: undefined },
                          { label: "Salt", value: n.salt100g, unit: "g", level: nl?.salt },
                        ].map((row, i) => (
                          <div
                            key={row.label}
                            className={`flex items-center px-3.5 py-2 text-[13px] ${i !== 0 ? "border-t border-border/30" : ""} ${row.indent ? "pl-7" : ""}`}
                          >
                            <div className="flex items-center gap-2 flex-1">
                              {row.level && (
                                <div className={`w-2 h-2 rounded-full flex-shrink-0 ${nutrientLevelColor(row.level)}`} />
                              )}
                              <span className={`${row.indent ? "text-muted-foreground" : "font-medium text-foreground"}`}>
                                {row.label.trim()}
                              </span>
                            </div>
                            <span className="text-muted-foreground font-medium">
                              {row.value != null ? `${Number(row.value).toFixed(1)} ${row.unit}` : "—"}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 5. Ingredients List */}
                  {info.ingredientsText && (
                    <div>
                      <h4 className="text-sm font-bold text-foreground mb-2">Ingredients</h4>
                      <p className="text-[12px] text-muted-foreground leading-relaxed">
                        {info.allergensTags && info.allergensTags.length > 0
                          ? highlightAllergens(info.ingredientsText, info.allergensTags)
                          : info.ingredientsText}
                      </p>
                      {info.allergensTags && info.allergensTags.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          <span className="text-[11px] font-semibold text-foreground">Allergens:</span>
                          {info.allergensTags.map((a) => (
                            <span
                              key={a}
                              className="text-[11px] font-bold text-scanner-accent bg-scanner-accent/10 px-2 py-0.5 rounded-full"
                            >
                              {formatAllergen(a)}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* 6. Additives */}
                  <div>
                    <h4 className="text-sm font-bold text-foreground mb-2">Additives</h4>
                    {info.additivesTags && info.additivesTags.length > 0 ? (
                      <div className="space-y-1.5">
                        {info.additivesTags.map((a) => {
                          const risk = additiveRisk(a);
                          return (
                            <div key={a} className="flex items-center justify-between text-[12px]">
                              <span className="text-muted-foreground font-medium">{formatAdditive(a)}</span>
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${risk.color}`}>
                                {risk.label}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="text-[12px] text-[hsl(142,71%,45%)] font-medium flex items-center gap-1.5">
                        <Leaf size={13} />
                        No additives detected
                      </p>
                    )}
                  </div>

                  {/* 7. Labels & Certifications */}
                  {info.labelsTags && info.labelsTags.length > 0 && (
                    <div>
                      <h4 className="text-sm font-bold text-foreground mb-2">Labels & Certifications</h4>
                      <div className="flex flex-wrap gap-1.5">
                        {info.labelsTags.map((l) => (
                          <span
                            key={l}
                            className="text-[11px] font-semibold bg-muted text-foreground px-2.5 py-1 rounded-full"
                          >
                            {formatLabel(l)}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 8. Data Source Footer */}
                  <p className="text-[10px] text-muted-foreground/60 text-center pt-2 pb-2">
                    Nutritional data powered by Open Food Facts. Data may vary from physical product.
                  </p>
                </div>
              ) : null}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

// Highlight allergens in ingredients text
function highlightAllergens(text: string, allergens: string[]): JSX.Element {
  const allergenWords = allergens.map((a) =>
    a.replace(/^en:/, "").replace(/[-_]/g, " ").toLowerCase()
  );

  // Build a regex from allergen words
  const pattern = allergenWords
    .filter(Boolean)
    .map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
    .join("|");

  if (!pattern) return <>{text}</>;

  const regex = new RegExp(`(${pattern})`, "gi");
  const parts = text.split(regex);

  return (
    <>
      {parts.map((part, i) =>
        regex.test(part) ? (
          <strong key={i} className="text-scanner-accent font-bold">
            {part}
          </strong>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </>
  );
}

export default ProductInfoSheet;
