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

const FadeIn = ({ children, className = "", delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-60px" });
  return (
    <motion.div ref={ref} initial={{ opacity: 0, y: 24 }} animate={isInView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.45, delay, ease: [0.25, 0.46, 0.45, 0.94] }} className={className}>
      {children}
    </motion.div>
  );
};

const Index = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [faqOpen, setFaqOpen] = useState<number | null>(null);

  const isFromInstagram = useMemo(() => {
    const src = searchParams.get("utm_source")?.toLowerCase();
    const ref = searchParams.get("ref")?.toLowerCase();
    return src === "instagram" || ref === "ig" || ref === "instagram";
  }, [searchParams]);

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
    { q: "How does SKAAP work?", a: "Scan items with your phone as you shop, pay in the app, show your QR receipt at the exit. No lines, no registers. Our nutrition scanner works with 3M+ food products and 1M+ cosmetics." },
    { q: "Which stores support SKAAP?", a: "Any grocery store, anywhere in the world. SKAAP uses your location to find real stores near you. Our nutrition scanner works with 3M+ food products and 1M+ cosmetics via Open Food Facts & Open Beauty Facts." },
    { q: "Is it secure?", a: "Bank level 256 bit encryption. Payment data is tokenized and never stored on our servers." },
    { q: "What does it cost for stores?", a: "Free for 90 days. Then a simple monthly plan with no per transaction fees." },
  ];

  const heroHeadline = isFromInstagram
    ? <>You saw it on Instagram.<br />Now try it.</>
    : <>Scan. Know.<br /><span style={{ color: "#B0202F" }}>Skip the line.</span></>;

  const heroSub = isFromInstagram
    ? "No signup. No download. Just point your camera."
    : "Food intelligence + mobile checkout. One app.";

  return (
    <div className="min-h-screen font-sans overflow-x-hidden">
      {/* ─── NAV ─── */}
      <nav className="fixed top-0 w-full z-50" style={{ background: "#070D18", borderBottom: "1px solid rgba(255,255,255,0.05)", height: 64 }}>
        <div className="max-w-6xl mx-auto flex items-center justify-between px-6 h-full">
          <div className="flex items-center gap-2.5">
            <img src={skaapIcon} alt="SKAAP" className="w-7 h-7 rounded-lg" width="28" height="28" />
            <span className="font-extrabold text-xl tracking-tight text-white">SKAAP</span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm font-medium" style={{ color: "rgba(255,255,255,0.6)" }}>
            <a href="#how-it-works" className="hover:text-white transition-colors">How it Works</a>
            <a href="#retailers" className="hover:text-white transition-colors">Retailers</a>
            <a href="#contact" className="hover:text-white transition-colors">Contact</a>
          </div>
          <div className="flex items-center gap-3">
            <a href="https://www.instagram.com/useskaap?igsh=MWV5aDY5ZHJzam1keQ%3D%3D&utm_source=qr" target="_blank" rel="noopener noreferrer" aria-label="SKAAP on Instagram" style={{ color: "rgba(255,255,255,0.5)" }}><Instagram size={18} /></a>
            <a href="https://www.linkedin.com/company/skaaptech/" target="_blank" rel="noopener noreferrer" aria-label="SKAAP on LinkedIn" style={{ color: "rgba(255,255,255,0.5)" }}><Linkedin size={18} /></a>
            <button onClick={() => navigate("/app")} className="hidden md:block text-sm font-medium transition-colors" style={{ color: "rgba(255,255,255,0.5)" }}>Sign In</button>
          </div>
        </div>
      </nav>

      {/* ─── HERO ─── */}
      <section className="relative flex items-center justify-center" style={{ background: "#070D18", minHeight: "60vh", paddingTop: 64 }}>
        <div className="w-full max-w-[640px] mx-auto px-6 py-6 text-center">
          {/* Launch badge */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
            <span className="inline-flex items-center gap-2 text-xs font-medium px-4 py-2 rounded-full" style={{ background: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.6)" }}>
              ✨ Now launching on the East Coast 🇺🇸
            </span>
          </motion.div>

          {/* Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }}
            className="font-extrabold tracking-tighter leading-[1.05] text-white mt-6"
            style={{ fontSize: "clamp(38px, 8.5vw, 68px)" }}
          >
            {heroHeadline}
          </motion.h1>

          {/* Subheadline */}
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.25 }} className="mt-4 text-base md:text-lg" style={{ color: "rgba(255,255,255,0.45)" }}>
            {heroSub}
          </motion.p>

          {/* Social proof */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.35 }} className="flex items-center justify-center gap-2 mt-5">
            <div className="flex -space-x-2">
              {["🟢", "🔵", "🟡", "🟣"].map((c, i) => (
                <div key={i} className="w-7 h-7 rounded-full flex items-center justify-center text-xs" style={{ background: "rgba(255,255,255,0.12)", border: "2px solid #070D18" }}>{c}</div>
              ))}
            </div>
            <span className="text-sm" style={{ color: "rgba(255,255,255,0.45)" }}>
              <strong className="text-white">85+ people</strong> tried SKAAP this week
            </span>
          </motion.div>

          {/* I Own a Store */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }} className="mt-5">
            <a href="#retailers" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-medium transition-colors" style={{ border: "1px solid rgba(255,255,255,0.15)", color: "rgba(255,255,255,0.5)" }}>
              <Store size={16} /> I Own a Store
            </a>
          </motion.div>

          {/* Scroll indicator */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }} className="mt-4">
            <ChevronDown size={20} className="mx-auto animate-bounce" style={{ color: "rgba(255,255,255,0.2)" }} />
          </motion.div>
        </div>
      </section>

      {/* ─── TWO FEATURES ─── */}
      <section className="py-8 bg-background">
        <div className="max-w-5xl mx-auto px-6">
          <FadeIn>
            <div className="text-center mb-8">
              <span className="text-xs font-bold uppercase tracking-widest" style={{ color: "#B0202F" }}>What SKAAP Does</span>
              <h2 className="text-3xl md:text-4xl font-extrabold mt-2 tracking-tight" style={{ color: "#0A1220" }}>Food intelligence. Mobile checkout.</h2>
              <p className="text-sm mt-2 max-w-lg mx-auto" style={{ color: "#4B5563" }}>Know what you're eating. Skip the register.</p>
            </div>
          </FadeIn>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Feature 1 — Food Intelligence */}
            <FadeIn delay={0.05}>
              <motion.div whileHover={{ y: -4 }} className="rounded-2xl p-6 h-full flex flex-col" style={{ background: "#F0F0F0", border: "1px solid rgba(0,0,0,0.06)" }}>
                <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4" style={{ background: "#B0202F" }}>
                  <Sparkles size={22} color="#fff" />
                </div>
                <h3 className="font-extrabold text-xl tracking-tight mb-2" style={{ color: "#0A1220" }}>Know Your Food</h3>
                <p className="text-sm leading-relaxed flex-1" style={{ color: "#4B5563" }}>
                  Stop reading labels. Scan any barcode and SKAAP decodes additives, scores your food 0-100, and shows you what's actually safe — in under 5 seconds.
                </p>
                <div className="flex flex-wrap gap-2 mt-4">
                  {["🎯 SKAAP Score", "🅰️ Nutri-Score", "🧪 Additives", "🏭 NOVA", "📊 Nutrition"].map((chip) => (
                    <span key={chip} className="text-[11px] font-semibold px-2.5 py-1 rounded-full" style={{ background: "#fff", color: "#0A1220" }}>{chip}</span>
                  ))}
                </div>
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={() => navigate("/scan")}
                  className="mt-5 w-full py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:opacity-90 transition-opacity cta-pulse-mobile"
                  style={{ background: "#B0202F", color: "#fff" }}
                >
                  <ScanLine size={16} /> Scan a Product — It's Free
                </motion.button>
              </motion.div>
            </FadeIn>

            {/* Feature 2 — Scan & Pay */}
            <FadeIn delay={0.1}>
              <motion.div whileHover={{ y: -4 }} className="rounded-2xl p-6 h-full flex flex-col" style={{ background: "#0A1220" }}>
                <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4" style={{ background: "rgba(255,255,255,0.15)" }}>
                  <Store size={22} color="#fff" />
                </div>
                <h3 className="font-extrabold text-xl tracking-tight text-white mb-2">Scan & Pay</h3>
                <p className="text-sm leading-relaxed flex-1" style={{ color: "rgba(255,255,255,0.6)" }}>
                  Walk into any partner store, scan items as you shop, add to cart, pay in the app, and walk out with a QR receipt. No lines. No registers. No waiting.
                </p>
                <div className="flex flex-wrap gap-2 mt-4">
                  {["📱 Mobile Checkout", "🛒 Smart Cart", "🧾 QR Receipt", "⚡ Skip the Line"].map((chip) => (
                    <span key={chip} className="text-[11px] font-semibold px-2.5 py-1 rounded-full" style={{ background: "rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.8)" }}>{chip}</span>
                  ))}
                </div>
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={() => navigate("/app")}
                  className="mt-5 w-full py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
                  style={{ background: "#fff", color: "#0A1220" }}
                >
                  <Barcode size={16} /> Try the Demo
                </motion.button>
              </motion.div>
            </FadeIn>
          </div>
        </div>
      </section>

      {/* ─── HOW IT WORKS ─── */}
      <section id="how-it-works" className="py-6 bg-background">
        <div className="max-w-5xl mx-auto px-6">
          <FadeIn>
            <div className="text-center mb-8">
              <span className="text-xs font-bold uppercase tracking-widest" style={{ color: "#B0202F" }}>How it Works</span>
              <h2 className="text-3xl md:text-4xl font-extrabold mt-2 tracking-tight" style={{ color: "#0A1220" }}>Three steps. That's it.</h2>
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
                  <motion.div whileHover={{ y: -4 }} className="w-full aspect-[9/16] max-w-[180px] rounded-2xl overflow-hidden mb-3 border" style={{ borderColor: "rgba(0,0,0,0.08)", background: "#F0F0F0" }}>
                    <img src={item.img} alt={`SKAAP ${item.title} step`} className="w-full h-full object-cover" loading="lazy" width="180" height="320" />
                  </motion.div>
                  <h3 className="font-bold text-base tracking-tight" style={{ color: "#0A1220" }}>{item.title}</h3>
                  <p className="text-xs mt-0.5" style={{ color: "#4B5563" }}>{item.desc}</p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ─── SMART INFO — NUTRITION CHAMPION ─── */}
      <section className="py-6" style={{ background: "#EBEBEB" }}>
        <div className="max-w-5xl mx-auto px-6">
          <FadeIn>
            <div className="text-center mb-6">
              <div className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full mb-3" style={{ background: "rgba(176,32,47,0.1)", color: "#B0202F" }}>
                🌿 Smart Info
              </div>
              <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight" style={{ color: "#0A1220" }}>
                Stop googling ingredients.
              </h2>
              <p className="text-sm mt-2 max-w-xl mx-auto" style={{ color: "#4B5563" }}>
                One scan. Full breakdown. Additives, allergens, processing level, and a 0-100 score — faster than reading the label.
              </p>
            </div>
          </FadeIn>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-2.5 mb-5">
            {[
              { emoji: "🎯", title: "SKAAP Score", desc: "0 to 100 health score at a glance" },
              { emoji: "🅰️", title: "Nutri-Score", desc: "A to E nutrition grade" },
              { emoji: "🧪", title: "Additive Risks", desc: "E numbers decoded with risk levels" },
              { emoji: "🏭", title: "NOVA Processing", desc: "See how processed your food is (1 to 4)" },
              { emoji: "💄", title: "Cosmetics Safety", desc: "Ingredient analysis for beauty products" },
              { emoji: "📊", title: "Full Nutrition", desc: "Fat, sugar, salt, protein color coded" },
            ].map((item, i) => (
              <FadeIn key={i} delay={i * 0.04}>
                <motion.div whileHover={{ y: -2 }} className="bg-background border rounded-2xl p-3.5 text-center" style={{ borderColor: "rgba(0,0,0,0.06)" }}>
                  <span className="text-xl block mb-1.5">{item.emoji}</span>
                  <h3 className="font-bold text-[13px] tracking-tight" style={{ color: "#0A1220" }}>{item.title}</h3>
                  <p className="text-[10px] mt-0.5 leading-snug" style={{ color: "#4B5563" }}>{item.desc}</p>
                </motion.div>
              </FadeIn>
            ))}
          </div>

          <FadeIn delay={0.25}>
            <div className="bg-background border rounded-2xl p-4 flex items-center gap-4 max-w-2xl mx-auto" style={{ borderColor: "rgba(0,0,0,0.06)" }}>
              <div className="flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: "#0A1220" }}>
                <ScanLine size={20} color="#fff" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold tracking-tight" style={{ color: "#0A1220" }}>Walk into any store. Scan anything.</p>
                <p className="text-[11px] mt-0.5" style={{ color: "#4B5563" }}>Works with 3M+ food products and 1M+ cosmetics worldwide.</p>
              </div>
              <motion.button whileTap={{ scale: 0.95 }} onClick={() => navigate("/scan")} className="px-4 py-2 rounded-full text-xs font-semibold flex-shrink-0" style={{ background: "#0A1220", color: "#fff" }}>
                Scan Now
              </motion.button>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ─── FOR RETAILERS ─── */}
      <section id="retailers" style={{ background: "#0A1220" }} className="py-8">
        <div className="max-w-5xl mx-auto px-6">
          <FadeIn>
            <div className="text-center mb-5">
              <span className="text-xs font-bold uppercase tracking-widest" style={{ color: "#B0202F" }}>For Retailers</span>
              <h2 className="text-3xl md:text-4xl font-extrabold text-white mt-2 tracking-tight">
                Built for the stores<br className="hidden md:block" /> that built your neighborhood
              </h2>
            </div>
          </FadeIn>

          <FadeIn delay={0.1}>
            <div className="rounded-2xl p-6 mb-6 max-w-3xl mx-auto" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}>
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: "#B0202F" }}>
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

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
            {[
              { icon: Smartphone, title: "Zero hardware", desc: "Customers use their own phones." },
              { icon: Zap, title: "Live in 48 hours", desc: "Upload inventory, start accepting scan to pay." },
              { icon: Users, title: "Happier customers", desc: "Faster trips, more repeat visits." },
            ].map((card, i) => (
              <FadeIn key={i} delay={0.1 + i * 0.06}>
                <motion.div whileHover={{ y: -3 }} className="rounded-2xl p-5" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}>
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3" style={{ background: "#B0202F" }}>
                    <card.icon size={18} color="#fff" />
                  </div>
                  <h3 className="font-bold text-white mb-1 tracking-tight text-sm">{card.title}</h3>
                  <p className="text-xs leading-relaxed" style={{ color: "rgba(255,255,255,0.4)" }}>{card.desc}</p>
                </motion.div>
              </FadeIn>
            ))}
          </div>

          <FadeIn delay={0.2}>
            <div className="text-center">
              <a href="#contact" className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full font-bold text-sm hover:opacity-90 transition-opacity" style={{ background: "#B0202F", color: "#fff" }}>
                Get Started. Free for 90 Days <ArrowRight size={14} />
              </a>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ─── FAQ ─── */}
      <section className="py-6 bg-background">
        <div className="max-w-2xl mx-auto px-6">
          <FadeIn><h2 className="text-2xl font-extrabold text-center mb-6 tracking-tight" style={{ color: "#0A1220" }}>Questions</h2></FadeIn>
          <div className="space-y-1.5">
            {faqs.map((faq, i) => (
              <FadeIn key={i} delay={i * 0.03}>
                <div className="border rounded-xl overflow-hidden" style={{ borderColor: "#F3F4F6" }}>
                  <button onClick={() => setFaqOpen(faqOpen === i ? null : i)} aria-expanded={faqOpen === i} className="w-full flex items-center justify-between p-3.5 text-left">
                    <span className="font-semibold text-sm" style={{ color: "#0A1220" }}>{faq.q}</span>
                    <motion.div animate={{ rotate: faqOpen === i ? 180 : 0 }} transition={{ duration: 0.2 }}><ChevronDown size={14} style={{ color: "#4B5563" }} /></motion.div>
                  </button>
                  {faqOpen === i && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} transition={{ duration: 0.2 }}>
                      <div className="px-3.5 pb-3.5"><p className="text-sm leading-relaxed" style={{ color: "#4B5563" }}>{faq.a}</p></div>
                    </motion.div>
                  )}
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ─── CONTACT ─── */}
      <section id="contact" style={{ background: "#EBEBEB" }} className="py-6">
        <div className="max-w-xl mx-auto px-6 text-center">
          <FadeIn>
            <h2 className="text-2xl font-extrabold mb-2 tracking-tight" style={{ color: "#0A1220" }}>Let's talk</h2>
            <p className="text-sm mb-6" style={{ color: "#4B5563" }}>Shopper or store owner, drop your email.</p>
          </FadeIn>
          <FadeIn delay={0.1}>
            {submitted ? (
              <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} className="rounded-2xl p-5 font-semibold" style={{ background: "rgba(45,125,70,0.1)", color: "#2D7D46" }}>✅ Thanks! We'll reach out soon.</motion.div>
            ) : (
              <form onSubmit={handleEmailSubmit} className="flex gap-2">
                <div className="relative flex-1">
                  <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2" style={{ color: "#4B5563" }} />
                  <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="your@email.com" aria-label="Email address" className="w-full bg-background border rounded-full py-3 pl-11 pr-4 text-sm outline-none focus:ring-2 transition-shadow" style={{ borderColor: "#F3F4F6" }} />
                </div>
                <motion.button whileTap={{ scale: 0.95 }} type="submit" disabled={submitting} className="px-5 py-3 rounded-full font-semibold text-sm disabled:opacity-60 hover:opacity-90 transition-opacity" style={{ background: "#0A1220", color: "#fff" }}>
                  {submitting ? "Sending…" : "Get in Touch"}
                </motion.button>
              </form>
            )}
          </FadeIn>
        </div>
      </section>

      {/* ─── FOOTER ─── */}
      <footer style={{ background: "#0A1220" }} className="py-6">
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
