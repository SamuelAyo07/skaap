import { useRef, useState, useEffect, useMemo, forwardRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate, useSearchParams } from "react-router-dom";
import { trackEvent } from "@/lib/analytics";
import { motion, useInView, AnimatePresence } from "framer-motion";
import {
  ScanLine, ChevronDown, Sparkles, Instagram, Linkedin,
  Barcode, Brain, CheckCircle2, Search, Bell, Users, Store,
} from "lucide-react";
import skaapIcon from "@/assets/skaap-icon.png";

const MAILTO = "mailto:oyedemisam@gmail.com";
const spring = { duration: 0.5, ease: [0.34, 1.56, 0.64, 1] as [number, number, number, number] };

const FadeIn = forwardRef<HTMLDivElement, { children: React.ReactNode; className?: string; delay?: number }>(({ children, className = "", delay = 0 }, _r) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-60px" });
  return (
    <motion.div ref={ref} initial={{ opacity: 0, y: 24 }} animate={isInView ? { opacity: 1, y: 0 } : {}} transition={{ ...spring, delay }} className={className}>
      {children}
    </motion.div>
  );
});
FadeIn.displayName = "FadeIn";

/* ────── HERO DEMO: barcode → score loop ────── */
function HeroDemo() {
  const [phase, setPhase] = useState<"scan" | "pause" | "score">("scan");
  useEffect(() => {
    const seq = [
      { p: "scan" as const, t: 1800 },
      { p: "pause" as const, t: 700 },
      { p: "score" as const, t: 2200 },
    ];
    let i = 0;
    const tick = () => {
      setPhase(seq[i].p);
      const delay = seq[i].t;
      i = (i + 1) % seq.length;
      timer = setTimeout(tick, delay);
    };
    let timer = setTimeout(tick, 100);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="relative mx-auto w-full max-w-[280px] aspect-square rounded-3xl overflow-hidden flex items-center justify-center"
      style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
      aria-label="Live demo: barcode scans then shows a 94 out of 100 score">
      <AnimatePresence mode="wait">
        {phase !== "score" ? (
          <motion.div key="bar" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="relative w-[200px] h-[120px] flex items-center justify-center rounded-xl"
            style={{ background: "#fff" }}>
            {/* barcode bars */}
            <div className="flex gap-[3px] items-end h-[80px] px-4">
              {[6,3,5,2,7,3,4,6,2,5,3,7,2,4,6,3,5,4,2,6,3,5,2,7].map((h, i) => (
                <div key={i} style={{ width: 3, height: `${30 + h * 5}px`, background: "#0A0F1E" }} />
              ))}
            </div>
            {/* scanning red line */}
            {phase === "scan" && (
              <motion.div
                initial={{ top: 0 }}
                animate={{ top: "100%" }}
                transition={{ duration: 1.6, ease: "easeInOut" }}
                className="absolute left-0 right-0 h-[2px]"
                style={{ background: "#C41E3A", boxShadow: "0 0 12px #C41E3A" }}
              />
            )}
          </motion.div>
        ) : (
          <motion.div key="score"
            initial={{ scale: 0.6, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: "spring", stiffness: 220, damping: 16 }}
            className="flex flex-col items-center">
            <div className="relative w-[160px] h-[160px]">
              <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90">
                <circle cx="60" cy="60" r="52" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="10" />
                <motion.circle
                  cx="60" cy="60" r="52" fill="none" stroke="#22C55E" strokeWidth="10" strokeLinecap="round"
                  strokeDasharray={2 * Math.PI * 52}
                  initial={{ strokeDashoffset: 2 * Math.PI * 52 }}
                  animate={{ strokeDashoffset: 2 * Math.PI * 52 * (1 - 0.94) }}
                  transition={{ duration: 1.0, ease: "easeOut" }}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-[44px] font-extrabold text-white leading-none">94</span>
                <span className="text-[11px] font-semibold mt-1" style={{ color: "rgba(255,255,255,0.5)" }}>/ 100</span>
              </div>
            </div>
            <span className="mt-3 px-3 py-1 rounded-full text-[12px] font-bold" style={{ background: "rgba(34,197,94,0.15)", color: "#22C55E" }}>
              Excellent
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ────── PRICING SLIDER ────── */
const TIERS = [
  { value: 0, price: "$2.99/mo", label: "Supporter", note: "~$36/yr" },
  { value: 1, price: "$10/yr", label: "Member", note: "$10/yr" },
  { value: 2, price: "$20/yr", label: "Champion", note: "$20/yr" },
  { value: 3, price: "$49/yr", label: "Builder", note: "$49/yr" },
];

function PricingSlider({ onPay }: { onPay: (tierIndex: number) => void }) {
  const [idx, setIdx] = useState(2); // default $20/yr
  const tier = TIERS[idx];

  return (
    <div className="bg-white rounded-3xl p-6 md:p-8" style={{ border: "1px solid #E5E7EB" }}>
      {/* selected display */}
      <div className="text-center mb-6">
        <div className="text-[40px] md:text-[52px] font-extrabold tracking-tighter leading-none" style={{ color: "#0A1220" }}>
          {tier.price}
        </div>
        <div className="mt-2 inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold"
          style={{ background: "rgba(176,32,47,0.08)", color: "#B0202F" }}>
          {tier.label}
        </div>
        <div className="text-[12px] mt-2" style={{ color: "#9CA3AF" }}>{tier.note}</div>
      </div>

      {/* slider */}
      <div className="px-2 mb-3">
        <input
          type="range" min={0} max={3} step={1} value={idx}
          onChange={(e) => setIdx(Number(e.target.value))}
          className="w-full accent-[#B0202F] cursor-pointer"
          aria-label="Choose your support level"
        />
        <div className="flex justify-between mt-2 text-[10px] font-semibold" style={{ color: "#9CA3AF" }}>
          {TIERS.map((t, i) => (
            <button
              key={i} onClick={() => setIdx(i)}
              className="flex flex-col items-center transition-colors"
              style={{ color: i === idx ? "#B0202F" : "#9CA3AF" }}
            >
              <span>{t.price.replace("/mo", "").replace("/yr", "")}</span>
            </button>
          ))}
        </div>
      </div>

      <p className="text-center text-[11px] mt-4" style={{ color: "#9CA3AF" }}>
        Every supporter gets the same features. No commitment. Cancel anytime.
      </p>

      <button
        onClick={() => onPay(idx)}
        className="mt-5 w-full py-4 rounded-2xl font-bold text-sm"
        style={{ background: "#0A1220", color: "#fff" }}
      >
        Support SKAAP — {tier.price}
      </button>
    </div>
  );
}

const Index = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const isFromInstagram = useMemo(() => {
    const src = searchParams.get("utm_source")?.toLowerCase();
    const ref = searchParams.get("ref")?.toLowerCase();
    return src === "instagram" || ref === "ig" || ref === "instagram";
  }, [searchParams]);

  useEffect(() => {
    trackEvent("page_view", { page: "landing", utm_source: searchParams.get("utm_source") }, "/");
  }, []);

  const handleStartScan = () => {
    trackEvent("cta_clicked", { cta: "hero_start_scanning" });
    navigate("/scan");
  };

  const handleSupport = async (tierIndex: number) => {
    trackEvent("cta_clicked", { cta: "support_pay", tier: TIERS[tierIndex].label });
    // Stripe checkout requires auth → route to app sign-in, which can then pop checkout
    navigate("/scan?upgrade=" + TIERS[tierIndex].label.toLowerCase());
  };

  return (
    <div className="min-h-screen font-sans overflow-x-hidden" style={{ background: "#0A0F1E" }}>
      {/* ─── 1. NAV ─── */}
      <nav className="fixed top-0 w-full z-50 glass-nav" style={{ height: 64 }}>
        <div className="max-w-6xl mx-auto flex items-center justify-between px-5 h-full">
          <div className="flex items-center gap-2.5">
            <img src={skaapIcon} alt="SKAAP" className="w-7 h-7 rounded-lg" width="28" height="28" />
            <span className="font-extrabold text-xl tracking-tight text-white">SKAAP</span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm font-medium" style={{ color: "rgba(255,255,255,0.5)" }}>
            <a href="#how" className="hover:text-white transition-colors">How it works</a>
            <a href="#pricing" className="hover:text-white transition-colors">Pricing</a>
            <a href={MAILTO} className="hover:text-white transition-colors">Contact</a>
          </div>
          <div className="flex items-center gap-3">
            <a href="https://www.instagram.com/useskaap?igsh=MWV5aDY5ZHJzam1keQ%3D%3D&utm_source=qr" target="_blank" rel="noopener noreferrer" aria-label="Instagram" style={{ color: "rgba(255,255,255,0.4)" }}><Instagram size={18} /></a>
            <a href="https://www.linkedin.com/company/skaaptech/" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn" style={{ color: "rgba(255,255,255,0.4)" }}><Linkedin size={18} /></a>
            <button onClick={() => navigate("/scan")} className="text-sm font-semibold px-3 py-1.5 rounded-full" style={{ background: "#C41E3A", color: "#fff" }}>Scan</button>
          </div>
        </div>
      </nav>

      {/* ─── 2. HERO ─── */}
      <section className="relative flex items-center justify-center"
        style={{ minHeight: "92vh", paddingTop: 80, paddingBottom: 40, background: "radial-gradient(ellipse at 50% 30%, #1a1f3a 0%, #0A0F1E 70%)" }}>
        <div className="absolute top-20 right-10 w-64 h-64 rounded-full pointer-events-none" style={{ background: "rgba(196,30,58,0.10)", filter: "blur(80px)" }} />

        <div className="w-full max-w-[680px] mx-auto px-5 text-center relative z-10">
          <motion.h1
            initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ ...spring, delay: 0.05 }}
            className="font-extrabold tracking-tighter leading-[1.05] text-white"
            style={{ fontSize: "clamp(34px, 8vw, 64px)" }}
          >
            Know what you're eating.<br />
            <span className="text-gradient">In 2 seconds.</span>
          </motion.h1>

          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
            className="mt-5 text-base md:text-lg" style={{ color: "rgba(255,255,255,0.55)" }}>
            Scan any product. Instant health score. No guesswork.
          </motion.p>

          {/* Hero demo */}
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.3 }} className="mt-8">
            <HeroDemo />
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="flex items-center justify-center mt-8">
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={handleStartScan}
              className="flex items-center justify-center gap-2.5 px-8 py-4 rounded-2xl font-bold text-base cta-pulse"
              style={{ background: "linear-gradient(135deg, #C41E3A, #a11830)", color: "#fff" }}
            >
              <ScanLine size={18} /> Start Scanning — It's Free
            </motion.button>
          </motion.div>

          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}
            className="mt-5 text-xs" style={{ color: "rgba(255,255,255,0.35)" }}>
            <strong className="text-white/60">2,000 products</strong> skapped worldwide. Scanning is always free.
          </motion.p>
        </div>
      </section>

      {/* ─── 3. HOW IT WORKS ─── */}
      <section id="how" className="py-14 bg-white">
        <div className="max-w-4xl mx-auto px-5">
          <FadeIn>
            <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-center mb-10" style={{ color: "#0A1220" }}>
              How it works
            </h2>
          </FadeIn>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { Icon: Barcode, title: "Scan", desc: "Point your camera at any barcode." },
              { Icon: Brain, title: "Decode", desc: "Instant score. Ingredients explained in plain English." },
              { Icon: CheckCircle2, title: "Decide", desc: "Know exactly what you're putting in your body." },
            ].map(({ Icon, title, desc }, i) => (
              <FadeIn key={i} delay={i * 0.08}>
                <div className="bg-white rounded-2xl p-5 text-center" style={{ border: "1px solid #E5E7EB" }}>
                  <div className="w-12 h-12 mx-auto rounded-xl flex items-center justify-center mb-3" style={{ background: "rgba(196,30,58,0.08)" }}>
                    <Icon size={22} color="#C41E3A" />
                  </div>
                  <h3 className="font-extrabold text-base tracking-tight" style={{ color: "#0A1220" }}>
                    <span style={{ color: "#C41E3A" }}>{i + 1}.</span> {title}
                  </h3>
                  <p className="text-[13px] mt-1.5 leading-snug" style={{ color: "#6B7280" }}>{desc}</p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ─── 4. BEAUTY & PRODUCT SCANNER ─── */}
      <section className="py-14" style={{ background: "#F9FAFB" }}>
        <div className="max-w-5xl mx-auto px-5">
          <FadeIn>
            <div className="text-center mb-8">
              <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full mb-3" style={{ background: "rgba(196,30,58,0.08)", color: "#C41E3A" }}>
                🌿 Food + Beauty Scanner
              </span>
              <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight" style={{ color: "#0A1220" }}>
                Your personal product analyst.
              </h2>
              <p className="text-sm mt-2 max-w-xl mx-auto" style={{ color: "#6B7280" }}>
                Scan groceries, snacks, cosmetics, and skincare. Instant safety analysis on 4M+ products worldwide.
              </p>
            </div>
          </FadeIn>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-2.5 mb-5">
            {[
              { emoji: "🎯", title: "SKAAP Score", desc: "0–100 health score" },
              { emoji: "🅰️", title: "Nutri-Score", desc: "A to E grade" },
              { emoji: "🧪", title: "Additives", desc: "E-numbers decoded" },
              { emoji: "🏭", title: "NOVA", desc: "Processing level 1–4" },
              { emoji: "💄", title: "Cosmetics", desc: "Beauty safety" },
              { emoji: "📊", title: "Nutrition", desc: "Color-coded breakdown" },
            ].map((item, i) => (
              <FadeIn key={i} delay={i * 0.04}>
                <div className="bg-white rounded-2xl p-3.5 text-center" style={{ border: "1px solid #E5E7EB" }}>
                  <span className="text-xl block mb-1.5">{item.emoji}</span>
                  <h3 className="font-bold text-[13px] tracking-tight" style={{ color: "#0A1220" }}>{item.title}</h3>
                  <p className="text-[10px] mt-0.5 leading-snug" style={{ color: "#9CA3AF" }}>{item.desc}</p>
                </div>
              </FadeIn>
            ))}
          </div>

          <FadeIn delay={0.25}>
            <div className="bg-white rounded-2xl p-4 flex items-center gap-4 max-w-2xl mx-auto" style={{ border: "1px solid #E5E7EB" }}>
              <div className="flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: "rgba(196,30,58,0.1)" }}>
                <ScanLine size={20} color="#C41E3A" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold tracking-tight" style={{ color: "#0A1220" }}>3M+ food. 1M+ cosmetics.</p>
                <p className="text-[11px] mt-0.5" style={{ color: "#9CA3AF" }}>Works in any store, worldwide.</p>
              </div>
              <button onClick={handleStartScan} className="px-4 py-2 rounded-full text-xs font-semibold flex-shrink-0" style={{ background: "#C41E3A", color: "#fff" }}>
                Scan now
              </button>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ─── 5. SCAN & GO (B2B compact) ─── */}
      <section className="py-14 bg-white">
        <div className="max-w-3xl mx-auto px-5 text-center">
          <FadeIn>
            <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full mb-3" style={{ background: "rgba(10,18,32,0.06)", color: "#0A1220" }}>
              <Store size={12} /> For Stores
            </span>
            <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight" style={{ color: "#0A1220" }}>
              Checkout, reimagined for independent grocery.
            </h2>
            <p className="text-sm mt-3 max-w-xl mx-auto" style={{ color: "#6B7280" }}>
              No hardware. No overhaul. Give your shoppers a faster, frictionless checkout from day one.
            </p>
            <a
              href={MAILTO}
              className="inline-flex items-center gap-2 mt-6 px-6 py-3 rounded-2xl font-bold text-sm"
              style={{ background: "#0A1220", color: "#fff" }}
            >
              Partner With Us →
            </a>
          </FadeIn>
        </div>
      </section>

      {/* ─── 6. PRICING ─── */}
      <section id="pricing" className="py-16" style={{ background: "#F9FAFB" }}>
        <div className="max-w-3xl mx-auto px-5">
          <FadeIn>
            <div className="text-center mb-8">
              <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight" style={{ color: "#0A1220" }}>
                Open pricing & commitment-free.
              </h2>
              <p className="text-sm mt-3 max-w-xl mx-auto" style={{ color: "#6B7280" }}>
                Scanning is free, forever. Support the mission and unlock your full SKAAP experience — pay whatever feels right.
              </p>
            </div>
          </FadeIn>

          {/* Free tier banner */}
          <FadeIn delay={0.05}>
            <div className="bg-white rounded-2xl p-5 mb-5" style={{ border: "1px solid #E5E7EB" }}>
              <div className="flex items-center gap-2 mb-3">
                <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full" style={{ background: "rgba(34,197,94,0.12)", color: "#16A34A" }}>
                  Free forever
                </span>
              </div>
              <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                {[
                  "Unlimited scans",
                  "Instant health scores",
                  "Full ingredient breakdown",
                  "No account needed",
                ].map(t => (
                  <div key={t} className="flex items-center gap-2 text-[13px]" style={{ color: "#0A1220" }}>
                    <CheckCircle2 size={14} color="#16A34A" /> {t}
                  </div>
                ))}
              </div>
            </div>
          </FadeIn>

          {/* Slider */}
          <FadeIn delay={0.1}>
            <PricingSlider onPay={handleSupport} />
          </FadeIn>

          {/* Unlock cards */}
          <FadeIn delay={0.15}>
            <h3 className="text-center text-xs font-bold uppercase tracking-widest mt-10 mb-4" style={{ color: "#9CA3AF" }}>
              What supporters unlock
            </h3>
            <div className="grid grid-cols-2 gap-2.5">
              {[
                { Icon: Sparkles, title: "AI Personalization", desc: "SKAAP learns your goals and flags what matters to you." },
                { Icon: Users, title: "Community Intelligence", desc: "See what's trending in your community." },
                { Icon: Search, title: "Search without scanning", desc: "Find any product by name." },
                { Icon: Bell, title: "Custom alerts", desc: "Gluten, lactose, vegan, palm oil & more." },
              ].map(({ Icon, title, desc }, i) => (
                <div key={i} className="bg-white rounded-2xl p-4" style={{ border: "1px solid #E5E7EB" }}>
                  <Icon size={18} color="#C41E3A" />
                  <h4 className="font-bold text-[13px] tracking-tight mt-2" style={{ color: "#0A1220" }}>{title}</h4>
                  <p className="text-[11px] mt-1 leading-snug" style={{ color: "#6B7280" }}>{desc}</p>
                </div>
              ))}
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ─── 7. FOOTER ─── */}
      <footer className="py-8" style={{ background: "#0A0F1E", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
        <div className="max-w-6xl mx-auto px-5">
          <div className="flex flex-col items-center gap-4">
            <div className="flex items-center gap-2.5">
              <img src={skaapIcon} alt="SKAAP" className="w-7 h-7 rounded-lg" width="28" height="28" />
              <div>
                <span className="font-bold text-white tracking-tight text-sm">SKAAP</span>
                <p className="text-[10px]" style={{ color: "rgba(255,255,255,0.25)" }}>Know what's in your food.</p>
              </div>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs font-medium" style={{ color: "rgba(255,255,255,0.4)" }}>
              <a href="#how" className="hover:text-white transition-colors">How it works</a>
              <a href="#pricing" className="hover:text-white transition-colors">Pricing</a>
              <a href={MAILTO} className="hover:text-white transition-colors">Contact</a>
              <a href={MAILTO} className="hover:text-white transition-colors">Support</a>
              <a href={MAILTO} className="hover:text-white transition-colors">Partner</a>
            </div>
            <div className="flex items-center gap-4">
              <a href="https://www.instagram.com/useskaap?igsh=MWV5aDY5ZHJzam1keQ%3D%3D&utm_source=qr" target="_blank" rel="noopener noreferrer" aria-label="Instagram" style={{ color: "rgba(255,255,255,0.4)" }}><Instagram size={18} /></a>
              <a href="https://www.linkedin.com/company/skaaptech/" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn" style={{ color: "rgba(255,255,255,0.4)" }}><Linkedin size={18} /></a>
            </div>
          </div>
          <div className="mt-6 pt-6 text-center" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
            <p className="text-[10px]" style={{ color: "rgba(255,255,255,0.15)" }}>© 2026 SKAAP Technologies Inc.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
