import { useState, useEffect, useRef } from "react";
import { Info, Leaf, ChevronRight, ChevronDown, UtensilsCrossed, FlaskConical, List, Barcode } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Product } from "@/data/products";
import { fetchProductInfo, ProductFullInfo } from "@/lib/productInfoApi";
import { trackEvent } from "@/lib/analytics";
import {
  calculateSkaapScore,
  getScoreColor,
  getAdditiveRisk,
  getAdditiveRiskColor,
  getAdditiveRiskLabel,
  getAdditiveDescription,
  SkaapScoreBreakdown,
} from "@/lib/skaapScore";

interface ProductInfoSheetProps {
  product: Product | null;
  open: boolean;
  onClose: () => void;
}

// --- Nutri-Score hex colors ---
const nutriScoreHex: Record<string, string> = {
  a: "#2D7D46", b: "#85BB2F", c: "#FFC107", d: "#FF6D00", e: "#E8314A",
};
const novaHex: Record<number, string> = {
  1: "#2D7D46", 2: "#85BB2F", 3: "#FF6D00", 4: "#E8314A",
};

function nutrientLevelHex(level?: string): string {
  if (level === "low") return "#2D7D46";
  if (level === "moderate") return "#FFC107";
  if (level === "high") return "#E8314A";
  return "#9CA3AF";
}

function formatAdditive(tag: string): string {
  return tag.replace(/^en:/, "").replace(/-/g, " ").toUpperCase();
}

function getAdditiveCommonName(tag: string): string {
  return getAdditiveDescription(tag).replace(/\.$/, "");
}

function generateVerdict(score: SkaapScoreBreakdown, info: ProductFullInfo): string {
  const ns = info.nutriScoreGrade?.toLowerCase();
  if (score.hasHighRiskAdditive) return "Contains a high-risk additive affecting the score.";
  if (ns === "a" || ns === "b") {
    return score.additiveCount === 0
      ? "Good nutritional profile with no additives."
      : "Good nutritional profile with low additives.";
  }
  if (info.novaGroup === 4 && (ns === "c" || ns === "d" || ns === "e")) {
    return "Ultra-processed with below-average nutrition.";
  }
  if (score.isOrganic) return "Organic certified with solid nutritional balance.";
  return "Moderate nutritional quality. Check ingredients.";
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

// --- Shimmer Skeleton ---
const shimmerStyle = {
  background: "linear-gradient(90deg, #F3F4F6 25%, #E9EAEC 50%, #F3F4F6 75%)",
  backgroundSize: "200% 100%",
  animation: "shimmer 1.4s infinite linear",
};
const Shimmer = ({ className, style }: { className?: string; style?: React.CSSProperties }) => (
  <div className={className} style={{ ...shimmerStyle, borderRadius: "6px", ...style }} />
);

const SheetSkeleton = () => (
  <div style={{ padding: "14px 20px 0" }}>
    {/* Header row */}
    <div style={{ display: "flex", alignItems: "center", gap: 12, height: 56 }}>
      <Shimmer className="flex-shrink-0" style={{ width: 44, height: 44, borderRadius: 10 } as any} />
      <div style={{ flex: 1 }}>
        <Shimmer className="" style={{ height: 14, width: "70%", marginBottom: 6 } as any} />
        <Shimmer className="" style={{ height: 10, width: "50%" } as any} />
      </div>
      <Shimmer className="flex-shrink-0" style={{ width: 44, height: 44, borderRadius: 22 } as any} />
    </div>
    <div style={{ height: 1, background: "#F3F4F6", marginTop: 14 }} />
    {/* Score hero */}
    <div style={{ display: "flex", alignItems: "center", gap: 16, marginTop: 16 }}>
      <Shimmer className="flex-shrink-0" style={{ width: 88, height: 88, borderRadius: 44 } as any} />
      <div style={{ flex: 1 }}>
        <Shimmer className="" style={{ height: 16, width: "60%", marginBottom: 8 } as any} />
        <Shimmer className="" style={{ height: 12, width: "80%" } as any} />
      </div>
    </div>
    <div style={{ height: 1, background: "#F3F4F6", marginTop: 16 }} />
    {/* Chips */}
    <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
      {[80, 90, 70].map((w, i) => (
        <Shimmer key={i} className="" style={{ height: 30, width: w, borderRadius: 20 } as any} />
      ))}
    </div>
    <div style={{ height: 1, background: "#F3F4F6", marginTop: 12 }} />
    {/* Accordion rows */}
    {[0, 1, 2].map((i) => (
      <Shimmer key={i} className="" style={{ height: 48, width: "100%", marginTop: 4, borderRadius: 8 } as any} />
    ))}
  </div>
);

// --- Score Ring SVG ---
const ScoreRing = ({ score, size = 88, strokeWidth = 5 }: { score: number; size?: number; strokeWidth?: number }) => {
  const color = getScoreColor(score);
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div style={{ width: size, height: size, position: "relative", flexShrink: 0, cursor: "pointer" }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#F3F4F6" strokeWidth={strokeWidth} />
        <motion.circle
          cx={size / 2} cy={size / 2} r={radius} fill="none"
          stroke={color} strokeWidth={strokeWidth} strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        />
      </svg>
      <div style={{
        position: "absolute", inset: 0, display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
      }}>
        <span style={{ fontWeight: 800, fontSize: 34, lineHeight: 1, color }}>{score}</span>
        <span style={{ fontWeight: 600, fontSize: 9, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: "0.05em" }}>/ 100</span>
      </div>
    </div>
  );
};

// --- Product Image with fast loading ---
const ProductImage = ({ info, product }: { info: ProductFullInfo | null; product: Product }) => {
  const [imgError, setImgError] = useState(false);
  const imgSrc = info?.imageSmallUrl || info?.imageUrl || product.image;

  if (imgError || !imgSrc || imgSrc === "/placeholder.svg") {
    return (
      <div style={{
        width: 44, height: 44, borderRadius: 10, background: "#F3F4F6",
        display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
      }}>
        <Barcode size={16} style={{ color: "#1B2A4A" }} />
      </div>
    );
  }

  return (
    <img
      src={imgSrc} alt={info?.productName || product.name}
      width={44} height={44}
      loading="eager"
      // @ts-ignore
      fetchpriority="high"
      onError={() => setImgError(true)}
      style={{ width: 44, height: 44, borderRadius: 10, objectFit: "cover", flexShrink: 0 }}
    />
  );
};

// --- Accordion Section ---
const AccordionSection = ({
  icon, label, hint, children,
}: {
  icon: React.ReactNode; label: string; hint: React.ReactNode; children: React.ReactNode;
}) => {
  const [open, setOpen] = useState(false);
  return (
    <div>
      <button
        onClick={() => setOpen(!open)}
        style={{
          width: "100%", height: 48, display: "flex", alignItems: "center",
          padding: "0 20px", gap: 10, background: "none", border: "none", cursor: "pointer",
        }}
      >
        <span style={{ color: "#1B2A4A", flexShrink: 0 }}>{icon}</span>
        <span style={{ fontWeight: 600, fontSize: 14, color: "#1B2A4A", flex: 1, textAlign: "left" }}>{label}</span>
        <span style={{ marginRight: 6 }}>{hint}</span>
        {open
          ? <ChevronDown size={16} style={{ color: "#9CA3AF" }} />
          : <ChevronRight size={16} style={{ color: "#9CA3AF" }} />}
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            style={{ overflow: "hidden", padding: "0 20px" }}
          >
            <div style={{ paddingTop: 12, paddingBottom: 16 }}>
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// --- Main Sheet ---
const ProductInfoSheet = ({ product, open, onClose }: ProductInfoSheetProps) => {
  const [info, setInfo] = useState<ProductFullInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const [saved, setSaved] = useState(false);
  const savedTimeoutRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    if (!open || !product) {
      setInfo(null);
      setNotFound(false);
      setSaved(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setNotFound(false);

    trackEvent("product_info_viewed", { product: product.name, barcode: product.barcode });
    fetchProductInfo(product.barcode).then((result) => {
      if (cancelled) return;
      setLoading(false);
      if (result) setInfo(result);
      else setNotFound(true);
    });

    return () => { cancelled = true; };
  }, [open, product]);

  useEffect(() => {
    return () => { if (savedTimeoutRef.current) clearTimeout(savedTimeoutRef.current); };
  }, []);

  if (!product) return null;

  const score = info
    ? calculateSkaapScore(info.nutriScoreGrade, info.additivesTags, info.labelsTags)
    : null;

  const n = info?.nutriments;
  const nl = info?.nutrientLevels;

  const handleScanAgain = () => { onClose(); };

  const handleSave = () => {
    if (!info || !product) return;
    const history = JSON.parse(localStorage.getItem("skaap_scan_history") || "[]");
    history.unshift({
      barcode: product.barcode,
      name: info.productName,
      brand: info.brand,
      score: score?.total,
      timestamp: Date.now(),
    });
    localStorage.setItem("skaap_scan_history", JSON.stringify(history.slice(0, 50)));
    setSaved(true);
    savedTimeoutRef.current = setTimeout(() => setSaved(false), 1500);
  };

  // Nutri-Score chip color
  const nsGrade = info?.nutriScoreGrade?.toLowerCase();
  const nsColor = nsGrade ? nutriScoreHex[nsGrade] || "#9CA3AF" : "#9CA3AF";

  // Additives chip
  const addCount = info?.additivesTags?.length || 0;
  const worstAdditiveColor = score?.worstAdditiveRisk
    ? getAdditiveRiskColor(score.worstAdditiveRisk) : "#2D7D46";

  // NOVA chip
  const novaNum = info?.novaGroup;
  const novaColor = novaNum ? novaHex[novaNum] || "#9CA3AF" : "#9CA3AF";

  // Count ingredients
  const ingredientCount = info?.ingredientsText
    ? info.ingredientsText.split(",").filter(Boolean).length : 0;

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-50"
            style={{ background: "transparent" }}
          />
          {/* Sheet */}
          <motion.div
            initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 300 }}
            drag="y" dragConstraints={{ top: 0 }} dragElastic={0.1}
            onDragEnd={(_, dragInfo) => { if (dragInfo.offset.y > 100) onClose(); }}
            className="fixed bottom-0 left-0 right-0 z-50 flex flex-col"
            style={{
              height: "78vh", background: "#FFFFFF",
              borderTopLeftRadius: 20, borderTopRightRadius: 20,
              boxShadow: "0 -4px 24px rgba(0,0,0,0.08)",
            }}
          >
            {/* Drag handle */}
            <div style={{ display: "flex", justifyContent: "center", paddingTop: 10 }}>
              <div style={{ width: 36, height: 4, borderRadius: 2, background: "#E5E7EB" }} />
            </div>

            {/* Scrollable content */}
            <div style={{ flex: 1, overflowY: "auto", overscrollBehavior: "contain" }}>
              {loading ? (
                <SheetSkeleton />
              ) : notFound ? (
                <div style={{ padding: "40px 20px", textAlign: "center" }}>
                  <div style={{
                    width: 48, height: 48, borderRadius: 24, background: "#F3F4F6",
                    display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px",
                  }}>
                    <Info size={20} style={{ color: "#9CA3AF" }} />
                  </div>
                  <p style={{ fontWeight: 800, fontSize: 15, color: "#1B2A4A" }}>{product.name}</p>
                  <p style={{ fontSize: 13, color: "#9CA3AF", marginTop: 8, maxWidth: 240, margin: "8px auto 0" }}>
                    Nutritional information not yet available for this product.
                  </p>
                </div>
              ) : info && score ? (
                <>
                  {/* SECTION A, Product Header */}
                  <div style={{
                    display: "flex", alignItems: "center", gap: 12,
                    height: 56, marginTop: 14, padding: "0 20px",
                  }}>
                    <ProductImage info={info} product={product} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{
                        fontWeight: 800, fontSize: 15, color: "#1B2A4A",
                        lineHeight: 1.3, overflow: "hidden", textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}>{info.productName}</p>
                      <p style={{
                        fontWeight: 400, fontSize: 12, color: "#9CA3AF",
                        overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                      }}>
                        {[info.brand, info.quantity].filter(Boolean).join(" · ")}
                      </p>
                    </div>
                    {/* Small score badge */}
                    <div style={{
                      width: 44, height: 44, borderRadius: 22, flexShrink: 0,
                      border: `3px solid ${getScoreColor(score.total)}`,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      background: "#FFFFFF",
                    }}>
                      <span style={{ fontWeight: 800, fontSize: 18, color: getScoreColor(score.total) }}>
                        {score.total}
                      </span>
                    </div>
                  </div>
                  <div style={{ height: 1, background: "#F3F4F6", marginTop: 14 }} />

                  {/* SECTION B, Score Hero */}
                  <div style={{
                    display: "flex", alignItems: "center", gap: 16,
                    marginTop: 16, padding: "0 20px",
                  }}>
                    <ScoreRing score={score.total} />
                    <div style={{ flex: 1 }}>
                      <p style={{ fontWeight: 800, fontSize: 17, color: "#1B2A4A" }}>
                        {score.total >= 75 ? "Excellent 🌿" : score.total >= 50 ? "Good" : score.total >= 25 ? "Mediocre" : "Poor"}
                      </p>
                      <p style={{ fontWeight: 400, fontSize: 13, color: "#6B7280", marginTop: 4, lineHeight: 1.5 }}>
                        {generateVerdict(score, info)}
                      </p>
                      <p style={{ fontWeight: 400, fontSize: 11, color: "#9CA3AF", marginTop: 6 }}>
                        Tap score to see breakdown →
                      </p>
                    </div>
                  </div>
                  <div style={{ height: 1, background: "#F3F4F6", marginTop: 16 }} />

                  {/* SECTION C, Signal Chips */}
                  <div style={{
                    display: "flex", gap: 8, marginTop: 12, padding: "0 20px",
                    overflowX: "auto", flexWrap: "nowrap",
                  }}>
                    {/* Nutri-Score chip */}
                    <div style={{
                      height: 30, padding: "0 10px", borderRadius: 20,
                      display: "flex", alignItems: "center", gap: 6, flexShrink: 0,
                      background: `${nsColor}1F`, border: `1px solid ${nsColor}66`,
                    }}>
                      <div style={{ width: 8, height: 8, borderRadius: 4, background: nsColor }} />
                      <span style={{ fontWeight: 600, fontSize: 12, color: "#1B2A4A" }}>
                        Nutri-Score {nsGrade?.toUpperCase() || ", "}
                      </span>
                    </div>
                    {/* Additives chip */}
                    <div style={{
                      height: 30, padding: "0 10px", borderRadius: 20,
                      display: "flex", alignItems: "center", gap: 6, flexShrink: 0,
                      background: addCount === 0 ? "#D1FAE5" : `${worstAdditiveColor}1F`,
                      border: `1px solid ${addCount === 0 ? "#6EE7B7" : `${worstAdditiveColor}66`}`,
                    }}>
                      <div style={{ width: 8, height: 8, borderRadius: 4, background: addCount === 0 ? "#2D7D46" : worstAdditiveColor }} />
                      <span style={{ fontWeight: 600, fontSize: 12, color: "#1B2A4A" }}>
                        {addCount === 0 ? "No additives" : `${addCount} additive${addCount > 1 ? "s" : ""}`}
                      </span>
                    </div>
                    {/* NOVA chip */}
                    <div style={{
                      height: 30, padding: "0 10px", borderRadius: 20,
                      display: "flex", alignItems: "center", gap: 6, flexShrink: 0,
                      background: `${novaColor}1F`, border: `1px solid ${novaColor}66`,
                    }}>
                      <div style={{ width: 8, height: 8, borderRadius: 4, background: novaColor }} />
                      <span style={{ fontWeight: 600, fontSize: 12, color: "#1B2A4A" }}>
                        NOVA {novaNum || ", "}
                      </span>
                    </div>
                  </div>
                  <div style={{ height: 1, background: "#F3F4F6", marginTop: 12 }} />

                  {/* SECTION D, Accordions */}
                  {/* Nutrition */}
                  <AccordionSection
                    icon={<UtensilsCrossed size={18} />}
                    label="Nutrition"
                    hint={nsGrade ? (
                      <span style={{
                        display: "inline-flex", alignItems: "center", justifyContent: "center",
                        width: 18, height: 18, borderRadius: 4,
                        background: nsColor, color: "#FFF", fontWeight: 700, fontSize: 11,
                      }}>{nsGrade.toUpperCase()}</span>
                    ) : null}
                  >
                    {n ? (
                      <div>
                        {[
                          { label: "Energy", value: n.energyKcal100g, unit: "kcal", level: undefined },
                          { label: "Fat", value: n.fat100g, unit: "g", level: nl?.fat },
                          { label: "  of which Saturates", value: n.saturatedFat100g, unit: "g", level: nl?.saturatedFat },
                          { label: "Carbohydrates", value: n.carbs100g, unit: "g", level: undefined },
                          { label: "  of which Sugars", value: n.sugars100g, unit: "g", level: nl?.sugars },
                          { label: "Fiber", value: n.fiber100g, unit: "g", level: undefined },
                          { label: "Protein", value: n.protein100g, unit: "g", level: undefined },
                          { label: "Salt", value: n.salt100g, unit: "g", level: nl?.salt },
                        ].map((row) => {
                          const levelColor = nutrientLevelHex(row.level);
                          const isIndent = row.label.startsWith("  ");
                          return (
                            <div key={row.label} style={{
                              height: 40, display: "flex", alignItems: "center", justifyContent: "space-between",
                              borderBottom: "1px solid #F9FAFB", position: "relative",
                            }}>
                              {row.level && (
                                <div style={{
                                  position: "absolute", inset: 0,
                                  background: `${levelColor}14`, borderRadius: 4,
                                }} />
                              )}
                              <span style={{
                                fontSize: 13, color: isIndent ? "#6B7280" : "#6B7280",
                                fontWeight: 400, position: "relative",
                                paddingLeft: isIndent ? 12 : 0,
                              }}>{row.label.trim()}</span>
                              <span style={{
                                fontSize: 13, fontWeight: 600, color: "#1B2A4A", position: "relative",
                              }}>
                                {row.value != null ? `${Number(row.value).toFixed(1)} ${row.unit}` : ", "}
                              </span>
                            </div>
                          );
                        })}
                        <p style={{ fontSize: 11, color: "#9CA3AF", marginTop: 8 }}>
                          Per 100g · Source: Open Food Facts
                        </p>
                      </div>
                    ) : (
                      <p style={{ fontSize: 13, color: "#9CA3AF" }}>No nutrition data available.</p>
                    )}
                  </AccordionSection>

                  {/* Additives */}
                  <AccordionSection
                    icon={<FlaskConical size={18} />}
                    label="Additives"
                    hint={addCount === 0 ? (
                      <Leaf size={14} style={{ color: "#2D7D46" }} />
                    ) : (
                      <span style={{
                        display: "inline-flex", alignItems: "center", justifyContent: "center",
                        minWidth: 20, height: 18, borderRadius: 9, padding: "0 5px",
                        background: "#1B2A4A", color: "#FFF", fontWeight: 700, fontSize: 11,
                      }}>{addCount}</span>
                    )}
                  >
                    {addCount > 0 && info.additivesTags ? (
                      <div>
                        {info.additivesTags.map((a) => {
                          const risk = getAdditiveRisk(a);
                          const riskColor = getAdditiveRiskColor(risk);
                          return (
                            <div key={a} style={{
                              height: 44, display: "flex", alignItems: "center",
                              borderBottom: "1px solid #F9FAFB", gap: 10,
                            }}>
                              <div style={{ width: 10, height: 10, borderRadius: 5, background: riskColor, flexShrink: 0 }} />
                              <span style={{ flex: 1, fontSize: 13, minWidth: 0 }}>
                                <span style={{ fontWeight: 600, color: "#1B2A4A" }}>{formatAdditive(a)}</span>
                                <span style={{ color: "#6B7280" }}> · {getAdditiveCommonName(a)}</span>
                              </span>
                              <span style={{
                                fontSize: 10, fontWeight: 700, color: "#FFF",
                                background: riskColor, borderRadius: 11, height: 22,
                                padding: "0 8px", display: "flex", alignItems: "center", flexShrink: 0,
                              }}>{getAdditiveRiskLabel(risk)}</span>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <Leaf size={16} style={{ color: "#2D7D46" }} />
                        <span style={{ fontSize: 13, color: "#2D7D46", fontWeight: 500 }}>No additives detected</span>
                      </div>
                    )}
                  </AccordionSection>

                  {/* Ingredients */}
                  <AccordionSection
                    icon={<List size={18} />}
                    label="Ingredients"
                    hint={
                      <span style={{ fontSize: 11, color: "#9CA3AF", fontWeight: 400 }}>
                        {ingredientCount > 0 ? `${ingredientCount} ingredients` : ""}
                      </span>
                    }
                  >
                    {info.ingredientsText ? (
                      <div style={{ maxHeight: 160, overflowY: "auto" }}>
                        <p style={{ fontSize: 13, color: "#6B7280", lineHeight: 1.7 }}>
                          {info.allergensTags && info.allergensTags.length > 0
                            ? highlightAllergens(info.ingredientsText, info.allergensTags)
                            : info.ingredientsText}
                        </p>
                      </div>
                    ) : (
                      <p style={{ fontSize: 13, color: "#9CA3AF" }}>No ingredients data available.</p>
                    )}
                  </AccordionSection>

                  {/* Bottom spacer for fixed action row */}
                  <div style={{ height: 80 }} />
                </>
              ) : null}
            </div>

            {/* SECTION E, Bottom Action Row */}
            {info && score && (
              <div style={{
                position: "absolute", bottom: 0, left: 0, right: 0,
                height: 72, background: "#FFFFFF", borderTop: "1px solid #F3F4F6",
                display: "flex", alignItems: "center", padding: "0 20px", gap: 12,
                paddingBottom: "env(safe-area-inset-bottom, 0px)",
              }}>
                <button
                  onClick={handleScanAgain}
                  style={{
                    flex: 1, height: 44, borderRadius: 10,
                    border: "1.5px solid #E8314A", background: "#FFF",
                    fontWeight: 600, fontSize: 14, color: "#E8314A",
                    cursor: "pointer",
                  }}
                >Scan Again</button>
                <button
                  onClick={handleSave}
                  style={{
                    flex: 1, height: 44, borderRadius: 10, border: "none",
                    background: saved ? "#FFFFFF" : "#E8314A",
                    fontWeight: 600, fontSize: 14,
                    color: saved ? "#2D7D46" : "#FFFFFF",
                    cursor: "pointer",
                    borderWidth: saved ? 1.5 : 0,
                    borderStyle: "solid",
                    borderColor: saved ? "#2D7D46" : "transparent",
                    transition: "all 0.2s ease",
                  }}
                >{saved ? "Saved ✓" : "Save"}</button>
              </div>
            )}
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
  const pattern = allergenWords.filter(Boolean).map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|");
  if (!pattern) return <>{text}</>;
  const regex = new RegExp(`(${pattern})`, "gi");
  const parts = text.split(regex);
  return (
    <>
      {parts.map((part, i) =>
        regex.test(part) ? (
          <strong key={i} style={{ fontWeight: 700, color: "#1B2A4A" }}>{part}</strong>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </>
  );
}

export default ProductInfoSheet;
