import { useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { motion, useInView } from "framer-motion";
import {
  Store, ScanLine, CreditCard, QrCode,
  Mail, MapPin, Clock, Smile, ShieldCheck, TrendingUp, Zap,
  Smartphone, ArrowRight, ChevronDown, Play, Sparkles
} from "lucide-react";
import skaapIcon from "@/assets/skaap-icon.png";
import heroPhone from "@/assets/hero-phone-mockup.png";
import AnimatedCounter from "@/components/website/AnimatedCounter";
import ComparisonTable from "@/components/website/ComparisonTable";

const FadeInSection = ({ children, className = "", delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 30 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5, delay, ease: [0.25, 0.46, 0.45, 0.94] }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

const DemoPhone = () => {
  const [step, setStep] = useState(0);
  const steps = [
    { title: "Select store", subtitle: "Pick your nearby store", icon: MapPin },
    { title: "Scan items", subtitle: "Point camera at barcodes", icon: ScanLine },
    { title: "Pay instantly", subtitle: "Apple Pay, card, or Google Pay", icon: CreditCard },
    { title: "Walk out", subtitle: "Show QR at exit — done", icon: QrCode },
  ];

  return (
    <div className="relative mx-auto w-[280px]">
      <div className="bg-foreground rounded-[2.5rem] p-3 shadow-hero">
        <div className="bg-background rounded-[2rem] overflow-hidden">
          <div className="flex justify-center pt-3 pb-4">
            <div className="w-24 h-6 bg-foreground rounded-full" />
          </div>
          <div className="px-5 pb-8">
            <motion.div key={step} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25, ease: "easeOut" }}>
              <div className="w-14 h-14 rounded-2xl bg-foreground flex items-center justify-center mb-4">
                {(() => { const Icon = steps[step].icon; return <Icon size={22} className="text-background" />; })()}
              </div>
              <h4 className="font-bold text-foreground text-xl tracking-tight">{steps[step].title}</h4>
              <p className="text-muted-foreground text-sm mt-1">{steps[step].subtitle}</p>
            </motion.div>
            <div className="flex gap-2 mt-8">
              {steps.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setStep(i)}
                  className={`h-1 rounded-full transition-all duration-300 ${i === step ? "w-8 bg-foreground" : "w-2 bg-muted-foreground/20"}`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
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
      await supabase.functions.invoke("contact-notify", {
        body: { email, type: "general" },
      });
      setSubmitted(true);
    } catch (err) {
      console.error("Submit error:", err);
    } finally {
      setSubmitting(false);
    }
  };

  const faqs = [
    { q: "How does SKAAP work?", a: "Download the app, walk into a participating store, scan items with your phone camera as you shop, pay in-app, and show your QR code at the exit. No checkout lines." },
    { q: "Which stores support SKAAP?", a: "We're launching with select stores across the East Coast. Enter your ZIP code to find stores near you." },
    { q: "Is it secure?", a: "SKAAP uses bank-level encryption for all transactions. Your payment info is tokenized and never stored on our servers." },
    { q: "What does it cost store owners?", a: "Just 0.9% per transaction. No hardware costs, no monthly fees, no contracts." },
  ];

  return (
    <div className="min-h-screen bg-background font-sans overflow-x-hidden">
      {/* ─── NAV ──────────────────────────────────── */}
      <nav className="fixed top-0 w-full z-50 glass border-b border-border/50">
        <div className="max-w-6xl mx-auto flex items-center justify-between px-6 py-3">
          <div className="flex items-center gap-2.5">
            <img src={skaapIcon} alt="SKAAP" className="w-8 h-8 rounded-lg" />
            <span className="font-bold text-lg text-foreground tracking-tight">SKAAP</span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm text-muted-foreground font-medium">
            <a href="#shoppers" className="hover:text-foreground transition-colors">Shoppers</a>
            <a href="#stores" className="hover:text-foreground transition-colors">Retailers</a>
            <a href="#contact" className="hover:text-foreground transition-colors">Contact</a>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => navigate("/login")} className="text-sm text-muted-foreground hover:text-foreground transition-colors hidden md:block font-medium">
              Sign In
            </button>
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate("/app")}
              className="bg-foreground text-background px-5 py-2.5 rounded-full text-sm font-semibold hover:opacity-90 transition-opacity flex items-center gap-2"
            >
              <Play size={12} fill="currentColor" /> Try Demo
            </motion.button>
          </div>
        </div>
      </nav>

      {/* ─── HERO ────────────────────────────────── */}
      <section className="relative pt-32 pb-20 md:pt-44 md:pb-32 overflow-hidden bg-foreground">
        {/* Subtle grid */}
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: "radial-gradient(circle at 1px 1px, hsl(0 0% 100%) 1px, transparent 0)", backgroundSize: "40px 40px" }} />

        <div className="relative max-w-6xl mx-auto px-6 flex flex-col lg:flex-row items-center gap-16">
          <div className="flex-1 text-center lg:text-left">
            <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}>
              <span className="inline-flex items-center gap-1.5 bg-background/10 text-background/80 text-xs font-medium px-3.5 py-1.5 rounded-full mb-6 backdrop-blur-sm">
                <Sparkles size={12} /> Now launching on the East Coast
              </span>
              <h1 className="text-5xl md:text-7xl lg:text-8xl font-black text-background leading-[0.95] tracking-tighter mb-6">
                Scan it.<br />
                Skip the line.<br />
                <span className="text-gradient">Walk out.</span>
              </h1>
              <p className="text-background/45 text-lg md:text-xl mb-10 max-w-lg mx-auto lg:mx-0 font-light leading-relaxed">
                Your phone is the checkout. Scan, pay, and leave — no lines, no waiting, no friction.
              </p>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25, duration: 0.5 }} className="flex flex-col sm:flex-row gap-3 justify-center lg:justify-start">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => navigate("/app")}
                className="bg-accent text-accent-foreground px-8 py-4 rounded-full font-bold text-base flex items-center justify-center gap-2.5 shadow-hero"
              >
                <Play size={16} fill="currentColor" /> Try the Demo
              </motion.button>
              <a
                href="#stores"
                className="border border-background/20 text-background/80 px-8 py-4 rounded-full font-semibold text-base flex items-center justify-center gap-2 hover:bg-background/5 transition-colors"
              >
                <Store size={16} /> I Own a Store
              </a>
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.7, type: "spring", stiffness: 100, damping: 20 }}
            className="flex-1 flex justify-center"
          >
            <img src={heroPhone} alt="SKAAP App" className="w-64 md:w-80 drop-shadow-2xl" />
          </motion.div>
        </div>

        <motion.div animate={{ y: [0, 6, 0] }} transition={{ duration: 2, repeat: Infinity }} className="absolute bottom-8 left-1/2 -translate-x-1/2 text-background/20">
          <ChevronDown size={20} />
        </motion.div>
      </section>

      {/* ─── STATS ──────────────────────────────── */}
      <section className="bg-background py-16 border-b border-border">
        <div className="max-w-6xl mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-10">
          {[
            { icon: Clock, end: 19, suffix: " min", desc: "Average time saved per trip" },
            { icon: Smile, end: 94, suffix: "%", desc: "Would never go back to lines" },
            { icon: TrendingUp, end: 3, suffix: "x", desc: "Faster than self-checkout" },
          ].map((item, i) => (
            <FadeInSection key={i} delay={i * 0.08}>
              <div className="text-center">
                <p className="text-5xl md:text-6xl font-black text-foreground tracking-tighter">
                  <AnimatedCounter end={item.end} suffix={item.suffix} />
                </p>
                <p className="text-muted-foreground text-sm mt-2 font-medium">{item.desc}</p>
              </div>
            </FadeInSection>
          ))}
        </div>
      </section>

      {/* ─── FOR SHOPPERS ────────────────────────── */}
      <section id="shoppers" className="py-24 bg-background">
        <div className="max-w-6xl mx-auto px-6">
          <FadeInSection>
            <div className="text-center mb-16">
              <span className="text-accent text-xs font-bold uppercase tracking-widest">For Shoppers</span>
              <h2 className="text-4xl md:text-6xl font-black text-foreground mt-3 tracking-tight">Your trip, reimagined</h2>
              <p className="text-muted-foreground mt-4 max-w-md mx-auto text-lg font-light">No more waiting. Just scan, pay, and go.</p>
            </div>
          </FadeInSection>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <FadeInSection delay={0.1}>
              <DemoPhone />
            </FadeInSection>

            <div className="space-y-1">
              {[
                { icon: ScanLine, title: "Scan as you shop", desc: "Point your camera at any barcode. Items appear instantly." },
                { icon: CreditCard, title: "Pay from your pocket", desc: "Apple Pay, Google Pay, or card. Checkout in your hand." },
                { icon: QrCode, title: "Flash & walk out", desc: "Show your QR at the exit. No bagging, no waiting." },
                { icon: ShieldCheck, title: "Bank-level security", desc: "256-bit encryption. Payment data is tokenized." },
              ].map((b, i) => (
                <FadeInSection key={i} delay={0.12 + i * 0.08}>
                  <motion.div whileHover={{ x: 4 }} className="flex gap-4 p-4 rounded-2xl hover:bg-muted/60 transition-colors cursor-default">
                    <div className="w-10 h-10 rounded-xl bg-foreground flex items-center justify-center flex-shrink-0">
                      <b.icon size={18} className="text-background" />
                    </div>
                    <div>
                      <h3 className="font-bold text-foreground tracking-tight">{b.title}</h3>
                      <p className="text-sm text-muted-foreground mt-0.5">{b.desc}</p>
                    </div>
                  </motion.div>
                </FadeInSection>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ─── CTA BANNER ─────────────────────────── */}
      <section className="py-20 bg-foreground">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <FadeInSection>
            <h2 className="text-4xl md:text-6xl font-black text-background tracking-tight leading-tight mb-6">
              Ready to skip<br />the line?
            </h2>
            <p className="text-background/40 text-lg mb-10 max-w-md mx-auto font-light">
              Experience the future of grocery shopping. It takes 30 seconds.
            </p>
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => navigate("/app")}
              className="bg-accent text-accent-foreground px-10 py-5 rounded-full font-bold text-lg shadow-hero inline-flex items-center gap-3"
            >
              <Play size={18} fill="currentColor" /> Try the Demo Now
            </motion.button>
          </FadeInSection>
        </div>
      </section>

      {/* ─── COMPARISON ─────────────────────────── */}
      <section className="py-24 bg-muted/30">
        <div className="max-w-4xl mx-auto px-6">
          <FadeInSection>
            <div className="text-center mb-14">
              <span className="text-accent text-xs font-bold uppercase tracking-widest">Why SKAAP</span>
              <h2 className="text-4xl md:text-6xl font-black text-foreground mt-3 tracking-tight">The checkout, compared</h2>
            </div>
          </FadeInSection>
          <FadeInSection delay={0.1}>
            <div className="bg-card rounded-3xl border border-border overflow-hidden shadow-elevated">
              <ComparisonTable />
            </div>
          </FadeInSection>
        </div>
      </section>

      {/* ─── FOR RETAILERS ───────────────────────── */}
      <section id="stores" className="bg-foreground py-24">
        <div className="max-w-6xl mx-auto px-6">
          <FadeInSection>
            <div className="text-center mb-16">
              <span className="text-accent text-xs font-bold uppercase tracking-widest">For Retailers</span>
              <h2 className="text-4xl md:text-6xl font-black text-background mt-3 tracking-tight">Upgrade your checkout</h2>
              <p className="text-background/35 mt-4 max-w-md mx-auto text-lg font-light">No hardware. No contracts. Happier customers.</p>
            </div>
          </FadeInSection>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-14">
            {[
              { icon: Smartphone, title: "Zero hardware", desc: "Customers use their own phones. No POS terminals needed." },
              { icon: Zap, title: "Live in 48 hours", desc: "Upload your inventory and you're ready to go." },
              { icon: TrendingUp, title: "0.9% per transaction", desc: "No monthly fees. Cancel anytime." },
            ].map((card, i) => (
              <FadeInSection key={i} delay={i * 0.08}>
                <motion.div whileHover={{ y: -3 }} className="bg-background/5 border border-background/10 rounded-2xl p-6">
                  <div className="w-11 h-11 rounded-xl bg-accent flex items-center justify-center mb-4">
                    <card.icon size={20} className="text-accent-foreground" />
                  </div>
                  <h3 className="font-bold text-background mb-1.5 tracking-tight">{card.title}</h3>
                  <p className="text-sm text-background/40 leading-relaxed">{card.desc}</p>
                </motion.div>
              </FadeInSection>
            ))}
          </div>

          <FadeInSection delay={0.2}>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
              {[
                { end: 32, suffix: "%", label: "Less checkout staffing" },
                { end: 4.8, suffix: "★", label: "Rating boost", decimals: 1 },
                { end: 28, suffix: "%", label: "More repeat visits" },
                { end: 48, suffix: "h", prefix: "<", label: "Signup to live" },
              ].map((s, i) => (
                <div key={i} className="text-center p-3">
                  <p className="text-3xl font-black text-accent tabular-nums">
                    <AnimatedCounter end={s.end} suffix={s.suffix} prefix={s.prefix} decimals={s.decimals} />
                  </p>
                  <p className="text-xs text-background/35 mt-1 font-medium">{s.label}</p>
                </div>
              ))}
            </div>
          </FadeInSection>

          <FadeInSection delay={0.25}>
            <div className="text-center space-y-3">
              <a href="#contact" className="inline-flex items-center gap-2.5 bg-accent text-accent-foreground px-8 py-4 rounded-full font-bold text-base shadow-hero hover:opacity-90 transition-opacity">
                Onboard Your Store <ArrowRight size={16} />
              </a>
              <br />
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={() => navigate("/dashboard")}
                className="inline-flex items-center gap-2 border border-background/20 text-background/60 px-6 py-3 rounded-full font-medium text-sm hover:text-background transition-colors"
              >
                See Retailer Dashboard →
              </motion.button>
            </div>
          </FadeInSection>
        </div>
      </section>

      {/* ─── FAQ ─────────────────────────────────── */}
      <section className="py-24 bg-background">
        <div className="max-w-2xl mx-auto px-6">
          <FadeInSection>
            <h2 className="text-3xl md:text-4xl font-black text-foreground text-center mb-12 tracking-tight">Questions</h2>
          </FadeInSection>
          <div className="space-y-2">
            {faqs.map((faq, i) => (
              <FadeInSection key={i} delay={i * 0.04}>
                <motion.div className="border border-border rounded-2xl overflow-hidden">
                  <button onClick={() => setFaqOpen(faqOpen === i ? null : i)} className="w-full flex items-center justify-between p-4 text-left">
                    <span className="font-semibold text-foreground text-sm">{faq.q}</span>
                    <motion.div animate={{ rotate: faqOpen === i ? 180 : 0 }} transition={{ duration: 0.2 }}>
                      <ChevronDown size={16} className="text-muted-foreground" />
                    </motion.div>
                  </button>
                  {faqOpen === i && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} transition={{ duration: 0.2 }}>
                      <div className="px-4 pb-4">
                        <p className="text-sm text-muted-foreground leading-relaxed">{faq.a}</p>
                      </div>
                    </motion.div>
                  )}
                </motion.div>
              </FadeInSection>
            ))}
          </div>
        </div>
      </section>

      {/* ─── CONTACT ─────────────────────────────── */}
      <section id="contact" className="bg-muted/30 py-20">
        <div className="max-w-xl mx-auto px-6 text-center">
          <FadeInSection>
            <h2 className="text-3xl font-black text-foreground mb-3 tracking-tight">Let's talk</h2>
            <p className="text-muted-foreground text-sm mb-8">Drop your email and we'll be in touch.</p>
          </FadeInSection>

          <FadeInSection delay={0.1}>
            {submitted ? (
              <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} className="bg-success/10 text-success rounded-2xl p-6 font-semibold">
                ✅ Thanks! We'll reach out soon.
              </motion.div>
            ) : (
              <form onSubmit={handleEmailSubmit} className="flex gap-2">
                <div className="relative flex-1">
                  <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your@email.com"
                    className="w-full bg-card border border-border rounded-full py-3.5 pl-11 pr-4 text-sm outline-none focus:ring-2 focus:ring-foreground/10 transition-shadow"
                  />
                </div>
                <motion.button whileTap={{ scale: 0.95 }} type="submit" disabled={submitting} className="bg-foreground text-background px-6 py-3.5 rounded-full font-semibold text-sm disabled:opacity-60 hover:opacity-90 transition-opacity">
                  {submitting ? "Sending…" : "Get in Touch"}
                </motion.button>
              </form>
            )}
          </FadeInSection>
        </div>
      </section>

      {/* ─── FOOTER ──────────────────────────────── */}
      <footer className="bg-foreground py-12">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2.5">
              <img src={skaapIcon} alt="SKAAP" className="w-8 h-8 rounded-lg" />
              <div>
                <span className="font-bold text-background tracking-tight">SKAAP</span>
                <p className="text-xs text-background/30">Your phone is the checkout.</p>
              </div>
            </div>
            <div className="flex gap-6 text-sm text-background/40 font-medium">
              <a href="#shoppers" className="hover:text-background transition-colors">Shoppers</a>
              <a href="#stores" className="hover:text-background transition-colors">Retailers</a>
              <button onClick={() => navigate("/login")} className="hover:text-background transition-colors">Sign In</button>
              <a href="#contact" className="hover:text-background transition-colors">Contact</a>
            </div>
          </div>
          <div className="border-t border-background/10 mt-8 pt-8 text-center">
            <p className="text-xs text-background/20">© 2026 SKAAP Technologies Inc.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
