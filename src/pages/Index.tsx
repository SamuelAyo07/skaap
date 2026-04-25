import { useEffect, useRef, useState, forwardRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { trackEvent } from "@/lib/analytics";
import { motion, useInView } from "framer-motion";
import { ScanLine, Instagram, Linkedin, Store, ShoppingBag, Send, Repeat, TrendingUp, ShieldCheck, Eye, Heart, Sparkles, CreditCard, Clock, Users, AlertTriangle, Check, ChevronDown, Quote, Beaker, FlaskConical, Wheat, Factory } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import skaapIcon from "@/assets/skaap-icon.png";
import productCrackers from "@/assets/product-crackers.png";
import productMacaroni from "@/assets/product-macaroni.png";
import productOj from "@/assets/product-oj.png";


const spring = { duration: 0.5, ease: [0.34, 1.56, 0.64, 1] as [number, number, number, number] };

const FadeIn = forwardRef<HTMLDivElement, { children: React.ReactNode; className?: string; delay?: number }>(
  ({ children, className = "", delay = 0 }, _r) => {
    const ref = useRef(null);
    const isInView = useInView(ref, { once: true, margin: "-40px" });
    return (
      <motion.div ref={ref} initial={{ opacity: 0, y: 16 }} animate={isInView ? { opacity: 1, y: 0 } : {}}
        transition={{ ...spring, delay }} className={className}>
        {children}
      </motion.div>
    );
  }
);
FadeIn.displayName = "FadeIn";

/* ─── Yuka-style product card with REAL product image ─── */
function PhoneMockup({
  productLabel,
  productImage,
  signals,
  verdict,
  scoreColor,
  score,
}: {
  productLabel: string;
  productImage: string;
  signals: { dot: string; text: string }[];
  verdict: string;
  scoreColor: string;
  score: string;
}) {
  return (
    <div
      className="relative mx-auto rounded-[22px] overflow-hidden flex flex-col"
      style={{
        background: "#FFFFFF",
        boxShadow: "0 14px 40px -10px rgba(0,0,0,0.45), 0 0 0 1px rgba(255,255,255,0.06)",
        width: "100%",
        maxWidth: 200,
        aspectRatio: "9 / 16",
      }}
    >
      {/* Top: real product image on cream */}
      <div className="flex flex-col items-center justify-center pt-4 pb-3" style={{ background: "#FBF6E9" }}>
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center bg-white overflow-hidden" style={{ boxShadow: "0 4px 12px -2px rgba(0,0,0,0.08)" }}>
          <img src={productImage} alt={productLabel} className="w-full h-full object-contain p-1" loading="lazy" />
        </div>
        <p className="text-[10px] font-bold mt-2 text-center leading-tight px-2" style={{ color: "#0A1220" }}>{productLabel}</p>
      </div>

      {/* Big score circle */}
      <div className="flex items-center justify-center -mt-5 z-10">
        <div
          className="w-14 h-14 rounded-full flex flex-col items-center justify-center"
          style={{ background: scoreColor, boxShadow: "0 6px 14px -2px rgba(0,0,0,0.18), inset 0 0 0 3px #fff" }}
        >
          <span className="text-base font-extrabold leading-none text-white">{score}</span>
          <span className="text-[7px] font-bold text-white/80 tracking-wide">/100</span>
        </div>
      </div>

      <p className="text-center text-[10px] font-extrabold mt-1" style={{ color: scoreColor }}>{verdict}</p>

      <div className="flex-1 flex flex-col gap-1 px-2.5 mt-2 mb-3">
        {signals.map((s, i) => (
          <div key={i} className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: s.dot }} />
            <span className="text-[8px] font-semibold truncate" style={{ color: "#374151" }}>{s.text}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── Simple FAQ accordion item ─── */
function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="bg-white rounded-xl overflow-hidden" style={{ border: "1px solid #E5E7EB" }}>
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-3 text-left"
      >
        <span className="font-bold text-[13px] tracking-tight" style={{ color: "#0A1220" }}>{q}</span>
        <ChevronDown size={16} className="flex-shrink-0 transition-transform" style={{ transform: open ? "rotate(180deg)" : "none", color: "#6B7280" }} />
      </button>
      {open && (
        <div className="px-4 pb-3 text-[12px] leading-relaxed" style={{ color: "#6B7280" }}>{a}</div>
      )}
    </div>
  );
}


const Index = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [contact, setContact] = useState({ name: "", email: "", message: "", type: "general" });
  const [sending, setSending] = useState(false);

  useEffect(() => {
    trackEvent("page_view", { page: "landing", utm_source: searchParams.get("utm_source") }, "/");
  }, []);

  const handleStartScan = () => {
    trackEvent("cta_clicked", { cta: "hero_start_scanning" });
    navigate("/scan");
  };

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contact.email || !contact.message) {
      toast.error("Please add your email and a message.");
      return;
    }
    setSending(true);
    try {
      const { error } = await supabase.from("contact_submissions").insert({
        name: contact.name || null,
        email: contact.email,
        message: contact.message,
        type: contact.type,
      });
      if (error) throw error;
      // Fire-and-forget notify edge fn
      supabase.functions.invoke("contact-notify", { body: contact }).catch(() => {});
      trackEvent("cta_clicked", { cta: "contact_submitted", type: contact.type });
      toast.success("Thanks! We'll be in touch soon.");
      setContact({ name: "", email: "", message: "", type: contact.type });
    } catch {
      toast.error("Could not send. Please email us directly.");
    }
    setSending(false);
  };

  return (
    <div className="min-h-screen font-sans overflow-x-hidden" style={{ background: "#0A0F1E" }}>
      {/* ─── 1. NAV ─── */}
      <nav className="fixed top-0 w-full z-50 glass-nav" style={{ height: 56 }}>
        <div className="max-w-6xl mx-auto flex items-center justify-between px-5 h-full">
          <div className="flex items-center gap-2">
            <img src={skaapIcon} alt="SKAAP" className="w-7 h-7 rounded-lg" width="28" height="28" />
            <span className="font-extrabold text-lg tracking-tight text-white">SKAAP</span>
          </div>
          <div className="flex items-center gap-3">
            <a href="https://www.instagram.com/useskaap" target="_blank" rel="noopener noreferrer" aria-label="Instagram" style={{ color: "rgba(255,255,255,0.45)" }}><Instagram size={18} /></a>
            <a href="https://www.linkedin.com/company/skaaptech/" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn" style={{ color: "rgba(255,255,255,0.45)" }}><Linkedin size={18} /></a>
            <button onClick={() => navigate("/scan")} className="text-sm font-semibold px-3 py-1.5 rounded-full" style={{ background: "#C41E3A", color: "#fff" }}>Scan</button>
          </div>
        </div>
      </nav>

      {/* ─── 2. HERO — problem-focused / pain-point framing ─── */}
      <section
        className="relative flex items-center justify-center"
        style={{ minHeight: "auto", paddingTop: 80, paddingBottom: 24, background: "radial-gradient(ellipse at 50% 30%, #1a1f3a 0%, #0A0F1E 70%)" }}
      >
        <div className="absolute top-20 right-10 w-64 h-64 rounded-full pointer-events-none" style={{ background: "rgba(196,30,58,0.10)", filter: "blur(80px)" }} />

        <div className="w-full max-w-[680px] mx-auto px-5 text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest mb-3"
            style={{ background: "rgba(196,30,58,0.15)", color: "#FCA5A5", border: "1px solid rgba(196,30,58,0.25)" }}
          >
            <AlertTriangle size={11} /> Labels lie. We don't.
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ ...spring, delay: 0.1 }}
            className="font-extrabold tracking-tighter leading-[1.05] text-white"
            style={{ fontSize: "clamp(30px, 6.5vw, 52px)" }}
          >
            Know what's<br />
            <span className="text-gradient">really in your food.</span>
          </motion.h1>

          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.25 }}
            className="mt-3 text-sm md:text-base max-w-md mx-auto" style={{ color: "rgba(255,255,255,0.6)" }}>
            Scan it. See the score. Skip the bad stuff.
          </motion.p>

          <motion.button
            initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
            whileTap={{ scale: 0.97 }}
            onClick={handleStartScan}
            className="mt-5 inline-flex items-center justify-center gap-2.5 px-7 py-3.5 rounded-2xl font-bold text-sm cta-pulse"
            style={{ background: "linear-gradient(135deg, #C41E3A, #a11830)", color: "#fff" }}
          >
            <ScanLine size={16} /> Scan Your First Product
          </motion.button>

          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.55 }}
            className="mt-3 text-[11px]" style={{ color: "rgba(255,255,255,0.35)" }}>
            Free. No signup.
          </motion.p>
        </div>
      </section>

      {/* ─── 3. HOW IT WORKS — 3 mockups with REAL product images ─── */}
      <section className="py-6" style={{ background: "#0A0F1E" }}>
        <div className="max-w-5xl mx-auto px-4">
          <FadeIn>
            <h2 className="text-center text-xl md:text-2xl font-extrabold tracking-tight text-white mb-1">
              See it in action
            </h2>
            <p className="text-center text-xs mb-5" style={{ color: "rgba(255,255,255,0.45)" }}>
              Scan → Score → Decide.
            </p>
          </FadeIn>

          <div className="grid grid-cols-3 gap-2 md:gap-4 max-w-2xl mx-auto items-end">
            <FadeIn delay={0.05}>
              <PhoneMockup
                productImage={productCrackers}
                productLabel="Snack Crackers"
                signals={[
                  { dot: "#C41E3A", text: "Too much salt" },
                  { dot: "#F59E0B", text: "6 additives" },
                  { dot: "#F59E0B", text: "Ultra-processed" },
                ]}
                verdict="Bad"
                score="21"
                scoreColor="#C41E3A"
              />
            </FadeIn>
            <FadeIn delay={0.15}>
              <PhoneMockup
                productImage={productMacaroni}
                productLabel="Mac & Cheese Box"
                signals={[
                  { dot: "#C41E3A", text: "High sodium" },
                  { dot: "#C41E3A", text: "7 additives" },
                  { dot: "#F59E0B", text: "Low fiber" },
                ]}
                verdict="Bad"
                score="14"
                scoreColor="#C41E3A"
              />
            </FadeIn>
            <FadeIn delay={0.25}>
              <PhoneMockup
                productImage={productOj}
                productLabel="100% Orange Juice"
                signals={[
                  { dot: "#22C55E", text: "No additives" },
                  { dot: "#22C55E", text: "Vitamin C rich" },
                  { dot: "#F59E0B", text: "Watch sugar" },
                ]}
                verdict="Good"
                score="78"
                scoreColor="#22C55E"
              />
            </FadeIn>
          </div>
        </div>
      </section>

      {/* ─── 4. PERSONAL PRODUCT ANALYST (moved UP) ─── */}
      <section className="py-7" style={{ background: "#F9FAFB" }}>
        <div className="max-w-5xl mx-auto px-5">
          <FadeIn>
            <div className="text-center mb-4">
              <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight" style={{ color: "#0A1220" }}>
                One scan. Everything you need.
              </h2>
              <p className="text-xs mt-1" style={{ color: "#6B7280" }}>
                Food and beauty. Over 4 million products.
              </p>
            </div>
          </FadeIn>

          <div className="grid grid-cols-3 md:grid-cols-6 gap-2 max-w-3xl mx-auto">
            {[
              { emoji: "🎯", title: "SKAAP Score" },
              { emoji: "🅰️", title: "Nutri-Score" },
              { emoji: "🧪", title: "Additives" },
              { emoji: "🏭", title: "NOVA" },
              { emoji: "💄", title: "Cosmetics" },
              { emoji: "📊", title: "Nutrition" },
            ].map((item, i) => (
              <FadeIn key={i} delay={i * 0.03}>
                <div className="bg-white rounded-xl p-2.5 text-center" style={{ border: "1px solid #E5E7EB" }}>
                  <span className="text-lg block">{item.emoji}</span>
                  <h3 className="font-bold text-[11px] tracking-tight mt-0.5" style={{ color: "#0A1220" }}>{item.title}</h3>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ─── 5. PWA INSTALL — iOS Share + Android Install ─── */}
      <section className="py-7" style={{ background: "#FBF6E9" }}>
        <div className="max-w-3xl mx-auto px-5">
          <FadeIn>
            <div className="text-center mb-4">
              <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full mb-2" style={{ background: "rgba(196,30,58,0.1)", color: "#C41E3A" }}>
                📱 Get the app
              </span>
              <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight" style={{ color: "#0A1220" }}>
                Put SKAAP on your phone.
              </h2>
              <p className="text-xs mt-1" style={{ color: "#6B7280" }}>
                One tap. No app store. Works offline.
              </p>
            </div>
          </FadeIn>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <FadeIn delay={0.05}>
              <div className="bg-white rounded-2xl p-4 h-full" style={{ border: "1px solid rgba(10,18,32,0.06)" }}>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-lg">🍎</span>
                  <h3 className="font-extrabold text-[14px]" style={{ color: "#0A1220" }}>iPhone (Safari)</h3>
                </div>
                <ol className="space-y-1.5 text-[12px]" style={{ color: "#374151" }}>
                  <li className="flex gap-2"><span className="font-bold text-[#C41E3A]">1.</span> Tap the <strong>Share</strong> button (📤 bottom bar)</li>
                  <li className="flex gap-2"><span className="font-bold text-[#C41E3A]">2.</span> Pick <strong>"Add to Home Screen"</strong></li>
                  <li className="flex gap-2"><span className="font-bold text-[#C41E3A]">3.</span> Tap <strong>Add</strong>. Done.</li>
                </ol>
              </div>
            </FadeIn>
            <FadeIn delay={0.12}>
              <div className="bg-white rounded-2xl p-4 h-full" style={{ border: "1px solid rgba(10,18,32,0.06)" }}>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-lg">🤖</span>
                  <h3 className="font-extrabold text-[14px]" style={{ color: "#0A1220" }}>Android (Chrome)</h3>
                </div>
                <ol className="space-y-1.5 text-[12px]" style={{ color: "#374151" }}>
                  <li className="flex gap-2"><span className="font-bold text-[#C41E3A]">1.</span> Tap the <strong>menu</strong> (⋮ top right)</li>
                  <li className="flex gap-2"><span className="font-bold text-[#C41E3A]">2.</span> Pick <strong>"Install app"</strong></li>
                  <li className="flex gap-2"><span className="font-bold text-[#C41E3A]">3.</span> Tap <strong>Install</strong>. Done.</li>
                </ol>
              </div>
            </FadeIn>
          </div>
        </div>
      </section>

      {/* ─── 6. KNOW YOUR FOOD (moved DOWN) — with "What we scan" checklist ─── */}
      <section className="py-8" style={{ background: "#FBF6E9" }}>
        <div className="max-w-3xl mx-auto px-5">
          <FadeIn>
            <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full mb-3" style={{ background: "rgba(196,30,58,0.1)", color: "#C41E3A" }}>
              <Eye size={12} /> Know your food
            </span>
            <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight mb-2" style={{ color: "#0A1220" }}>
              The food industry hides what's in your food. We don't.
            </h2>
            <p className="text-sm leading-relaxed" style={{ color: "#374151" }}>
              SKAAP scans any product barcode and breaks down what's actually inside — in plain English. Built for anyone who wants to know more about what they eat.
            </p>
          </FadeIn>

          {/* What we scan checklist */}
          <FadeIn delay={0.1}>
            <div className="bg-white rounded-2xl p-4 mt-5" style={{ border: "1px solid rgba(10,18,32,0.06)" }}>
              <p className="text-[11px] font-bold uppercase tracking-widest mb-3" style={{ color: "#6B7280" }}>What we scan for</p>
              <div className="grid grid-cols-2 gap-x-3 gap-y-2">
                {[
                  { icon: Beaker, label: "Hidden sugar" },
                  { icon: FlaskConical, label: "Harmful additives" },
                  { icon: Wheat, label: "Allergens" },
                  { icon: Factory, label: "Ultra-processing" },
                ].map((item, i) => {
                  const Icon = item.icon;
                  return (
                    <div key={i} className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0" style={{ background: "rgba(34,197,94,0.12)" }}>
                        <Check size={12} color="#22C55E" strokeWidth={3} />
                      </span>
                      <Icon size={12} color="#6B7280" />
                      <span className="text-[12px] font-semibold" style={{ color: "#0A1220" }}>{item.label}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </FadeIn>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-5">
            {[
              { icon: Heart, title: "Why we built it", desc: "Most 'healthy' labels lie. We surface the truth in 2 seconds." },
              { icon: Sparkles, title: "How it works", desc: "Open Food Facts + USDA + AI explainers. No ads. No tracking." },
              { icon: Users, title: "Who it's for", desc: "Anyone who wants to know more about what they eat. Free forever." },
            ].map((item, i) => {
              const Icon = item.icon;
              return (
                <FadeIn key={i} delay={i * 0.05}>
                  <div className="bg-white rounded-2xl p-3.5" style={{ border: "1px solid rgba(10,18,32,0.06)" }}>
                    <Icon size={18} color="#C41E3A" />
                    <h3 className="font-bold text-[13px] tracking-tight mt-2" style={{ color: "#0A1220" }}>{item.title}</h3>
                    <p className="text-[11px] mt-1 leading-snug" style={{ color: "#6B7280" }}>{item.desc}</p>
                  </div>
                </FadeIn>
              );
            })}
          </div>
        </div>
      </section>

      {/* ─── 7. BUILD HABIT (Members) ─── */}
      <section className="py-6 bg-white">
        <div className="max-w-3xl mx-auto px-5">
          <FadeIn>
            <div className="text-center mb-4">
              <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full mb-2" style={{ background: "rgba(196,30,58,0.08)", color: "#C41E3A" }}>
                ✦ For Members
              </span>
              <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight" style={{ color: "#0A1220" }}>
                Build the habit. Not the app addiction.
              </h2>
              <p className="text-xs mt-2 max-w-md mx-auto" style={{ color: "#6B7280" }}>
                Weekly nudges. Repeat-behavior rewards. Real-life change.
              </p>
            </div>
          </FadeIn>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            {[
              { icon: TrendingUp, title: "Your weekly grocery score", desc: "Every Sunday, see how clean your week was." },
              { icon: ShieldCheck, title: "“12 harmful additives avoided”", desc: "We tally what you dodged. You feel the win." },
              { icon: Repeat, title: "Daily + weekly triggers", desc: "Gentle nudges in-store. Repeat smarter trips." },
            ].map((item, i) => {
              const Icon = item.icon;
              return (
                <FadeIn key={i} delay={i * 0.05}>
                  <div className="rounded-2xl p-4" style={{ background: "#F9FAFB", border: "1px solid #F3F4F6" }}>
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-2" style={{ background: "rgba(196,30,58,0.1)" }}>
                      <Icon size={18} color="#C41E3A" />
                    </div>
                    <h3 className="font-bold text-[13px] tracking-tight" style={{ color: "#0A1220" }}>{item.title}</h3>
                    <p className="text-[11px] mt-1 leading-snug" style={{ color: "#6B7280" }}>{item.desc}</p>
                  </div>
                </FadeIn>
              );
            })}
          </div>
        </div>
      </section>

      {/* ─── 8. SCAN & PAY ─── */}
      <section className="py-8" style={{ background: "#0A0F1E" }}>
        <div className="max-w-3xl mx-auto px-5">
          <FadeIn>
            <div className="text-center">
              <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full mb-3" style={{ background: "rgba(196,30,58,0.18)", color: "#fff" }}>
                <CreditCard size={12} /> Scan & Pay
              </span>
              <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white">
                Skip the line. Scan, bag, walk out.
              </h2>
              <p className="text-xs mt-2 max-w-md mx-auto" style={{ color: "rgba(255,255,255,0.55)" }}>
                Scan items in-store, pay from your phone, walk out. No cashier. No queue.
              </p>
            </div>
          </FadeIn>

          <div className="grid grid-cols-3 gap-2 mt-5 max-w-md mx-auto">
            {[
              { icon: ShoppingBag, label: "Scan items" },
              { icon: CreditCard, label: "Tap to pay" },
              { icon: Clock, label: "Walk out" },
            ].map((s, i) => {
              const Icon = s.icon;
              return (
                <FadeIn key={i} delay={i * 0.05}>
                  <div className="rounded-xl p-3 text-center" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
                    <Icon size={18} color="#fff" className="mx-auto mb-1.5" />
                    <p className="text-[11px] font-bold text-white">{s.label}</p>
                  </div>
                </FadeIn>
              );
            })}
          </div>
        </div>
      </section>

      {/* ─── 9. FAQs ─── */}
      <section className="py-7" style={{ background: "#F9FAFB" }}>
        <div className="max-w-2xl mx-auto px-5">
          <FadeIn>
            <div className="text-center mb-4">
              <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight" style={{ color: "#0A1220" }}>
                Questions? We've got answers.
              </h2>
            </div>
          </FadeIn>
          <div className="space-y-2">
            {[
              { q: "Is SKAAP free?", a: "Yes. Scanning, scores, and ingredient breakdowns are free forever. SKAAP Plus ($1.99/mo) unlocks weekly habit reports, custom alerts, and product search." },
              { q: "How is the SKAAP Score calculated?", a: "0–100 scale: 60% nutrition (Nutri-Score), 30% additives (with bans flagged), and 10% organic/processing. Same product = same score, anywhere." },
              { q: "Where does the data come from?", a: "Open Food Facts, USDA FoodData Central, and our own additive database — cross-checked with FDA/EFSA bans. AI fills in plain-English explanations." },
              { q: "Do you sell my data or run ads?", a: "Never. No ads. No third-party tracking. Your scans are private to your account." },
              { q: "Does it work without signup?", a: "Yes — scan as a guest. Sign up only if you want to save scans, set alerts, or see your weekly grocery score." },
              { q: "Can I install it on my phone?", a: "Yes. Open useskaap.com on your phone, then 'Add to Home Screen' (iOS Share menu) or tap 'Install' (Android Chrome). It works like a native app." },
            ].map((f, i) => (
              <FadeIn key={i} delay={i * 0.03}>
                <FAQItem q={f.q} a={f.a} />
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ─── 10. CONTACT ─── */}
      <section className="py-6" style={{ background: "#FBF6E9" }}>
        <div className="max-w-2xl mx-auto px-5">
          <FadeIn>
            <div className="text-center mb-4">
              <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full mb-2" style={{ background: "rgba(10,18,32,0.06)", color: "#0A1220" }}>
                <Store size={12} /> Stores · Press · Partners
              </span>
              <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight" style={{ color: "#0A1220" }}>
                Let's talk.
              </h2>
              <p className="text-xs mt-1" style={{ color: "#6B7280" }}>
                Partner with us, or just say hi. Goes straight to our inbox.
              </p>
            </div>
          </FadeIn>

          <FadeIn delay={0.1}>
            <form onSubmit={handleContactSubmit} className="bg-white rounded-2xl p-4 space-y-2.5" style={{ border: "1px solid #E5E7EB" }}>
              <div className="flex gap-2">
                <input
                  type="text" placeholder="Name (optional)" value={contact.name}
                  onChange={e => setContact({ ...contact, name: e.target.value })}
                  className="flex-1 px-3 py-2.5 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#C41E3A]/30"
                  style={{ background: "#F9FAFB", border: "1px solid #E5E7EB" }}
                  maxLength={100}
                />
                <select
                  value={contact.type}
                  onChange={e => setContact({ ...contact, type: e.target.value })}
                  className="px-3 py-2.5 rounded-lg text-sm focus:outline-none"
                  style={{ background: "#F9FAFB", border: "1px solid #E5E7EB" }}
                >
                  <option value="general">General</option>
                  <option value="partner">Partner</option>
                  <option value="press">Press</option>
                  <option value="support">Support</option>
                </select>
              </div>
              <input
                type="email" required placeholder="Your email" value={contact.email}
                onChange={e => setContact({ ...contact, email: e.target.value })}
                className="w-full px-3 py-2.5 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#C41E3A]/30"
                style={{ background: "#F9FAFB", border: "1px solid #E5E7EB" }}
                maxLength={255}
              />
              <textarea
                required placeholder="How can we help?" rows={3} value={contact.message}
                onChange={e => setContact({ ...contact, message: e.target.value })}
                className="w-full px-3 py-2.5 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#C41E3A]/30 resize-none"
                style={{ background: "#F9FAFB", border: "1px solid #E5E7EB" }}
                maxLength={1000}
              />
              <button
                type="submit" disabled={sending}
                className="w-full flex items-center justify-center gap-2 px-5 py-3 rounded-xl font-bold text-sm disabled:opacity-60"
                style={{ background: "#0A1220", color: "#fff" }}
              >
                <Send size={14} /> {sending ? "Sending…" : "Send message"}
              </button>
            </form>
          </FadeIn>
        </div>
      </section>

      {/* ─── 11. FOOTER ─── */}
      <footer className="py-6" style={{ background: "#0A0F1E", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
        <div className="max-w-6xl mx-auto px-5 flex flex-col items-center gap-3">
          <div className="flex items-center gap-2.5">
            <img src={skaapIcon} alt="SKAAP" className="w-6 h-6 rounded-md" width="24" height="24" />
            <span className="font-bold text-white tracking-tight text-sm">SKAAP</span>
          </div>
          <div className="flex items-center gap-4">
            <a href="https://www.instagram.com/useskaap" target="_blank" rel="noopener noreferrer" aria-label="Instagram" style={{ color: "rgba(255,255,255,0.4)" }}><Instagram size={16} /></a>
            <a href="https://www.linkedin.com/company/skaaptech/" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn" style={{ color: "rgba(255,255,255,0.4)" }}><Linkedin size={16} /></a>
          </div>
          <p className="text-[10px]" style={{ color: "rgba(255,255,255,0.18)" }}>© 2026 SKAAP Technologies Inc.</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
