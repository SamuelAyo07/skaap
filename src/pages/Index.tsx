import { useRef, useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate, useSearchParams } from "react-router-dom";
import { trackEvent } from "@/lib/analytics";
import { motion, useInView } from "framer-motion";
import {
  Store, ScanLine, Mail, ArrowRight, ChevronDown, Sparkles, Instagram, Linkedin,
  Heart, Users, Zap, Smartphone, Barcode,
} from "lucide-react";
import skaapIcon from "@/assets/skaap-icon.png";
import stepScan from "@/assets/step-scan.webp";
import stepPay from "@/assets/step-pay.webp";
import stepReceipt from "@/assets/step-receipt.webp";
import {
  NUTELLA_DEMO, calculateSkaapScore, getScoreColor,
  getAdditiveRisk, getAdditiveRiskLabel, getAdditiveRiskColor,
} from "@/lib/skaapScore";

const FadeIn = ({ children, className = "", delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-60px" });
  return (
    <motion.div ref={ref} initial={{ opacity: 0, y: 24 }} animate={isInView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.45, delay, ease: [0.25, 0.46, 0.45, 0.94] }} className={className}>
      {children}
    </motion.div>
  );
};

// Inline SVG QR code for https://useskaap.com/scan
// Pre-rendered as static SVG path data (simplified QR)
const QRCode = () => (
  <svg viewBox="0 0 29 29" width="120" height="120" style={{ shapeRendering: "crispEdges" }}>
    <rect width="29" height="29" fill="#fff" />
    <g fill="#1B2A4A">
      {/* Position patterns */}
      <rect x="0" y="0" width="7" height="1"/><rect x="0" y="6" width="7" height="1"/>
      <rect x="0" y="0" width="1" height="7"/><rect x="6" y="0" width="1" height="7"/>
      <rect x="2" y="2" width="3" height="3"/>
      <rect x="22" y="0" width="7" height="1"/><rect x="22" y="6" width="7" height="1"/>
      <rect x="22" y="0" width="1" height="7"/><rect x="28" y="0" width="1" height="7"/>
      <rect x="24" y="2" width="3" height="3"/>
      <rect x="0" y="22" width="7" height="1"/><rect x="0" y="28" width="7" height="1"/>
      <rect x="0" y="22" width="1" height="7"/><rect x="6" y="22" width="1" height="7"/>
      <rect x="2" y="24" width="3" height="3"/>
      {/* Timing */}
      <rect x="8" y="6" width="1" height="1"/><rect x="10" y="6" width="1" height="1"/>
      <rect x="12" y="6" width="1" height="1"/><rect x="14" y="6" width="1" height="1"/>
      <rect x="16" y="6" width="1" height="1"/><rect x="18" y="6" width="1" height="1"/>
      <rect x="20" y="6" width="1" height="1"/>
      <rect x="6" y="8" width="1" height="1"/><rect x="6" y="10" width="1" height="1"/>
      <rect x="6" y="12" width="1" height="1"/><rect x="6" y="14" width="1" height="1"/>
      <rect x="6" y="16" width="1" height="1"/><rect x="6" y="18" width="1" height="1"/>
      <rect x="6" y="20" width="1" height="1"/>
      {/* Data modules (approximation for useskaap.com/scan) */}
      <rect x="8" y="8" width="1" height="1"/><rect x="10" y="8" width="1" height="1"/>
      <rect x="12" y="8" width="2" height="1"/><rect x="15" y="8" width="1" height="1"/>
      <rect x="17" y="8" width="2" height="1"/><rect x="20" y="8" width="1" height="1"/>
      <rect x="9" y="9" width="1" height="1"/><rect x="11" y="9" width="1" height="1"/>
      <rect x="13" y="9" width="2" height="1"/><rect x="16" y="9" width="1" height="1"/>
      <rect x="19" y="9" width="2" height="1"/>
      <rect x="8" y="10" width="2" height="1"/><rect x="11" y="10" width="1" height="1"/>
      <rect x="14" y="10" width="1" height="1"/><rect x="17" y="10" width="1" height="1"/>
      <rect x="19" y="10" width="1" height="1"/>
      <rect x="9" y="11" width="1" height="1"/><rect x="12" y="11" width="2" height="1"/>
      <rect x="15" y="11" width="1" height="1"/><rect x="18" y="11" width="2" height="1"/>
      <rect x="8" y="12" width="1" height="1"/><rect x="10" y="12" width="2" height="1"/>
      <rect x="13" y="12" width="1" height="1"/><rect x="16" y="12" width="2" height="1"/>
      <rect x="20" y="12" width="1" height="1"/>
      <rect x="9" y="13" width="2" height="1"/><rect x="12" y="13" width="1" height="1"/>
      <rect x="15" y="13" width="2" height="1"/><rect x="18" y="13" width="1" height="1"/>
      <rect x="8" y="14" width="1" height="1"/><rect x="11" y="14" width="1" height="1"/>
      <rect x="14" y="14" width="2" height="1"/><rect x="17" y="14" width="1" height="1"/>
      <rect x="19" y="14" width="2" height="1"/>
      <rect x="10" y="15" width="1" height="1"/><rect x="13" y="15" width="2" height="1"/>
      <rect x="16" y="15" width="1" height="1"/><rect x="19" y="15" width="1" height="1"/>
      <rect x="8" y="16" width="2" height="1"/><rect x="12" y="16" width="1" height="1"/>
      <rect x="15" y="16" width="2" height="1"/><rect x="18" y="16" width="1" height="1"/>
      <rect x="20" y="16" width="1" height="1"/>
      <rect x="9" y="17" width="1" height="1"/><rect x="11" y="17" width="2" height="1"/>
      <rect x="14" y="17" width="1" height="1"/><rect x="17" y="17" width="2" height="1"/>
      <rect x="8" y="18" width="1" height="1"/><rect x="10" y="18" width="1" height="1"/>
      <rect x="13" y="18" width="1" height="1"/><rect x="16" y="18" width="1" height="1"/>
      <rect x="19" y="18" width="2" height="1"/>
      <rect x="9" y="19" width="2" height="1"/><rect x="12" y="19" width="2" height="1"/>
      <rect x="15" y="19" width="1" height="1"/><rect x="18" y="19" width="1" height="1"/>
      <rect x="8" y="20" width="1" height="1"/><rect x="11" y="20" width="1" height="1"/>
      <rect x="14" y="20" width="2" height="1"/><rect x="17" y="20" width="1" height="1"/>
      <rect x="20" y="20" width="1" height="1"/>
      {/* Bottom-right data */}
      <rect x="22" y="8" width="1" height="1"/><rect x="24" y="8" width="2" height="1"/>
      <rect x="27" y="8" width="1" height="1"/>
      <rect x="23" y="9" width="1" height="1"/><rect x="25" y="9" width="1" height="1"/>
      <rect x="22" y="10" width="2" height="1"/><rect x="26" y="10" width="2" height="1"/>
      <rect x="8" y="22" width="1" height="1"/><rect x="10" y="22" width="2" height="1"/>
      <rect x="13" y="22" width="1" height="1"/><rect x="16" y="22" width="2" height="1"/>
      <rect x="9" y="23" width="1" height="1"/><rect x="12" y="23" width="2" height="1"/>
      <rect x="15" y="23" width="1" height="1"/><rect x="18" y="23" width="1" height="1"/>
      <rect x="8" y="24" width="2" height="1"/><rect x="11" y="24" width="1" height="1"/>
      <rect x="14" y="24" width="1" height="1"/><rect x="17" y="24" width="2" height="1"/>
    </g>
  </svg>
);

// Static EAN-13 barcode SVG for 3017620422003
const EAN13Barcode = () => (
  <svg viewBox="0 0 220 80" width="220" height="80" className="mx-auto">
    <rect width="220" height="80" fill="#fff" rx="4" />
    {/* Simplified barcode bars */}
    <g fill="#1B2A4A">
      {Array.from({ length: 60 }, (_, i) => {
        const x = 20 + i * 3;
        const w = i % 3 === 0 ? 2 : 1;
        const h = i === 0 || i === 29 || i === 59 ? 55 : 48;
        return <rect key={i} x={x} y={8} width={w} height={h} />;
      })}
    </g>
    <text x="110" y="74" textAnchor="middle" fontSize="10" fill="#6B7280" fontFamily="Inter, system-ui">3017620422003</text>
  </svg>
);

const Index = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [faqOpen, setFaqOpen] = useState<number | null>(null);
  const [demoExpanded, setDemoExpanded] = useState(false);

  // Instagram UTM detection
  const isFromInstagram = useMemo(() => {
    const src = searchParams.get("utm_source")?.toLowerCase();
    const ref = searchParams.get("ref")?.toLowerCase();
    return src === "instagram" || ref === "ig" || ref === "instagram";
  }, [searchParams]);

  // Pre-compute Nutella score
  const nutellaScore = useMemo(() =>
    calculateSkaapScore(NUTELLA_DEMO.nutriScoreGrade, NUTELLA_DEMO.additivesTags, NUTELLA_DEMO.labelsTags),
  []);

  useEffect(() => {
    trackEvent("page_view", { page: "landing", utm_source: searchParams.get("utm_source") }, "/");
  }, []);

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || submitting) return;
    setSubmitting(true);
    try {
      await supabase.functions.invoke("contact-notify", { body: { email, type: "general" } });
      setSubmitted(true);
    } catch (err) {
      console.error("Submit error:", err);
    } finally {
      setSubmitting(false);
    }
  };

  const faqs = [
    { q: "How does SKAAP work?", a: "Scan items with your phone as you shop, pay in-app, show your QR receipt at the exit. No lines, no registers. Our nutrition scanner works with 3M+ food products and 1M+ cosmetics." },
    { q: "Which stores support SKAAP?", a: "Any grocery store, anywhere in the world. SKAAP uses your location to find real stores near you — and our nutrition scanner works with 3M+ food products and 1M+ cosmetics via Open Food Facts & Open Beauty Facts." },
    { q: "Is it secure?", a: "Bank-level 256-bit encryption. Payment data is tokenized and never stored on our servers." },
    { q: "What does it cost for stores?", a: "Free for 90 days. Then a simple monthly plan — no per-transaction fees." },
  ];

  const heroHeadline = isFromInstagram
    ? "You saw it on Instagram.\nNow try it."
    : "Know what's in\nyour food.";

  const desktopSub = isFromInstagram
    ? "No signup. No download. Just point your camera."
    : "Scan any barcode. See Nutri-Score, ingredients, and additives instantly. Free.";

  const mobileSub = isFromInstagram
    ? "Tap below. Your camera opens instantly."
    : "You're on your phone. Your camera is ready. Tap below.";

  return (
    <div className="min-h-screen bg-background font-sans overflow-x-hidden">
      {/* ─── NAV ─── */}
      <nav className="fixed top-0 w-full z-50 bg-background border-b" style={{ borderColor: "#F3F4F6", height: 64 }}>
        <div className="max-w-6xl mx-auto flex items-center justify-between px-6 h-full">
          <div className="flex items-center gap-2.5">
            <img src={skaapIcon} alt="SKAAP" className="w-7 h-7 rounded-lg" width="28" height="28" />
            <span className="font-extrabold text-xl tracking-tight" style={{ color: "#1B2A4A" }}>Skaap</span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm font-medium" style={{ color: "#6B7280" }}>
            <a href="#how-it-works" className="hover:text-foreground transition-colors">How it Works</a>
            <a href="#retailers" className="hover:text-foreground transition-colors">For Retailers</a>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-3 mr-1">
              <a href="https://www.instagram.com/useskaap?igsh=MWV5aDY5ZHJzam1keQ%3D%3D&utm_source=qr" target="_blank" rel="noopener noreferrer" aria-label="SKAAP on Instagram" className="text-muted-foreground hover:text-foreground transition-colors"><Instagram size={18} /></a>
              <a href="https://www.linkedin.com/company/skaaptech/" target="_blank" rel="noopener noreferrer" aria-label="SKAAP on LinkedIn" className="text-muted-foreground hover:text-foreground transition-colors"><Linkedin size={18} /></a>
            </div>
            <button onClick={() => navigate("/app")} className="text-sm text-muted-foreground hover:text-foreground transition-colors hidden md:block font-medium">Scan & Pay</button>
            <motion.button whileTap={{ scale: 0.95 }} onClick={() => navigate("/scan")} className="px-5 py-2.5 rounded-full text-sm font-semibold hover:opacity-90 transition-opacity flex items-center gap-2" style={{ background: "#E8314A", color: "#fff" }}>
              <ScanLine size={12} /> Try Free Scan
            </motion.button>
          </div>
        </div>
      </nav>

      {/* ─── HERO ─── */}
      <section className="relative bg-background flex items-center justify-center" style={{ minHeight: "85vh", paddingTop: 64 }}>
        <div className="w-full max-w-[640px] mx-auto px-6 text-center">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <h1 className="font-extrabold tracking-tighter leading-[1.1] whitespace-pre-line" style={{ color: "#1B2A4A", fontSize: "clamp(36px, 7vw, 56px)" }}>
              {heroHeadline}
            </h1>

            {/* Desktop subheadline */}
            <p className="hidden md:block mt-4 text-xl" style={{ color: "#6B7280" }}>{desktopSub}</p>
            {/* Mobile subheadline */}
            <p className="md:hidden mt-4 text-base" style={{ color: "#6B7280" }}>{mobileSub}</p>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="mt-10">
            {/* Primary CTA */}
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={() => navigate("/scan")}
              className="w-full md:w-[320px] font-extrabold text-lg flex items-center justify-center gap-3 mx-auto cta-pulse-mobile"
              style={{ background: "#E8314A", color: "#fff", height: 64, borderRadius: 12 }}
            >
              Try Free Scan →
            </motion.button>

            {/* Desktop QR handoff card */}
            <div className="hidden md:flex mt-8 mx-auto items-center gap-5 p-5 rounded-2xl" style={{ background: "#F7F7F7", maxWidth: 440, boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>
              <div className="flex-shrink-0">
                <QRCode />
              </div>
              <div className="text-left">
                <p className="font-semibold text-[15px]" style={{ color: "#1B2A4A" }}>On your phone?</p>
                <p className="text-[13px] mt-1" style={{ color: "#6B7280" }}>Scan this to open SKAAP on your camera</p>
                <p className="text-[11px] mt-2" style={{ color: "#9CA3AF" }}>Works in Safari, Chrome, and all mobile browsers</p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ─── DEMO SECTION ─── */}
      <section className="bg-background" style={{ padding: "64px 20px" }}>
        <div className="mx-auto" style={{ maxWidth: 480 }}>
          <p className="text-center font-semibold text-xs uppercase tracking-widest mb-5" style={{ color: "#9CA3AF", letterSpacing: "0.1em" }}>
            LIVE EXAMPLE SCAN
          </p>

          {/* Demo result card */}
          <div className="rounded-2xl p-5" style={{ background: "#fff", boxShadow: "0 4px 24px rgba(0,0,0,0.08)" }}>
            {/* Product header */}
            <div className="flex items-center gap-3">
              <img
                src={NUTELLA_DEMO.imageUrl}
                alt="Nutella"
                className="rounded-xl object-cover"
                width="64" height="64"
                style={{ width: 64, height: 64 }}
                loading="eager"
              />
              <div>
                <p className="font-extrabold text-base" style={{ color: "#1B2A4A" }}>Nutella</p>
                <p className="text-[13px]" style={{ color: "#6B7280" }}>Ferrero · 400g</p>
              </div>
            </div>

            {/* Score row */}
            <div className="flex gap-3 mt-4">
              <div className="flex-1 flex flex-col items-center justify-center py-3 rounded-xl" style={{ background: "#FF6D00", height: 100 }}>
                <span className="text-[10px] font-semibold uppercase tracking-wider text-white/80" style={{ letterSpacing: "0.05em" }}>NUTRI-SCORE</span>
                <span className="text-[52px] font-extrabold leading-none text-white mt-1">D</span>
              </div>
              <div className="flex-1 flex flex-col items-center justify-center py-3 rounded-xl" style={{ background: "#C62828", height: 100 }}>
                <span className="text-[10px] font-semibold uppercase tracking-wider text-white/80">NOVA GROUP</span>
                <span className="text-[52px] font-extrabold leading-none text-white mt-1">4</span>
                <span className="text-[10px] text-white/80 mt-0.5">Ultra-processed</span>
              </div>
            </div>

            {/* Additive rows — collapsible on mobile */}
            <div className="md:block">
              {/* Mobile toggle */}
              <button
                onClick={() => setDemoExpanded(!demoExpanded)}
                className="md:hidden w-full text-center mt-4 font-semibold text-[13px]"
                style={{ color: "#E8314A" }}
              >
                {demoExpanded ? "Hide details ↑" : "See ingredients & additives ↓"}
              </button>

              <motion.div
                initial={false}
                animate={{ height: demoExpanded ? "auto" : 0, opacity: demoExpanded ? 1 : 0 }}
                className="overflow-hidden md:!h-auto md:!opacity-100"
                transition={{ duration: 0.2 }}
              >
                <div className="mt-4 space-y-0">
                  {NUTELLA_DEMO.additivesTags.map((tag, i) => {
                    const code = tag.replace(/^en:/, "").toUpperCase();
                    const risk = getAdditiveRisk(tag);
                    const riskLabel = getAdditiveRiskLabel(risk);
                    const riskColor = getAdditiveRiskColor(risk);
                    const names = ["Soy lecithin", "Mono and diglycerides", "Sodium carbonates"];
                    const pillBgs = ["#FEF3C7", "#FEF3C7", "#D1FAE5"];
                    const pillColors = ["#92400E", "#92400E", "#065F46"];
                    return (
                      <div key={tag} className="flex items-center gap-2 py-2" style={{ borderBottom: i < 2 ? "1px solid #F3F4F6" : "none" }}>
                        <span className="font-bold text-[13px]" style={{ color: "#1B2A4A" }}>{code}</span>
                        <span className="text-[13px] flex-1" style={{ color: "#6B7280" }}>{names[i]}</span>
                        <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md" style={{ background: pillBgs[i], color: pillColors[i] }}>
                          {i < 2 ? "Moderate" : "Low risk"}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            </div>
          </div>

          {/* Barcode graphic */}
          <div className="mt-6 text-center">
            <EAN13Barcode />
            <p className="text-xs mt-2" style={{ color: "#9CA3AF" }}>Scan this barcode with your phone to try it yourself</p>
          </div>

          {/* Second CTA */}
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={() => navigate("/scan")}
            className="w-full font-extrabold text-lg flex items-center justify-center gap-3 mt-6 mx-auto"
            style={{ background: "#E8314A", color: "#fff", height: 64, borderRadius: 12 }}
          >
            Try Free Scan →
          </motion.button>
        </div>
      </section>

      {/* ─── HOW IT WORKS ─── */}
      <section id="how-it-works" className="py-14 bg-background">
        <div className="max-w-5xl mx-auto px-6">
          <FadeIn>
            <div className="text-center mb-10">
              <span className="text-xs font-bold uppercase tracking-widest" style={{ color: "#E8314A" }}>How it Works</span>
              <h2 className="text-3xl md:text-4xl font-extrabold mt-2 tracking-tight" style={{ color: "#1B2A4A" }}>Three steps. That's it.</h2>
            </div>
          </FadeIn>
          <div className="grid grid-cols-3 gap-4 md:gap-8 max-w-3xl mx-auto">
            {[
              { img: stepScan, title: "Scan", desc: "Point & scan" },
              { img: stepPay, title: "Pay", desc: "Tap to pay" },
              { img: stepReceipt, title: "Go", desc: "Show & leave" },
            ].map((item, i) => (
              <FadeIn key={i} delay={i * 0.08}>
                <div className="flex flex-col items-center text-center">
                  <motion.div whileHover={{ y: -4 }} className="w-full aspect-[9/16] max-w-[180px] rounded-2xl overflow-hidden mb-3 border" style={{ borderColor: "rgba(0,0,0,0.06)", background: "#F7F7F7" }}>
                    <img src={item.img} alt={`SKAAP ${item.title} step`} className="w-full h-full object-cover" loading="lazy" width="180" height="320" />
                  </motion.div>
                  <h3 className="font-bold text-base tracking-tight" style={{ color: "#1B2A4A" }}>{item.title}</h3>
                  <p className="text-xs mt-0.5" style={{ color: "#6B7280" }}>{item.desc}</p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ─── SMART INFO — NUTRITION CHAMPION ─── */}
      <section className="py-12" style={{ background: "#F7F7F7" }}>
        <div className="max-w-5xl mx-auto px-6">
          <FadeIn>
            <div className="text-center mb-6">
              <div className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full mb-3" style={{ background: "rgba(232,49,74,0.1)", color: "#E8314A" }}>
                🌿 Smart Info
              </div>
              <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight" style={{ color: "#1B2A4A" }}>
                Your personal food &amp; beauty analyst.
              </h2>
              <p className="text-sm mt-2 max-w-xl mx-auto" style={{ color: "#6B7280" }}>
                Scan any product — food or cosmetics — and instantly see what's really inside. SKAAP Score, Nutri-Score, allergens, additives, and ingredient safety decoded in real time.
              </p>
            </div>
          </FadeIn>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-2.5 mb-5">
            {[
              { emoji: "🎯", title: "SKAAP Score", desc: "0–100 health score at a glance" },
              { emoji: "🅰️", title: "Nutri-Score", desc: "A–E nutrition grade" },
              { emoji: "🧪", title: "Additive Risks", desc: "E-numbers decoded with risk levels" },
              { emoji: "🏭", title: "NOVA Processing", desc: "See how processed your food is (1–4)" },
              { emoji: "💄", title: "Cosmetics Safety", desc: "Ingredient analysis for beauty products" },
              { emoji: "📊", title: "Full Nutrition", desc: "Fat, sugar, salt, protein — color-coded" },
            ].map((item, i) => (
              <FadeIn key={i} delay={i * 0.04}>
                <motion.div whileHover={{ y: -2 }} className="bg-background border rounded-2xl p-3.5 text-center" style={{ borderColor: "rgba(0,0,0,0.06)" }}>
                  <span className="text-xl block mb-1.5">{item.emoji}</span>
                  <h3 className="font-bold text-[13px] tracking-tight" style={{ color: "#1B2A4A" }}>{item.title}</h3>
                  <p className="text-[10px] mt-0.5 leading-snug" style={{ color: "#6B7280" }}>{item.desc}</p>
                </motion.div>
              </FadeIn>
            ))}
          </div>

          <FadeIn delay={0.25}>
            <div className="bg-background border rounded-2xl p-4 flex items-center gap-4 max-w-2xl mx-auto" style={{ borderColor: "rgba(0,0,0,0.06)" }}>
              <div className="flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: "#1B2A4A" }}>
                <ScanLine size={20} color="#fff" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold tracking-tight" style={{ color: "#1B2A4A" }}>Walk into any store. Scan anything.</p>
                <p className="text-[11px] mt-0.5" style={{ color: "#6B7280" }}>Works with 3M+ food products and 1M+ cosmetics worldwide.</p>
              </div>
              <motion.button whileTap={{ scale: 0.95 }} onClick={() => navigate("/scan")} className="px-4 py-2 rounded-full text-xs font-semibold flex-shrink-0" style={{ background: "#1B2A4A", color: "#fff" }}>
                Scan Now
              </motion.button>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ─── FOR RETAILERS ─── */}
      <section id="retailers" style={{ background: "#1B2A4A" }} className="py-14">
        <div className="max-w-5xl mx-auto px-6">
          <FadeIn>
            <div className="text-center mb-5">
              <span className="text-xs font-bold uppercase tracking-widest" style={{ color: "#E8314A" }}>For Retailers</span>
              <h2 className="text-3xl md:text-4xl font-extrabold text-white mt-2 tracking-tight">
                Built for the stores<br className="hidden md:block" /> that built your neighborhood
              </h2>
            </div>
          </FadeIn>

          <FadeIn delay={0.1}>
            <div className="rounded-2xl p-6 mb-8 max-w-3xl mx-auto" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}>
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: "#E8314A" }}>
                  <Heart size={18} color="#fff" />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-white tracking-tight mb-1">Your store matters. We're here to prove it.</h3>
                  <p className="text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.45)" }}>
                    The big chains have entire teams building for the future. SKAAP levels the playing field.
                  </p>
                </div>
              </div>
            </div>
          </FadeIn>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-8">
            {[
              { icon: Smartphone, title: "Zero hardware", desc: "Customers use their own phones." },
              { icon: Zap, title: "Live in 48 hours", desc: "Upload inventory, start accepting scan-to-pay." },
              { icon: Users, title: "Happier customers", desc: "Faster trips, more repeat visits." },
            ].map((card, i) => (
              <FadeIn key={i} delay={0.1 + i * 0.06}>
                <motion.div whileHover={{ y: -3 }} className="rounded-2xl p-5" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}>
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3" style={{ background: "#E8314A" }}>
                    <card.icon size={18} color="#fff" />
                  </div>
                  <h3 className="font-bold text-white mb-1 tracking-tight text-sm">{card.title}</h3>
                  <p className="text-xs leading-relaxed" style={{ color: "rgba(255,255,255,0.4)" }}>{card.desc}</p>
                </motion.div>
              </FadeIn>
            ))}
          </div>

          <FadeIn delay={0.2}>
            <div className="text-center space-y-2">
              <a href="#contact" className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full font-bold text-sm hover:opacity-90 transition-opacity" style={{ background: "#E8314A", color: "#fff" }}>
                Get Started — Free for 90 Days <ArrowRight size={14} />
              </a>
              <br />
              <motion.button whileTap={{ scale: 0.97 }} onClick={() => navigate("/app")} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full font-medium text-xs transition-colors" style={{ border: "1px solid rgba(255,255,255,0.2)", color: "rgba(255,255,255,0.6)" }}>
                Try Scan & Pay Demo →
              </motion.button>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ─── FAQ ─── */}
      <section className="py-12 bg-background">
        <div className="max-w-2xl mx-auto px-6">
          <FadeIn><h2 className="text-2xl font-extrabold text-center mb-6 tracking-tight" style={{ color: "#1B2A4A" }}>Questions</h2></FadeIn>
          <div className="space-y-1.5">
            {faqs.map((faq, i) => (
              <FadeIn key={i} delay={i * 0.03}>
                <div className="border rounded-xl overflow-hidden" style={{ borderColor: "#F3F4F6" }}>
                  <button onClick={() => setFaqOpen(faqOpen === i ? null : i)} aria-expanded={faqOpen === i} className="w-full flex items-center justify-between p-3.5 text-left">
                    <span className="font-semibold text-sm" style={{ color: "#1B2A4A" }}>{faq.q}</span>
                    <motion.div animate={{ rotate: faqOpen === i ? 180 : 0 }} transition={{ duration: 0.2 }}><ChevronDown size={14} style={{ color: "#6B7280" }} /></motion.div>
                  </button>
                  {faqOpen === i && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} transition={{ duration: 0.2 }}>
                      <div className="px-3.5 pb-3.5"><p className="text-sm leading-relaxed" style={{ color: "#6B7280" }}>{faq.a}</p></div>
                    </motion.div>
                  )}
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ─── CONTACT ─── */}
      <section id="contact" style={{ background: "#F7F7F7" }} className="py-12">
        <div className="max-w-xl mx-auto px-6 text-center">
          <FadeIn>
            <h2 className="text-2xl font-extrabold mb-2 tracking-tight" style={{ color: "#1B2A4A" }}>Let's talk</h2>
            <p className="text-sm mb-6" style={{ color: "#6B7280" }}>Shopper or store owner — drop your email.</p>
          </FadeIn>
          <FadeIn delay={0.1}>
            {submitted ? (
              <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} className="rounded-2xl p-5 font-semibold" style={{ background: "rgba(45,125,70,0.1)", color: "#2D7D46" }}>✅ Thanks! We'll reach out soon.</motion.div>
            ) : (
              <form onSubmit={handleEmailSubmit} className="flex gap-2">
                <div className="relative flex-1">
                  <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2" style={{ color: "#6B7280" }} />
                  <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="your@email.com" aria-label="Email address" className="w-full bg-background border rounded-full py-3 pl-11 pr-4 text-sm outline-none focus:ring-2 transition-shadow" style={{ borderColor: "#F3F4F6" }} />
                </div>
                <motion.button whileTap={{ scale: 0.95 }} type="submit" disabled={submitting} className="px-5 py-3 rounded-full font-semibold text-sm disabled:opacity-60 hover:opacity-90 transition-opacity" style={{ background: "#1B2A4A", color: "#fff" }}>
                  {submitting ? "Sending…" : "Get in Touch"}
                </motion.button>
              </form>
            )}
          </FadeIn>
        </div>
      </section>

      {/* ─── FOOTER ─── */}
      <footer style={{ background: "#1B2A4A" }} className="py-8">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex flex-col items-center gap-4">
            <div className="flex items-center gap-2.5">
              <img src={skaapIcon} alt="SKAAP" className="w-7 h-7 rounded-lg" width="28" height="28" />
              <div>
                <span className="font-bold text-white tracking-tight text-sm">SKAAP</span>
                <p className="text-[10px]" style={{ color: "rgba(255,255,255,0.3)" }}>Know what's in your food.</p>
              </div>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs font-medium" style={{ color: "rgba(255,255,255,0.5)" }}>
              <a href="#how-it-works" className="hover:text-white transition-colors">How it Works</a>
              <a href="#retailers" className="hover:text-white transition-colors">Retailers</a>
              <button onClick={() => navigate("/scan")} className="hover:text-white transition-colors">Free Scan</button>
              <a href="#contact" className="hover:text-white transition-colors">Contact</a>
            </div>
            <div className="flex items-center gap-4">
              <a href="https://www.instagram.com/useskaap?igsh=MWV5aDY5ZHJzam1keQ%3D%3D&utm_source=qr" target="_blank" rel="noopener noreferrer" aria-label="SKAAP on Instagram" style={{ color: "rgba(255,255,255,0.5)" }}><Instagram size={18} /></a>
              <a href="https://www.linkedin.com/company/skaaptech/" target="_blank" rel="noopener noreferrer" aria-label="SKAAP on LinkedIn" style={{ color: "rgba(255,255,255,0.5)" }}><Linkedin size={18} /></a>
            </div>
          </div>
          <div className="mt-6 pt-6 text-center" style={{ borderTop: "1px solid rgba(255,255,255,0.1)" }}>
            <p className="text-[10px]" style={{ color: "rgba(255,255,255,0.2)" }}>© 2026 SKAAP Technologies Inc.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
