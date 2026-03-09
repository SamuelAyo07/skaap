import { useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { motion, useInView } from "framer-motion";
import {
  Store, ScanLine, CreditCard, Receipt,
  Mail, Smartphone, ArrowRight, ChevronDown, Play, Sparkles, Instagram, Linkedin,
  Heart, Users, Zap,
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
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [faqOpen, setFaqOpen] = useState<number | null>(null);



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
    { q: "How does SKAAP work?", a: "Scan items with your phone as you shop, pay in-app, show your QR receipt at the exit. No lines, no registers." },
    { q: "Which stores support SKAAP?", a: "Launching with local grocers across the East Coast, starting in Boston. More cities coming soon." },
    { q: "Is it secure?", a: "Bank-level 256-bit encryption. Payment data is tokenized and never stored on our servers." },
    { q: "What does it cost for stores?", a: "Free for 90 days. Then a simple monthly plan — no per-transaction fees." },
  ];

  return (
    <div className="min-h-screen bg-background font-sans overflow-x-hidden">
      {/* ─── NAV ─── */}
      <nav className="fixed top-0 w-full z-50 glass border-b border-border/50">
        <div className="max-w-6xl mx-auto flex items-center justify-between px-6 py-3">
          <div className="flex items-center gap-2.5">
            <img src={skaapIcon} alt="SKAAP" className="w-8 h-8 rounded-lg" />
            <span className="font-bold text-lg text-foreground tracking-tight">SKAAP</span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm text-muted-foreground font-medium">
            <a href="#how-it-works" className="hover:text-foreground transition-colors">How it Works</a>
            <a href="#retailers" className="hover:text-foreground transition-colors">Retailers</a>
            <a href="#contact" className="hover:text-foreground transition-colors">Contact</a>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-3 mr-1">
              <a href="https://www.instagram.com/useskaap?igsh=MWV5aDY5ZHJzam1keQ%3D%3D&utm_source=qr" target="_blank" rel="noopener noreferrer" aria-label="SKAAP on Instagram" className="text-muted-foreground hover:text-foreground transition-colors"><Instagram size={18} /></a>
              <a href="https://www.linkedin.com/company/skaaptech/" target="_blank" rel="noopener noreferrer" aria-label="SKAAP on LinkedIn" className="text-muted-foreground hover:text-foreground transition-colors"><Linkedin size={18} /></a>
            </div>
            <button onClick={() => navigate("/login")} className="text-sm text-muted-foreground hover:text-foreground transition-colors hidden md:block font-medium">Sign In</button>
            <motion.button whileTap={{ scale: 0.95 }} onClick={() => navigate("/app")} className="bg-foreground text-background px-5 py-2.5 rounded-full text-sm font-semibold hover:opacity-90 transition-opacity flex items-center gap-2">
              <Play size={12} fill="currentColor" /> Try Demo
            </motion.button>
          </div>
        </div>
      </nav>

      {/* ─── HERO ─── */}
      <section className="relative pt-28 pb-14 md:pt-36 md:pb-20 overflow-hidden bg-foreground">
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: "radial-gradient(circle at 1px 1px, hsl(0 0% 100%) 1px, transparent 0)", backgroundSize: "40px 40px" }} />
        <div className="relative max-w-5xl mx-auto px-6 text-center">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <span className="inline-flex items-center gap-1.5 bg-background/10 text-background/80 text-xs font-medium px-3.5 py-1.5 rounded-full mb-5 backdrop-blur-sm">
              <Sparkles size={12} /> Now launching on the East Coast 🇺🇸
            </span>
            <h1 className="text-5xl md:text-7xl lg:text-[5.5rem] font-black text-background leading-[0.92] tracking-tighter mb-5">
              Scan it.<br />Pay instantly.<br /><span className="text-gradient">Walk out.</span>
            </h1>
            <p className="text-background/50 text-lg md:text-xl mb-4 max-w-2xl mx-auto font-light leading-relaxed">
              Your phone becomes the checkout. No lines, no registers, no waiting.
            </p>
            {/* Social proof */}
            <div className="flex items-center justify-center gap-2 mb-6">
              <div className="flex -space-x-2">
                {["🟢", "🔵", "🟡", "🟣"].map((c, i) => (
                  <div key={i} className="w-6 h-6 rounded-full bg-background/20 border-2 border-foreground flex items-center justify-center text-[10px]">{c}</div>
                ))}
              </div>
              <p className="text-background/40 text-xs font-medium">
                <span className="text-background/70 font-bold">85+ people</span> tried SKAAP this week
              </p>
            </div>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="flex flex-col items-center gap-3">
            <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }} onClick={() => navigate("/app")} className="bg-accent text-accent-foreground px-12 py-5 rounded-full font-black text-xl flex items-center gap-3 shadow-hero relative overflow-hidden group">
              <motion.div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
              <Play size={20} fill="currentColor" /> Try the Demo
            </motion.button>
            <p className="text-background/25 text-xs">30 seconds · No signup · Works on any phone</p>
            <a href="#retailers" className="border border-background/20 text-background/70 px-7 py-3 rounded-full font-semibold text-sm flex items-center gap-2 hover:bg-background/5 transition-colors">
              <Store size={15} /> I Own a Store
            </a>
          </motion.div>
        </div>
        <motion.div animate={{ y: [0, 6, 0] }} transition={{ duration: 2, repeat: Infinity }} className="absolute bottom-6 left-1/2 -translate-x-1/2 text-background/20">
          <ChevronDown size={20} />
        </motion.div>
      </section>

      {/* ─── HOW IT WORKS ─── */}
      <section id="how-it-works" className="py-14 bg-background">
        <div className="max-w-5xl mx-auto px-6">
          <FadeIn>
            <div className="text-center mb-10">
              <span className="text-accent text-xs font-bold uppercase tracking-widest">How it Works</span>
              <h2 className="text-3xl md:text-4xl font-black text-foreground mt-2 tracking-tight">Three steps. That's it.</h2>
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
                  <motion.div whileHover={{ y: -4 }} className="w-full aspect-[9/16] max-w-[180px] rounded-2xl overflow-hidden mb-3 bg-muted/30 border border-border/40">
                    <img src={item.img} alt={`SKAAP app ${item.title} step screenshot`} className="w-full h-full object-cover" loading="lazy" width="180" height="320" />
                  </motion.div>
                  <h3 className="font-bold text-base text-foreground tracking-tight">{item.title}</h3>
                  <p className="text-muted-foreground text-xs mt-0.5">{item.desc}</p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ─── SMART INFO — YUKA-STYLE ─── */}
      <section className="py-12 bg-muted/30">
        <div className="max-w-5xl mx-auto px-6">
          <FadeIn>
            <div className="text-center mb-6">
              <div className="inline-flex items-center gap-1.5 bg-accent/10 text-accent text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full mb-3">
                🌿 Smart Info
              </div>
              <h2 className="text-3xl md:text-4xl font-black text-foreground tracking-tight">
                Your personal food &amp; beauty analyst.
              </h2>
              <p className="text-sm text-muted-foreground mt-2 max-w-xl mx-auto">
                Scan any product — food or cosmetics — and instantly see what's really inside. Nutri-Score, allergens, additives, and ingredient safety decoded in real time.
              </p>
            </div>
          </FadeIn>

          {/* Compact feature grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2.5 mb-5">
            {[
              { emoji: "🅰️", title: "Nutri-Score", desc: "A–E nutrition grade at a glance", color: "from-[hsl(142,71%,35%)]/10 to-transparent" },
              { emoji: "⚠️", title: "Allergen Alerts", desc: "Instant warnings for 14 major allergens", color: "from-accent/10 to-transparent" },
              { emoji: "🧪", title: "Additive Risks", desc: "E-numbers decoded: low, moderate, or high risk", color: "from-[hsl(30,90%,55%)]/10 to-transparent" },
              { emoji: "🏭", title: "NOVA Processing", desc: "See how processed your food really is (1–4)", color: "from-[hsl(220,70%,55%)]/10 to-transparent" },
              { emoji: "💄", title: "Cosmetics Safety", desc: "Ingredient analysis for beauty & skincare products", color: "from-[hsl(320,60%,55%)]/10 to-transparent" },
              { emoji: "📊", title: "Full Nutrition", desc: "Fat, sugar, salt, protein — color-coded levels", color: "from-[hsl(48,95%,55%)]/10 to-transparent" },
            ].map((item, i) => (
              <FadeIn key={i} delay={i * 0.04}>
                <motion.div whileHover={{ y: -2 }} className={`bg-gradient-to-b ${item.color} bg-background border border-border/40 rounded-2xl p-3.5 text-center`}>
                  <span className="text-xl block mb-1.5">{item.emoji}</span>
                  <h3 className="font-bold text-[13px] text-foreground tracking-tight">{item.title}</h3>
                  <p className="text-[10px] text-muted-foreground mt-0.5 leading-snug">{item.desc}</p>
                </motion.div>
              </FadeIn>
            ))}
          </div>

          {/* Inline demo prompt */}
          <FadeIn delay={0.25}>
            <div className="bg-background border border-border/50 rounded-2xl p-4 flex items-center gap-4 max-w-2xl mx-auto">
              <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-foreground flex items-center justify-center">
                <ScanLine size={20} className="text-background" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-foreground tracking-tight">Walk into any store. Scan anything.</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">Works with 3M+ food products and 1M+ cosmetics worldwide via Open Food Facts &amp; Open Beauty Facts.</p>
              </div>
              <motion.button whileTap={{ scale: 0.95 }} onClick={() => navigate("/app")} className="bg-foreground text-background px-4 py-2 rounded-full text-xs font-semibold hover:opacity-90 transition-opacity flex-shrink-0">
                Try Now
              </motion.button>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ─── FOR RETAILERS ─── */}
      <section id="retailers" className="bg-foreground py-14">
        <div className="max-w-5xl mx-auto px-6">
          <FadeIn>
            <div className="text-center mb-5">
              <span className="text-accent text-xs font-bold uppercase tracking-widest">For Retailers</span>
              <h2 className="text-3xl md:text-4xl font-black text-background mt-2 tracking-tight">
                Built for the stores<br className="hidden md:block" /> that built your neighborhood
              </h2>
            </div>
          </FadeIn>

          <FadeIn delay={0.1}>
            <div className="bg-background/5 border border-background/10 rounded-2xl p-6 mb-8 max-w-3xl mx-auto">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center flex-shrink-0">
                  <Heart size={18} className="text-accent-foreground" />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-background tracking-tight mb-1">Your store matters. We're here to prove it.</h3>
                  <p className="text-background/45 leading-relaxed text-sm">
                    The big chains have entire teams building for the future. SKAAP levels the playing field — so your store leads.
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
                <motion.div whileHover={{ y: -3 }} className="bg-background/5 border border-background/10 rounded-2xl p-5">
                  <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center mb-3">
                    <card.icon size={18} className="text-accent-foreground" />
                  </div>
                  <h3 className="font-bold text-background mb-1 tracking-tight text-sm">{card.title}</h3>
                  <p className="text-xs text-background/40 leading-relaxed">{card.desc}</p>
                </motion.div>
              </FadeIn>
            ))}
          </div>

          <FadeIn delay={0.2}>
            <div className="text-center space-y-2">
              <a href="#contact" className="inline-flex items-center gap-2 bg-accent text-accent-foreground px-7 py-3.5 rounded-full font-bold text-sm shadow-hero hover:opacity-90 transition-opacity">
                Get Started — Free for 90 Days <ArrowRight size={14} />
              </a>
              <br />
              <motion.button whileTap={{ scale: 0.97 }} onClick={() => navigate("/dashboard")} className="inline-flex items-center gap-2 border border-background/20 text-background/60 px-5 py-2.5 rounded-full font-medium text-xs hover:text-background transition-colors">
                See Retailer Dashboard →
              </motion.button>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ─── FAQ ─── */}
      <section className="py-12 bg-background">
        <div className="max-w-2xl mx-auto px-6">
          <FadeIn><h2 className="text-2xl font-black text-foreground text-center mb-6 tracking-tight">Questions</h2></FadeIn>
          <div className="space-y-1.5">
            {faqs.map((faq, i) => (
              <FadeIn key={i} delay={i * 0.03}>
                <motion.div className="border border-border rounded-xl overflow-hidden">
                  <button onClick={() => setFaqOpen(faqOpen === i ? null : i)} aria-expanded={faqOpen === i} className="w-full flex items-center justify-between p-3.5 text-left">
                    <span className="font-semibold text-foreground text-sm">{faq.q}</span>
                    <motion.div animate={{ rotate: faqOpen === i ? 180 : 0 }} transition={{ duration: 0.2 }}><ChevronDown size={14} className="text-muted-foreground" /></motion.div>
                  </button>
                  {faqOpen === i && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} transition={{ duration: 0.2 }}>
                      <div className="px-3.5 pb-3.5"><p className="text-sm text-muted-foreground leading-relaxed">{faq.a}</p></div>
                    </motion.div>
                  )}
                </motion.div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ─── CONTACT ─── */}
      <section id="contact" className="bg-muted/30 py-12">
        <div className="max-w-xl mx-auto px-6 text-center">
          <FadeIn>
            <h2 className="text-2xl font-black text-foreground mb-2 tracking-tight">Let's talk</h2>
            <p className="text-muted-foreground text-sm mb-6">Shopper or store owner — drop your email.</p>
          </FadeIn>
          <FadeIn delay={0.1}>
            {submitted ? (
              <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} className="bg-success/10 text-success rounded-2xl p-5 font-semibold">✅ Thanks! We'll reach out soon.</motion.div>
            ) : (
              <form onSubmit={handleEmailSubmit} className="flex gap-2">
                <div className="relative flex-1">
                  <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="your@email.com" aria-label="Email address" className="w-full bg-card border border-border rounded-full py-3 pl-11 pr-4 text-sm outline-none focus:ring-2 focus:ring-foreground/10 transition-shadow" />
                </div>
                <motion.button whileTap={{ scale: 0.95 }} type="submit" disabled={submitting} className="bg-foreground text-background px-5 py-3 rounded-full font-semibold text-sm disabled:opacity-60 hover:opacity-90 transition-opacity">
                  {submitting ? "Sending…" : "Get in Touch"}
                </motion.button>
              </form>
            )}
          </FadeIn>
        </div>
      </section>

      {/* ─── FOOTER ─── */}
      <footer className="bg-foreground py-8">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex flex-col items-center gap-4">
            <div className="flex items-center gap-2.5">
              <img src={skaapIcon} alt="SKAAP" className="w-7 h-7 rounded-lg" />
              <div>
                <span className="font-bold text-background tracking-tight text-sm">SKAAP</span>
                <p className="text-[10px] text-background/30">Your phone is the checkout.</p>
              </div>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs text-background/50 font-medium">
              <a href="#how-it-works" className="hover:text-background transition-colors">How it Works</a>
              <a href="#retailers" className="hover:text-background transition-colors">Retailers</a>
              <button onClick={() => navigate("/login")} className="hover:text-background transition-colors">Sign In</button>
              <a href="#contact" className="hover:text-background transition-colors">Contact</a>
            </div>
            <div className="flex items-center gap-4">
              <a href="https://www.instagram.com/useskaap?igsh=MWV5aDY5ZHJzam1keQ%3D%3D&utm_source=qr" target="_blank" rel="noopener noreferrer" aria-label="SKAAP on Instagram" className="text-background/50 hover:text-background transition-colors"><Instagram size={18} /></a>
              <a href="https://www.linkedin.com/company/skaaptech/" target="_blank" rel="noopener noreferrer" aria-label="SKAAP on LinkedIn" className="text-background/50 hover:text-background transition-colors"><Linkedin size={18} /></a>
            </div>
          </div>
          <div className="border-t border-background/10 mt-6 pt-6 text-center">
            <p className="text-[10px] text-background/20">© 2026 SKAAP Technologies Inc.</p>
          </div>
        </div>
      </footer>

    </div>
  );
};

export default Index;
