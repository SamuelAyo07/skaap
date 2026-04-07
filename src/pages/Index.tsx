import { useRef, useState, useEffect, useMemo, forwardRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate, useSearchParams } from "react-router-dom";
import { trackEvent } from "@/lib/analytics";
import { motion, useInView } from "framer-motion";
import {
  Store, ScanLine, Mail, ArrowRight, ChevronDown, Sparkles, Instagram, Linkedin,
  Heart, Users, Zap, Smartphone, Barcode, ShieldCheck, Clock, Search,
} from "lucide-react";
import skaapIcon from "@/assets/skaap-icon.png";
import stepScan from "@/assets/step-scan.webp";
import stepPay from "@/assets/step-pay.webp";
import stepReceipt from "@/assets/step-receipt.webp";

const spring = { duration: 0.5, ease: [0.34, 1.56, 0.64, 1] as [number, number, number, number] };

const FadeIn = forwardRef<HTMLDivElement, { children: React.ReactNode; className?: string; delay?: number }>(({ children, className = "", delay = 0 }, _fwdRef) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-60px" });
  return (
    <motion.div ref={ref} initial={{ opacity: 0, y: 24 }} animate={isInView ? { opacity: 1, y: 0 } : {}} transition={{ ...spring, delay }} className={className}>
      {children}
    </motion.div>
  );
});
FadeIn.displayName = "FadeIn";

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
    : <>Scan. Pay.<br /><span className="text-gradient">Know your food.</span></>;

  const heroSub = isFromInstagram
    ? "No signup. No download. Just point your camera."
    : "Food intelligence + mobile checkout in one app.";

  return (
    <div className="min-h-screen font-sans overflow-x-hidden" style={{ background: "#0A0F1E" }}>
      {/* ─── NAV ─── */}
      <nav className="fixed top-0 w-full z-50 glass-nav" style={{ height: 64 }}>
        <div className="max-w-6xl mx-auto flex items-center justify-between px-5 h-full">
          <div className="flex items-center gap-2.5">
            <img src={skaapIcon} alt="SKAAP" className="w-7 h-7 rounded-lg" width="28" height="28" />
            <span className="font-extrabold text-xl tracking-tight text-white">SKAAP</span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm font-medium" style={{ color: "rgba(255,255,255,0.5)" }}>
            <a href="#how-it-works" className="hover:text-white transition-colors">How it Works</a>
            <a href="#retailers" className="hover:text-white transition-colors">Retailers</a>
            <a href="#contact" className="hover:text-white transition-colors">Contact</a>
          </div>
          <div className="flex items-center gap-3">
            <a href="https://www.instagram.com/useskaap?igsh=MWV5aDY5ZHJzam1keQ%3D%3D&utm_source=qr" target="_blank" rel="noopener noreferrer" aria-label="SKAAP on Instagram" style={{ color: "rgba(255,255,255,0.4)" }}><Instagram size={18} /></a>
            <a href="https://www.linkedin.com/company/skaaptech/" target="_blank" rel="noopener noreferrer" aria-label="SKAAP on LinkedIn" style={{ color: "rgba(255,255,255,0.4)" }}><Linkedin size={18} /></a>
            <button onClick={() => navigate("/app")} className="hidden md:block text-sm font-medium" style={{ color: "rgba(255,255,255,0.4)" }}>Sign In</button>
          </div>
        </div>
      </nav>

      {/* ─── HERO (dark) ─── */}
      <section className="relative flex items-center justify-center" style={{ minHeight: "60vh", paddingTop: 64, background: "radial-gradient(ellipse at 50% 40%, #1a1f3a 0%, #0A0F1E 70%)" }}>
        <div className="absolute top-20 right-10 w-64 h-64 rounded-full animate-blob pointer-events-none" style={{ background: "rgba(99,102,241,0.12)", filter: "blur(80px)" }} />

        <div className="w-full max-w-[640px] mx-auto px-5 py-6 text-center relative z-10">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={spring}>
            <span className="inline-flex items-center gap-2 text-xs font-medium px-4 py-2 rounded-full glass-pill" style={{ color: "rgba(255,255,255,0.6)" }}>
              ✨ Now launching on the East Coast 🇺🇸
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ ...spring, delay: 0.1 }}
            className="font-extrabold tracking-tighter leading-[1.05] text-white mt-6"
            style={{ fontSize: "clamp(38px, 8.5vw, 68px)" }}
          >
            {heroHeadline}
          </motion.h1>

          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.25 }} className="mt-4 text-base md:text-lg" style={{ color: "rgba(255,255,255,0.45)" }}>
            {heroSub}
          </motion.p>

          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }} className="flex items-center justify-center mt-8">
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={() => navigate("/scan")}
              className="flex items-center justify-center gap-2.5 px-10 py-4 rounded-2xl font-bold text-base cta-pulse"
              style={{ background: "linear-gradient(135deg, #C41E3A, #a11830)", color: "#fff" }}
            >
              <ScanLine size={18} /> Scan Food
            </motion.button>
          </motion.div>

          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.45 }} className="flex items-center justify-center gap-2 mt-6">
            <div className="flex -space-x-2">
              {["🟢", "🔵", "🟡", "🟣"].map((c, i) => (
                <div key={i} className="w-7 h-7 rounded-full flex items-center justify-center text-xs" style={{ background: "rgba(255,255,255,0.1)", border: "2px solid #0A0F1E" }}>{c}</div>
              ))}
            </div>
            <span className="text-sm" style={{ color: "rgba(255,255,255,0.4)" }}>
              <strong className="text-white">85+ people</strong> tried SKAAP this week
            </span>
          </motion.div>

          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }} className="mt-4">
            <ChevronDown size={20} className="mx-auto animate-bounce" style={{ color: "rgba(255,255,255,0.15)" }} />
          </motion.div>
        </div>
      </section>

      {/* ─── TWO FEATURES (WHITE) ─── */}
      <section className="py-12" style={{ background: "#F9FAFB" }}>
        <div className="max-w-5xl mx-auto px-5">
          <FadeIn>
            <div className="text-center mb-8">
              <span className="text-xs font-bold uppercase tracking-widest" style={{ color: "#B0202F" }}>What SKAAP Does</span>
              <h2 className="text-3xl md:text-4xl font-extrabold mt-2 tracking-tight" style={{ color: "#0A1220" }}>Two powerful tools. One app.</h2>
              <p className="text-sm mt-2" style={{ color: "#6B7280" }}>Everything you need to shop smarter. Know what's in your food and skip the checkout line.</p>
            </div>
          </FadeIn>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Food Intelligence — white card */}
            <FadeIn delay={0.05}>
              <motion.div whileHover={{ y: -4 }} className="bg-white rounded-2xl p-6 h-full flex flex-col" style={{ border: "1px solid #E5E7EB" }}>
                <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4" style={{ background: "rgba(176,32,47,0.1)" }}>
                  <Sparkles size={22} color="#B0202F" />
                </div>
                <h3 className="font-extrabold text-xl tracking-tight mb-2" style={{ color: "#0A1220" }}>Know Your Food</h3>
                <p className="text-sm leading-relaxed flex-1" style={{ color: "#6B7280" }}>
                  Ever wonder what's really in that granola bar? Scan it. In seconds, you'll know if it's actually healthy — or just marketed that way. Works on 3M+ grocery &amp; beauty products.
                </p>
                <div className="flex flex-wrap gap-2 mt-4">
                  {["🎯 SKAAP Score", "🅰️ Nutri-Score", "🧪 Additives", "🏭 NOVA", "📊 Nutrition"].map(chip => (
                    <span key={chip} className="text-[11px] font-semibold px-2.5 py-1 rounded-full" style={{ background: "#F3F4F6", color: "#374151" }}>{chip}</span>
                  ))}
                </div>
                <motion.button whileTap={{ scale: 0.97 }} onClick={() => navigate("/scan")}
                  className="mt-5 w-full py-3.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2"
                  style={{ background: "linear-gradient(135deg, #B0202F, #8a1825)", color: "#fff" }}>
                  <ScanLine size={16} /> Try Free Scan
                </motion.button>
              </motion.div>
            </FadeIn>

            {/* Scan & Pay — dark card */}
            <FadeIn delay={0.1}>
              <motion.div whileHover={{ y: -4 }} className="rounded-2xl p-6 h-full flex flex-col" style={{ background: "#0A1220", border: "1px solid rgba(255,255,255,0.1)" }}>
                <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4" style={{ background: "rgba(255,255,255,0.1)" }}>
                  <Store size={22} color="#fff" />
                </div>
                <h3 className="font-extrabold text-xl tracking-tight text-white mb-2">Skip the line. Walk right out.</h3>
                <p className="text-sm leading-relaxed flex-1" style={{ color: "rgba(255,255,255,0.6)" }}>
                  Scan your items as you shop. Pay on your phone. Show your QR code at the door. It takes 30 seconds your first time.
                </p>
                <div className="flex flex-wrap gap-2 mt-4">
                  {["🚫 No waiting", "📱 Pay on your phone", "🧾 QR exit pass", "⚡ 30-second setup"].map(chip => (
                    <span key={chip} className="text-[11px] font-semibold px-2.5 py-1 rounded-full" style={{ background: "rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.8)" }}>{chip}</span>
                  ))}
                </div>
                <motion.button whileTap={{ scale: 0.97 }} onClick={() => navigate("/app")}
                  className="mt-5 w-full py-3.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2"
                  style={{ background: "linear-gradient(135deg, #E8314A, #c42040)", color: "#fff" }}>
                  Try It Free →
                </motion.button>
              </motion.div>
            </FadeIn>
          </div>
        </div>
      </section>

      {/* ─── HOW IT WORKS (WHITE) ─── */}
      <section id="how-it-works" className="py-10 bg-white">
        <div className="max-w-5xl mx-auto px-5">
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
                  <motion.div whileHover={{ y: -4 }} className="w-full aspect-[9/16] max-w-[180px] rounded-2xl overflow-hidden mb-3" style={{ border: "1px solid #E5E7EB", background: "#F9FAFB" }}>
                    <img src={item.img} alt={`SKAAP ${item.title} step`} className="w-full h-full object-cover" loading="lazy" width="180" height="320" />
                  </motion.div>
                  <h3 className="font-bold text-base tracking-tight" style={{ color: "#0A1220" }}>{item.title}</h3>
                  <p className="text-xs mt-0.5" style={{ color: "#9CA3AF" }}>{item.desc}</p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ─── SMART INFO (WHITE/LIGHT) ─── */}
      <section className="py-10" style={{ background: "#F9FAFB" }}>
        <div className="max-w-5xl mx-auto px-5">
          <FadeIn>
            <div className="text-center mb-6">
              <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full mb-3" style={{ background: "rgba(176,32,47,0.08)", color: "#B0202F" }}>
                🌿 Food Intelligence
              </span>
              <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight" style={{ color: "#0A1220" }}>
                Your personal food & beauty analyst.
              </h2>
              <p className="text-sm mt-2 max-w-xl mx-auto" style={{ color: "#6B7280" }}>
                Scan any product and instantly see what's really inside. SKAAP Score, Nutri-Score, allergens, additives, and ingredient safety decoded in real time.
              </p>
            </div>
          </FadeIn>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-2.5 mb-5">
            {[
              { emoji: "🎯", title: "SKAAP Score", desc: "0 to 100 health score at a glance" },
              { emoji: "🅰️", title: "Nutri-Score", desc: "A to E nutrition grade" },
              { emoji: "🧪", title: "Additive Risks", desc: "E numbers decoded with risk levels" },
              { emoji: "🏭", title: "NOVA Processing", desc: "1 to 4 processing level" },
              { emoji: "💄", title: "Cosmetics Safety", desc: "Beauty product analysis" },
              { emoji: "📊", title: "Full Nutrition", desc: "Color coded breakdown" },
            ].map((item, i) => (
              <FadeIn key={i} delay={i * 0.04}>
                <motion.div whileHover={{ y: -2 }} className="bg-white rounded-2xl p-3.5 text-center" style={{ border: "1px solid #E5E7EB" }}>
                  <span className="text-xl block mb-1.5">{item.emoji}</span>
                  <h3 className="font-bold text-[13px] tracking-tight" style={{ color: "#0A1220" }}>{item.title}</h3>
                  <p className="text-[10px] mt-0.5 leading-snug" style={{ color: "#9CA3AF" }}>{item.desc}</p>
                </motion.div>
              </FadeIn>
            ))}
          </div>

          <FadeIn delay={0.25}>
            <div className="bg-white rounded-2xl p-4 flex items-center gap-4 max-w-2xl mx-auto" style={{ border: "1px solid #E5E7EB" }}>
              <div className="flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: "rgba(176,32,47,0.1)" }}>
                <ScanLine size={20} color="#B0202F" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold tracking-tight" style={{ color: "#0A1220" }}>3M+ food products. 1M+ cosmetics.</p>
                <p className="text-[11px] mt-0.5" style={{ color: "#9CA3AF" }}>Works in any store, worldwide.</p>
              </div>
              <motion.button whileTap={{ scale: 0.95 }} onClick={() => navigate("/scan")} className="px-4 py-2 rounded-full text-xs font-semibold flex-shrink-0" style={{ background: "#B0202F", color: "#fff" }}>
                Scan Now
              </motion.button>
            </div>
          </FadeIn>
        </div>
      </section>


      {/* ─── FAQ (WHITE) ─── */}
      <section className="py-10 bg-white">
        <div className="max-w-2xl mx-auto px-5">
          <FadeIn><h2 className="text-2xl font-extrabold text-center mb-6 tracking-tight" style={{ color: "#0A1220" }}>Questions</h2></FadeIn>
          <div className="space-y-1.5">
            {faqs.map((faq, i) => (
              <FadeIn key={i} delay={i * 0.03}>
                <div className="bg-white rounded-2xl overflow-hidden" style={{ border: "1px solid #E5E7EB" }}>
                  <button onClick={() => setFaqOpen(faqOpen === i ? null : i)} aria-expanded={faqOpen === i} className="w-full flex items-center justify-between p-4 text-left">
                    <span className="font-semibold text-sm" style={{ color: "#0A1220" }}>{faq.q}</span>
                    <motion.div animate={{ rotate: faqOpen === i ? 180 : 0 }} transition={{ duration: 0.2 }}><ChevronDown size={14} style={{ color: "#9CA3AF" }} /></motion.div>
                  </button>
                  {faqOpen === i && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} transition={{ duration: 0.2 }}>
                      <div className="px-4 pb-4"><p className="text-sm leading-relaxed" style={{ color: "#6B7280" }}>{faq.a}</p></div>
                    </motion.div>
                  )}
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ─── INSTALL APP (WHITE) ─── */}
      <section className="py-10 bg-white">
        <div className="max-w-2xl mx-auto px-5">
          <FadeIn><h2 className="text-2xl font-extrabold text-center mb-2 tracking-tight" style={{ color: "#0A1220" }}>Install SKAAP</h2></FadeIn>
          <FadeIn delay={0.05}><p className="text-sm text-center mb-8" style={{ color: "#6B7280" }}>Add SKAAP to your home screen for a native app experience — no app store needed.</p></FadeIn>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* iPhone */}
            <FadeIn delay={0.1}>
              <div className="rounded-2xl p-5" style={{ border: "1px solid #E5E7EB" }}>
                <div className="flex items-center gap-2.5 mb-4">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "#F3F4F6" }}>
                    <Smartphone size={18} style={{ color: "#0A1220" }} />
                  </div>
                  <h3 className="font-bold text-sm" style={{ color: "#0A1220" }}>iPhone (Safari)</h3>
                </div>
                <ol className="space-y-3">
                  {[
                    { step: "1", icon: "🌐", text: "Open useskaap.com in Safari" },
                    { step: "2", icon: "📤", text: "Tap the Share button (square with arrow)" },
                    { step: "3", icon: "➕", text: 'Scroll down & tap "Add to Home Screen"' },
                    { step: "4", icon: "✅", text: 'Tap "Add" — done!' },
                  ].map((item) => (
                    <li key={item.step} className="flex items-start gap-3">
                      <span className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold" style={{ background: "rgba(232,49,74,0.1)", color: "#E8314A" }}>{item.step}</span>
                      <span className="text-sm" style={{ color: "#374151" }}><span className="mr-1.5">{item.icon}</span>{item.text}</span>
                    </li>
                  ))}
                </ol>
              </div>
            </FadeIn>

            {/* Android */}
            <FadeIn delay={0.15}>
              <div className="rounded-2xl p-5" style={{ border: "1px solid #E5E7EB" }}>
                <div className="flex items-center gap-2.5 mb-4">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "#F3F4F6" }}>
                    <Smartphone size={18} style={{ color: "#0A1220" }} />
                  </div>
                  <h3 className="font-bold text-sm" style={{ color: "#0A1220" }}>Android (Chrome)</h3>
                </div>
                <ol className="space-y-3">
                  {[
                    { step: "1", icon: "🌐", text: "Open useskaap.com in Chrome" },
                    { step: "2", icon: "⋮", text: "Tap the three-dot menu (top right)" },
                    { step: "3", icon: "📲", text: 'Tap "Install app" or "Add to Home Screen"' },
                    { step: "4", icon: "✅", text: "Confirm — SKAAP is on your home screen!" },
                  ].map((item) => (
                    <li key={item.step} className="flex items-start gap-3">
                      <span className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold" style={{ background: "rgba(232,49,74,0.1)", color: "#E8314A" }}>{item.step}</span>
                      <span className="text-sm" style={{ color: "#374151" }}><span className="mr-1.5">{item.icon}</span>{item.text}</span>
                    </li>
                  ))}
                </ol>
              </div>
            </FadeIn>
          </div>
        </div>
      </section>

      {/* ─── CONTACT (LIGHT GRAY) ─── */}
      <section id="contact" className="py-10" style={{ background: "#F3F4F6" }}>
        <div className="max-w-xl mx-auto px-5 text-center">
          <FadeIn>
            <h2 className="text-2xl font-extrabold mb-2 tracking-tight" style={{ color: "#0A1220" }}>Let's talk</h2>
            <p className="text-sm mb-6" style={{ color: "#6B7280" }}>Shopper or store owner, drop your email.</p>
          </FadeIn>
          <FadeIn delay={0.1}>
            {submitted ? (
              <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} className="bg-white rounded-2xl p-5 font-semibold" style={{ color: "#22C55E", border: "1px solid #E5E7EB" }}>✅ Thanks! We'll reach out soon.</motion.div>
            ) : (
              <form onSubmit={handleEmailSubmit} className="flex gap-2">
                <div className="relative flex-1">
                  <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2" style={{ color: "#9CA3AF" }} />
                  <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="your@email.com" aria-label="Email address"
                    className="w-full rounded-2xl py-3 pl-11 pr-4 text-sm outline-none focus:ring-2 transition-shadow bg-white"
                    style={{ border: "1px solid #E5E7EB", color: "#0A1220", boxShadow: "none" }}
                  />
                </div>
                <motion.button whileTap={{ scale: 0.95 }} type="submit" disabled={submitting} className="px-5 py-3 rounded-2xl font-semibold text-sm disabled:opacity-60" style={{ background: "#0A1220", color: "#fff" }}>
                  {submitting ? "Sending…" : "Get in Touch"}
                </motion.button>
              </form>
            )}
          </FadeIn>
        </div>
      </section>

      {/* ─── FOOTER (dark) ─── */}
      <footer className="py-6" style={{ background: "#0A0F1E", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
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
              <a href="#how-it-works" className="hover:text-white transition-colors">How it Works</a>
              <button onClick={() => navigate("/scan")} className="hover:text-white transition-colors">Food Intelligence</button>
              <a href="#contact" className="hover:text-white transition-colors">Contact</a>
            </div>
            <div className="flex items-center gap-4">
              <a href="https://www.instagram.com/useskaap?igsh=MWV5aDY5ZHJzam1keQ%3D%3D&utm_source=qr" target="_blank" rel="noopener noreferrer" aria-label="SKAAP on Instagram" style={{ color: "rgba(255,255,255,0.4)" }}><Instagram size={18} /></a>
              <a href="https://www.linkedin.com/company/skaaptech/" target="_blank" rel="noopener noreferrer" aria-label="SKAAP on LinkedIn" style={{ color: "rgba(255,255,255,0.4)" }}><Linkedin size={18} /></a>
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
