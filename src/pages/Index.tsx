import { useEffect, useMemo, useRef, useState, forwardRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { trackEvent } from "@/lib/analytics";
import { motion, useInView } from "framer-motion";
import { ScanLine, Instagram, Linkedin, Store, ShoppingBag, Send, Repeat, TrendingUp, ShieldCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import skaapIcon from "@/assets/skaap-icon.png";

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

/* ─── Yuka-style phone mockup (cream bg, product, signals, verdict pill) ─── */
function PhoneMockup({
  productLabel,
  productEmoji,
  signals,
  verdict,
  scoreColor,
  score,
}: {
  productLabel: string;
  productEmoji: string;
  signals: { emoji: string; text: string }[];
  verdict: string;
  scoreColor: string;
  score: string;
}) {
  return (
    <div
      className="relative mx-auto rounded-[26px] p-[5px]"
      style={{
        background: "#0A1220",
        boxShadow: "0 14px 40px -10px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.06)",
        width: "100%",
        maxWidth: 180,
        aspectRatio: "9 / 18",
      }}
    >
      {/* Notch */}
      <div className="absolute top-[10px] left-1/2 -translate-x-1/2 w-10 h-[10px] rounded-full z-10" style={{ background: "#0A1220" }} />
      {/* Screen */}
      <div className="w-full h-full rounded-[22px] overflow-hidden flex flex-col items-center justify-between p-2.5 pt-5" style={{ background: "#FBF6E9" }}>
        {/* Product hero */}
        <div className="flex flex-col items-center mt-1">
          <div className="w-14 h-14 rounded-xl flex items-center justify-center text-3xl" style={{ background: "#FFF", boxShadow: "0 4px 10px -2px rgba(0,0,0,0.08)" }}>
            {productEmoji}
          </div>
          <p className="text-[8px] font-bold mt-1.5 text-center leading-tight" style={{ color: "#0A1220" }}>{productLabel}</p>
        </div>
        {/* Signals */}
        <div className="w-full flex flex-col gap-1 px-0.5">
          {signals.map((s, i) => (
            <div key={i} className="flex items-center gap-1 px-1.5 py-1 rounded-full" style={{ background: "#E8E4D6" }}>
              <span className="text-[9px]">{s.emoji}</span>
              <span className="text-[8px] font-semibold truncate" style={{ color: "#6B7280" }}>{s.text}</span>
            </div>
          ))}
        </div>
        {/* Verdict pill */}
        <div className="flex items-center justify-center gap-1 rounded-full px-2 py-1 w-full" style={{ background: "#FFF", boxShadow: "0 2px 6px -2px rgba(0,0,0,0.1)" }}>
          <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: scoreColor }} />
          <span className="text-[9px] font-extrabold tracking-tight" style={{ color: "#0A1220" }}>
            {verdict} · {score}/100
          </span>
        </div>
      </div>
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
        style={{ minHeight: "auto", paddingTop: 96, paddingBottom: 28, background: "radial-gradient(ellipse at 50% 30%, #1a1f3a 0%, #0A0F1E 70%)" }}
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

      {/* ─── 3. HOW IT WORKS — 3 Yuka-style cards horizontal row ─── */}
      <section className="py-10" style={{ background: "#0A0F1E" }}>
        <div className="max-w-5xl mx-auto px-4">
          <FadeIn>
            <h2 className="text-center text-xl md:text-2xl font-extrabold tracking-tight text-white mb-1">
              How it works
            </h2>
            <p className="text-center text-xs mb-6" style={{ color: "rgba(255,255,255,0.45)" }}>
              Scan → Score → Decide.
            </p>
          </FadeIn>

          <div className="grid grid-cols-3 gap-2.5 md:gap-4 max-w-3xl mx-auto">
            <FadeIn delay={0.05}>
              <YukaPhone
                productEmoji="🍪"
                productLabel="belVita Blueberry"
                signals={[
                  { emoji: "🧪", text: "6 additives" },
                  { emoji: "🍬", text: "Too sweet" },
                ]}
                verdict="Bad"
                score="21"
                scoreColor="#C41E3A"
              />
            </FadeIn>
            <FadeIn delay={0.15}>
              <YukaPhone
                productEmoji="🥣"
                productLabel="Honey Nut Cheerios"
                signals={[
                  { emoji: "🧪", text: "7 additives" },
                  { emoji: "🍬", text: "32g sugar" },
                ]}
                verdict="Bad"
                score="8"
                scoreColor="#C41E3A"
              />
            </FadeIn>
            <FadeIn delay={0.25}>
              <YukaPhone
                productEmoji="🥗"
                productLabel="Plain Greek Yogurt"
                signals={[
                  { emoji: "💪", text: "High protein" },
                  { emoji: "✨", text: "Clean label" },
                ]}
                verdict="Excellent"
                score="94"
                scoreColor="#22C55E"
              />
            </FadeIn>
          </div>
        </div>
      </section>

      {/* ─── 4. WHAT YOU GET (compact grid) ─── */}
      <section className="py-10" style={{ background: "#F9FAFB" }}>
        <div className="max-w-5xl mx-auto px-5">
          <FadeIn>
            <div className="text-center mb-5">
              <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight" style={{ color: "#0A1220" }}>
                Your personal product analyst.
              </h2>
              <p className="text-xs mt-1.5" style={{ color: "#6B7280" }}>
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
      <section className="py-10 bg-white">
        <div className="max-w-3xl mx-auto px-5">
          <FadeIn>
            <div className="text-center mb-5">
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

      {/* ─── 6. CONTACT / PARTNER (form) ─── */}
      <section className="py-10" style={{ background: "#F9FAFB" }}>
        <div className="max-w-2xl mx-auto px-5">
          <FadeIn>
            <div className="text-center mb-5">
              <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full mb-2" style={{ background: "rgba(10,18,32,0.06)", color: "#0A1220" }}>
                <Store size={12} /> Stores · Press · Partners
              </span>
              <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight" style={{ color: "#0A1220" }}>
                Let's talk.
              </h2>
              <p className="text-xs mt-1.5" style={{ color: "#6B7280" }}>
                Partner with us, or just say hi. We read every message.
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
              <p className="text-center text-[10px]" style={{ color: "#9CA3AF" }}>
                Or email us directly: <a href={MAILTO} className="underline">oyedemisam@gmail.com</a>
              </p>
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
