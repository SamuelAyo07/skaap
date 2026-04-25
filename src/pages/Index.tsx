import { useEffect, useMemo, useRef, useState, forwardRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { trackEvent } from "@/lib/analytics";
import { motion, useInView } from "framer-motion";
import { ScanLine, Instagram, Linkedin, Store, Barcode, Brain, CheckCircle2, ShoppingBag } from "lucide-react";
import skaapIcon from "@/assets/skaap-icon.png";

const MAILTO = "mailto:oyedemisam@gmail.com";
const spring = { duration: 0.5, ease: [0.34, 1.56, 0.64, 1] as [number, number, number, number] };

const FadeIn = forwardRef<HTMLDivElement, { children: React.ReactNode; className?: string; delay?: number }>(
  ({ children, className = "", delay = 0 }, _r) => {
    const ref = useRef(null);
    const isInView = useInView(ref, { once: true, margin: "-60px" });
    return (
      <motion.div ref={ref} initial={{ opacity: 0, y: 24 }} animate={isInView ? { opacity: 1, y: 0 } : {}}
        transition={{ ...spring, delay }} className={className}>
        {children}
      </motion.div>
    );
  }
);
FadeIn.displayName = "FadeIn";

/* ─────── PHONE FRAME — visual how it works ─────── */
function PhoneFrame({ children, label }: { children: React.ReactNode; label: string }) {
  return (
    <div className="flex flex-col items-center">
      <div
        className="relative w-[160px] h-[300px] rounded-[28px] overflow-hidden"
        style={{
          background: "#0A1220",
          border: "6px solid #1F2937",
          boxShadow: "0 20px 60px -10px rgba(0,0,0,0.5)",
        }}
      >
        <div className="absolute top-1.5 left-1/2 -translate-x-1/2 w-14 h-3 rounded-full bg-black z-10" />
        <div className="w-full h-full bg-white flex flex-col">
          {children}
        </div>
      </div>
      <p className="text-xs font-semibold mt-3" style={{ color: "rgba(255,255,255,0.55)" }}>{label}</p>
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

  return (
    <div className="min-h-screen font-sans overflow-x-hidden" style={{ background: "#0A0F1E" }}>
      {/* ─── 1. NAV ─── */}
      <nav className="fixed top-0 w-full z-50 glass-nav" style={{ height: 64 }}>
        <div className="max-w-6xl mx-auto flex items-center justify-between px-5 h-full">
          <div className="flex items-center gap-2.5">
            <img src={skaapIcon} alt="SKAAP" className="w-7 h-7 rounded-lg" width="28" height="28" />
            <span className="font-extrabold text-xl tracking-tight text-white">SKAAP</span>
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
        style={{ minHeight: "92vh", paddingTop: 88, paddingBottom: 48, background: "radial-gradient(ellipse at 50% 30%, #1a1f3a 0%, #0A0F1E 70%)" }}>
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

          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="flex items-center justify-center mt-8">
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={handleStartScan}
              className="flex items-center justify-center gap-2.5 px-8 py-4 rounded-2xl font-bold text-base cta-pulse"
              style={{ background: "linear-gradient(135deg, #C41E3A, #a11830)", color: "#fff" }}
            >
              <ScanLine size={18} /> Start Scanning — It's Free
            </motion.button>
          </motion.div>

          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
            className="mt-5 text-xs" style={{ color: "rgba(255,255,255,0.35)" }}>
            <strong className="text-white/60">2,000 products</strong> SKAAPED worldwide. Scanning is always free.
          </motion.p>
        </div>
      </section>

      {/* ─── 3. HOW IT WORKS — phone screens ─── */}
      <section className="py-16" style={{ background: "#0A0F1E" }}>
        <div className="max-w-5xl mx-auto px-5">
          <FadeIn>
            <h2 className="text-center text-2xl md:text-3xl font-extrabold tracking-tight text-white mb-2">
              How it works
            </h2>
            <p className="text-center text-sm mb-12" style={{ color: "rgba(255,255,255,0.45)" }}>
              Three taps. No learning curve.
            </p>
          </FadeIn>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 sm:gap-4 justify-items-center">
            {/* Phone 1 — Scan */}
            <FadeIn delay={0.05}>
              <PhoneFrame label="1. Scan a barcode">
                <div className="flex-1 flex flex-col items-center justify-center px-3 bg-gradient-to-b from-white to-[#fafafa]">
                  <div className="relative w-full aspect-square rounded-2xl flex items-center justify-center mb-3" style={{ background: "#0A1220" }}>
                    <div className="flex gap-[2px] items-end h-[60px]">
                      {[6,3,5,2,7,3,4,6,2,5,3,7,2,4].map((h, i) => (
                        <div key={i} style={{ width: 2, height: `${20 + h * 5}px`, background: "#fff" }} />
                      ))}
                    </div>
                    <div className="absolute left-2 right-2 h-[2px] top-1/2" style={{ background: "#C41E3A", boxShadow: "0 0 10px #C41E3A" }} />
                  </div>
                  <div className="text-[10px] font-semibold" style={{ color: "#0A1220" }}>Point. Tap. Done.</div>
                </div>
              </PhoneFrame>
            </FadeIn>

            {/* Phone 2 — Score */}
            <FadeIn delay={0.15}>
              <PhoneFrame label="2. See your score">
                <div className="flex-1 flex flex-col items-center justify-center px-3">
                  <div className="relative w-[110px] h-[110px]">
                    <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90">
                      <circle cx="60" cy="60" r="52" fill="none" stroke="#F3F4F6" strokeWidth="10" />
                      <circle cx="60" cy="60" r="52" fill="none" stroke="#22C55E" strokeWidth="10" strokeLinecap="round"
                        strokeDasharray={2 * Math.PI * 52}
                        strokeDashoffset={2 * Math.PI * 52 * (1 - 0.94)} />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-[34px] font-extrabold leading-none" style={{ color: "#0A1220" }}>94</span>
                      <span className="text-[9px] font-semibold mt-0.5" style={{ color: "#9CA3AF" }}>/ 100</span>
                    </div>
                  </div>
                  <span className="mt-3 px-2.5 py-0.5 rounded-full text-[10px] font-bold"
                    style={{ background: "rgba(34,197,94,0.15)", color: "#16A34A" }}>Excellent</span>
                </div>
              </PhoneFrame>
            </FadeIn>

            {/* Phone 3 — Decide */}
            <FadeIn delay={0.25}>
              <PhoneFrame label="3. Eat smarter">
                <div className="flex-1 flex flex-col px-3 py-3 gap-1.5">
                  {[
                    { ok: true, t: "No banned additives" },
                    { ok: true, t: "Low in sugar" },
                    { ok: false, t: "Ultra-processed (NOVA 4)" },
                    { ok: true, t: "Plant-based" },
                  ].map((row, i) => (
                    <div key={i} className="flex items-center gap-1.5 py-1.5 px-2 rounded-lg" style={{ background: "#F9FAFB" }}>
                      <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: row.ok ? "#22C55E" : "#F59E0B" }} />
                      <span className="text-[9px] font-medium leading-tight" style={{ color: "#0A1220" }}>{row.t}</span>
                    </div>
                  ))}
                </div>
              </PhoneFrame>
            </FadeIn>
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
              <ShoppingBag size={16} /> Partner With Us →
            </a>
          </FadeIn>
        </div>
      </section>

      {/* ─── 6. FOOTER ─── */}
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
