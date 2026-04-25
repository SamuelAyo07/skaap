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

const MAILTO = "mailto:oyedemisam@gmail.com";
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

      {/* ─── 2. HERO (compact) ─── */}
      <section
        className="relative flex items-center justify-center"
        style={{ minHeight: "auto", paddingTop: 80, paddingBottom: 20, background: "radial-gradient(ellipse at 50% 30%, #1a1f3a 0%, #0A0F1E 70%)" }}
      >
        <div className="absolute top-20 right-10 w-64 h-64 rounded-full pointer-events-none" style={{ background: "rgba(196,30,58,0.10)", filter: "blur(80px)" }} />

        <div className="w-full max-w-[680px] mx-auto px-5 text-center relative z-10">
          <motion.h1
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ ...spring, delay: 0.05 }}
            className="font-extrabold tracking-tighter leading-[1.05] text-white"
            style={{ fontSize: "clamp(32px, 7vw, 56px)" }}
          >
            Know what you're eating.<br />
            <span className="text-gradient">In 2 seconds.</span>
          </motion.h1>

          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
            className="mt-3 text-sm md:text-base" style={{ color: "rgba(255,255,255,0.55)" }}>
            Scan any product. Instant health score. No guesswork.
          </motion.p>

          <motion.button
            initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
            whileTap={{ scale: 0.97 }}
            onClick={handleStartScan}
            className="mt-5 inline-flex items-center justify-center gap-2.5 px-7 py-3.5 rounded-2xl font-bold text-sm cta-pulse"
            style={{ background: "linear-gradient(135deg, #C41E3A, #a11830)", color: "#fff" }}
          >
            <ScanLine size={16} /> Start Scanning — It's Free
          </motion.button>

          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
            className="mt-3 text-[11px]" style={{ color: "rgba(255,255,255,0.35)" }}>
            <strong className="text-white/60">2,000+ products</strong> SKAAPED worldwide.
          </motion.p>
        </div>
      </section>

      {/* ─── 3. HOW IT WORKS — 3 phone mockups in a horizontal row ─── */}
      <section className="py-6" style={{ background: "#0A0F1E" }}>
        <div className="max-w-5xl mx-auto px-4">
          <FadeIn>
            <h2 className="text-center text-xl md:text-2xl font-extrabold tracking-tight text-white mb-1">
              How it works
            </h2>
            <p className="text-center text-xs mb-5" style={{ color: "rgba(255,255,255,0.45)" }}>
              Scan → Score → Decide.
            </p>
          </FadeIn>

          <div className="grid grid-cols-3 gap-2 md:gap-4 max-w-2xl mx-auto items-end">
            <FadeIn delay={0.05}>
              <PhoneMockup
                productEmoji="🍪"
                productLabel="belVita Breakfast"
                signals={[
                  { dot: "#C41E3A", text: "Too much sugar" },
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
                productEmoji="🥣"
                productLabel="Honey Nut Cereal"
                signals={[
                  { dot: "#C41E3A", text: "32g sugar / serv" },
                  { dot: "#C41E3A", text: "7 additives" },
                  { dot: "#F59E0B", text: "Low fiber" },
                ]}
                verdict="Bad"
                score="8"
                scoreColor="#C41E3A"
              />
            </FadeIn>
            <FadeIn delay={0.25}>
              <PhoneMockup
                productEmoji="🥗"
                productLabel="Greek Yogurt Plain"
                signals={[
                  { dot: "#22C55E", text: "High protein" },
                  { dot: "#22C55E", text: "No additives" },
                  { dot: "#22C55E", text: "Clean label" },
                ]}
                verdict="Excellent"
                score="94"
                scoreColor="#22C55E"
              />
            </FadeIn>
          </div>
        </div>
      </section>

      {/* ─── 3b. KNOW YOUR FOOD — what we do & why ─── */}
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
              SKAAP scans any product barcode and breaks down what's actually inside — sugar, additives, ultra-processing, protein, allergens — in plain English. Built for people who want to eat better but don't have time to read every label.
            </p>
          </FadeIn>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-5">
            {[
              { icon: Heart, title: "Why we built it", desc: "Most 'healthy' labels lie. Hidden sugars, banned-abroad additives, fake protein claims. We surface the truth in 2 seconds." },
              { icon: Sparkles, title: "How it works", desc: "Open-source databases (OFF, USDA) + our own SKAAP Score (0–100) + AI-powered ingredient explainers. No ads. No tracking." },
              { icon: Users, title: "Who it's for", desc: "Parents, athletes, anyone managing allergies or just tired of guessing. Free forever for scans. Plus unlocks habits & alerts." },
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

      {/* ─── 4. WHAT YOU GET (compact grid) ─── */}
      <section className="py-6" style={{ background: "#F9FAFB" }}>
        <div className="max-w-5xl mx-auto px-5">
          <FadeIn>
            <div className="text-center mb-4">
              <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight" style={{ color: "#0A1220" }}>
                Your personal product analyst.
              </h2>
              <p className="text-xs mt-1" style={{ color: "#6B7280" }}>
                Food + beauty. 4M+ products. Instant.
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

      {/* ─── 5. BUILD HABIT (Members) ─── */}
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

      {/* ─── 5b. SCAN & PAY (checkout freedom) ─── */}
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

      {/* ─── 6. CONTACT / PARTNER (form) ─── */}
      <section className="py-6" style={{ background: "#F9FAFB" }}>
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
              />
              <textarea
                required placeholder="How can we help?" rows={3} value={contact.message}
                onChange={e => setContact({ ...contact, message: e.target.value })}
                className="w-full px-3 py-2.5 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#C41E3A]/30 resize-none"
                style={{ background: "#F9FAFB", border: "1px solid #E5E7EB" }}
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

      {/* ─── 7. FOOTER ─── */}
      <footer className="py-6" style={{ background: "#0A0F1E", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
        <div className="max-w-6xl mx-auto px-5 flex flex-col items-center gap-3">
          <div className="flex items-center gap-2.5">
            <img src={skaapIcon} alt="SKAAP" className="w-6 h-6 rounded-md" width="24" height="24" />
            <span className="font-bold text-white tracking-tight text-sm">SKAAP</span>
          </div>
          <div className="flex items-center gap-4">
            <a href="https://www.instagram.com/useskaap" target="_blank" rel="noopener noreferrer" aria-label="Instagram" style={{ color: "rgba(255,255,255,0.4)" }}><Instagram size={16} /></a>
            <a href="https://www.linkedin.com/company/skaaptech/" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn" style={{ color: "rgba(255,255,255,0.4)" }}><Linkedin size={16} /></a>
            <a href={MAILTO} className="text-xs font-medium" style={{ color: "rgba(255,255,255,0.4)" }}>Contact</a>
          </div>
          <p className="text-[10px]" style={{ color: "rgba(255,255,255,0.18)" }}>© 2026 SKAAP Technologies Inc.</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
