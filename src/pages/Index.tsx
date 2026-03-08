import { useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { motion, useInView } from "framer-motion";
import {
  Download, Store, ScanLine, CreditCard, QrCode,
  Mail, MapPin, Clock, Smile, ShieldCheck, TrendingUp, Zap,
  Smartphone, ArrowRight, Star, ChevronDown
} from "lucide-react";
import skaapIcon from "@/assets/skaap-icon.png";
import heroPhone from "@/assets/hero-phone-mockup.png";
import AnimatedCounter from "@/components/website/AnimatedCounter";
import ComparisonTable from "@/components/website/ComparisonTable";

// ─── Animated Section Wrapper ────────────────────────────────
const FadeInSection = ({ children, className = "", delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 40 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, delay, ease: "easeOut" }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

// ─── Interactive Demo Phone ─────────────────────────────────
const DemoPhone = () => {
  const [step, setStep] = useState(0);
  const steps = [
    { title: "Select store", subtitle: "Pick your nearby store", icon: MapPin, color: "bg-primary/10 text-primary" },
    { title: "Scan items", subtitle: "Point camera at barcodes", icon: ScanLine, color: "bg-primary/10 text-primary" },
    { title: "Pay instantly", subtitle: "Apple Pay, card, or Google Pay", icon: CreditCard, color: "bg-primary/10 text-primary" },
    { title: "Walk out!", subtitle: "Show QR at exit — done!", icon: QrCode, color: "bg-success/10 text-success" },
  ];

  return (
    <div className="relative mx-auto w-[260px]">
      <div className="bg-secondary rounded-[2.5rem] p-3 shadow-elevated">
        <div className="bg-background rounded-[2rem] overflow-hidden">
          <div className="flex justify-center pt-2 pb-3">
            <div className="w-20 h-5 bg-secondary rounded-full" />
          </div>
          <div className="px-4 pb-6">
            <motion.div key={step} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
              <div className={`w-14 h-14 rounded-2xl ${steps[step].color} flex items-center justify-center mb-3`}>
                {(() => { const Icon = steps[step].icon; return <Icon size={24} />; })()}
              </div>
              <h4 className="font-bold text-foreground text-lg">{steps[step].title}</h4>
              <p className="text-muted-foreground text-sm mt-1">{steps[step].subtitle}</p>
            </motion.div>
            <div className="flex gap-2 mt-6">
              {steps.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setStep(i)}
                  className={`h-1.5 rounded-full transition-all duration-300 ${i === step ? "w-8 bg-primary" : "w-1.5 bg-muted-foreground/30"}`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};


// ─── MAIN PAGE ──────────────────────────────────────────────
const Index = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [faqOpen, setFaqOpen] = useState<number | null>(null);

  // Removed useScroll/useTransform to fix compatibility

  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) setSubmitted(true);
  };

  const faqs = [
    { q: "How does SKAAP work?", a: "Download the app, walk into a participating store, scan items with your phone camera as you shop, pay in-app, and show your QR code at the exit. That's it — no checkout lines." },
    { q: "Which stores support SKAAP?", a: "We're launching with Publix, Kroger, Whole Foods, and Trader Joe's locations across the East Coast. Enter your ZIP code to find stores near you." },
    { q: "Is it secure?", a: "Absolutely. SKAAP uses bank-level encryption for all transactions. Your payment info is tokenized and never stored on our servers." },
    { q: "What does it cost store owners?", a: "Just 0.9% per transaction. No hardware costs, no monthly fees, no contracts. You only pay when customers use it." },
  ];

  return (
    <div className="min-h-screen bg-background font-sans overflow-x-hidden">
      {/* ─── STICKY NAV ──────────────────────────────── */}
      <nav className="fixed top-0 w-full z-50 bg-background/90 backdrop-blur-md border-b border-border">
        <div className="max-w-6xl mx-auto flex items-center justify-between px-6 py-3">
          <div className="flex items-center gap-2">
            <img src={skaapIcon} alt="SKAAP" className="w-8 h-8 rounded-lg" />
            <span className="font-bold text-lg text-foreground">SKAAP</span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm text-muted-foreground">
            <a href="#shoppers" className="hover:text-foreground transition-colors">For Shoppers</a>
            <a href="#stores" className="hover:text-foreground transition-colors">For Stores</a>
            
            <a href="#contact" className="hover:text-foreground transition-colors">Contact</a>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => navigate("/login")} className="text-sm text-muted-foreground hover:text-foreground transition-colors hidden md:block">
              Sign In
            </button>
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate("/app")}
              className="bg-primary text-primary-foreground px-4 py-2 rounded-xl text-sm font-semibold hover:opacity-90 transition-opacity"
            >
              Try Demo
            </motion.button>
          </div>
        </div>
      </nav>

      {/* ─── HERO ────────────────────────────────────── */}
      <section className="relative pt-28 pb-20 md:pt-40 md:pb-28 overflow-hidden">
        <div className="absolute inset-0 bg-secondary" />
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 60, repeat: Infinity, ease: "linear" }} className="absolute -top-20 -right-20 w-96 h-96 rounded-full border border-primary/10" />
        <motion.div animate={{ rotate: -360 }} transition={{ duration: 80, repeat: Infinity, ease: "linear" }} className="absolute -bottom-32 -left-32 w-[500px] h-[500px] rounded-full border border-primary/5" />

        <div className="relative max-w-6xl mx-auto px-6 flex flex-col lg:flex-row items-center gap-12">
          <div className="flex-1 text-center lg:text-left">
            <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>
              <span className="inline-block bg-primary/10 text-primary text-xs font-semibold px-3 py-1 rounded-full mb-5">
                🇺🇸 Now launching on the East Coast
              </span>
              <h1 className="text-4xl md:text-6xl lg:text-7xl font-black text-secondary-foreground leading-[1.05] mb-6">
                Scan it.<br />
                Skip the line.<br />
                <span className="text-gradient">Escape the wait.</span>
              </h1>
              <p className="text-secondary-foreground/60 text-lg md:text-xl mb-8 max-w-lg mx-auto lg:mx-0">
                SKAAP turns your phone into a checkout. Shop at your pace, pay instantly, and walk out — no lines, ever.
              </p>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3, duration: 0.5 }} className="flex flex-wrap gap-3 justify-center lg:justify-start">
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => navigate("/app")}
                className="bg-primary text-primary-foreground px-7 py-3.5 rounded-2xl font-bold text-base flex items-center gap-2 shadow-lg shadow-primary/25"
              >
                <Download size={18} /> Get the App
              </motion.button>
              <a
                href="#stores"
                className="border-2 border-secondary-foreground/20 text-secondary-foreground px-7 py-3.5 rounded-2xl font-bold text-base flex items-center gap-2 hover:border-secondary-foreground/40 transition-colors hover:scale-[1.03] active:scale-[0.97] transition-transform"
              >
                <Store size={18} /> I Own a Store
              </a>
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9, rotateY: 15 }}
            animate={{ opacity: 1, scale: 1, rotateY: 0 }}
            transition={{ delay: 0.2, duration: 0.8, type: "spring" }}
            className="flex-1 flex justify-center"
          >
            <img src={heroPhone} alt="SKAAP App" className="w-64 md:w-80 drop-shadow-2xl" />
          </motion.div>
        </div>

        <motion.div animate={{ y: [0, 8, 0] }} transition={{ duration: 2, repeat: Infinity }} className="absolute bottom-6 left-1/2 -translate-x-1/2 text-secondary-foreground/30">
          <ChevronDown size={24} />
        </motion.div>
      </section>

      {/* ─── ANIMATED STATS BAR ──────────────────────── */}
      <section className="bg-primary py-12">
        <div className="max-w-6xl mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            { icon: Clock, end: 19, suffix: " min", desc: "Average time saved per shopping trip" },
            { icon: Smile, end: 94, suffix: "%", desc: "Of shoppers say they'd never go back" },
            { icon: TrendingUp, end: 3, suffix: "x", desc: "Faster than self-checkout kiosks" },
          ].map((item, i) => (
            <FadeInSection key={i} delay={i * 0.1}>
              <div className="text-center flex flex-col items-center">
                <item.icon size={28} className="text-primary-foreground/80 mb-2" />
                <p className="text-3xl md:text-5xl font-black text-primary-foreground">
                  <AnimatedCounter end={item.end} suffix={item.suffix} />
                </p>
                <p className="text-primary-foreground/70 text-sm mt-1">{item.desc}</p>
              </div>
            </FadeInSection>
          ))}
        </div>
      </section>

      {/* ─── FOR SHOPPERS ────────────────────────────── */}
      <section id="shoppers" className="py-20 bg-background">
        <div className="max-w-6xl mx-auto px-6">
          <FadeInSection>
            <div className="text-center mb-14">
              <span className="text-primary text-sm font-semibold uppercase tracking-wider">For Shoppers</span>
              <h2 className="text-3xl md:text-5xl font-bold text-foreground mt-2">Your grocery trip, reimagined</h2>
              <p className="text-muted-foreground mt-3 max-w-xl mx-auto">No more waiting. No more conveyor belts. Just scan, pay, and go.</p>
            </div>
          </FadeInSection>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <FadeInSection delay={0.1}>
              <DemoPhone />
            </FadeInSection>

            <div className="space-y-5">
              {[
                { icon: ScanLine, title: "Scan as you shop", desc: "Point your camera at any barcode. Items appear instantly — like a Snapchat filter for groceries." },
                { icon: CreditCard, title: "Pay from your pocket", desc: "Apple Pay, Google Pay, or card. Checkout happens in your hand, not at a counter." },
                { icon: QrCode, title: "Flash & walk out", desc: "Show your QR at the exit. No bagging, no waiting, no awkward self-checkout errors." },
                { icon: ShieldCheck, title: "Bank-level security", desc: "256-bit encryption. Your payment data is tokenized and never stored." },
              ].map((b, i) => (
                <FadeInSection key={i} delay={0.15 + i * 0.1}>
                  <motion.div whileHover={{ x: 6 }} className="flex gap-4 p-4 rounded-2xl hover:bg-muted/50 transition-colors cursor-default">
                    <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <b.icon size={20} className="text-primary" />
                    </div>
                    <div>
                      <h3 className="font-bold text-foreground">{b.title}</h3>
                      <p className="text-sm text-muted-foreground mt-0.5">{b.desc}</p>
                    </div>
                  </motion.div>
                </FadeInSection>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ─── COMPARISON TABLE ────────────────────────── */}
      <section className="py-20 bg-muted/30">
        <div className="max-w-4xl mx-auto px-6">
          <FadeInSection>
            <div className="text-center mb-12">
              <span className="text-primary text-sm font-semibold uppercase tracking-wider">Why SKAAP?</span>
              <h2 className="text-3xl md:text-5xl font-bold text-foreground mt-2">The checkout, compared</h2>
              <p className="text-muted-foreground mt-3">See how SKAAP stacks up against what you're used to</p>
            </div>
          </FadeInSection>
          <FadeInSection delay={0.15}>
            <div className="bg-card rounded-3xl border border-border shadow-card overflow-hidden">
              <ComparisonTable />
            </div>
          </FadeInSection>
        </div>
      </section>

      {/* ─── FOR STORE OWNERS ────────────────────────── */}
      <section id="stores" className="bg-secondary py-20">
        <div className="max-w-6xl mx-auto px-6">
          <FadeInSection>
            <div className="text-center mb-14">
              <span className="text-primary text-sm font-semibold uppercase tracking-wider">For Retailers</span>
              <h2 className="text-3xl md:text-5xl font-bold text-secondary-foreground mt-2">Give your store a checkout upgrade</h2>
              <p className="text-secondary-foreground/50 mt-3 max-w-xl mx-auto">No hardware. No contracts. Just happier customers and faster throughput.</p>
            </div>
          </FadeInSection>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            {[
              { icon: Smartphone, title: "Zero hardware cost", desc: "Customers use their own phones. No POS terminals, no scanners, no installation." },
              { icon: Zap, title: "Live in 48 hours", desc: "Our team handles onboarding. Upload your inventory and you're ready to go." },
              { icon: TrendingUp, title: "0.9% per transaction", desc: "Pay only when customers use SKAAP. No monthly fees, cancel anytime." },
            ].map((card, i) => (
              <FadeInSection key={i} delay={i * 0.1}>
                <motion.div whileHover={{ y: -4 }} className="bg-secondary-foreground/5 border border-secondary-foreground/10 rounded-2xl p-6">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                    <card.icon size={22} className="text-primary" />
                  </div>
                  <h3 className="font-bold text-secondary-foreground mb-2">{card.title}</h3>
                  <p className="text-sm text-secondary-foreground/50">{card.desc}</p>
                </motion.div>
              </FadeInSection>
            ))}
          </div>

          <FadeInSection delay={0.2}>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
              {[
                { end: 32, suffix: "%", label: "Less checkout staffing needed" },
                { end: 4.8, suffix: "★", label: "Average store rating boost", decimals: 1 },
                { end: 28, suffix: "%", label: "Increase in repeat visits" },
                { end: 48, suffix: "h", prefix: "<", label: "From signup to live" },
              ].map((s, i) => (
                <div key={i} className="text-center p-3">
                  <p className="text-2xl font-black text-primary">
                    <AnimatedCounter end={s.end} suffix={s.suffix} prefix={s.prefix} decimals={s.decimals} />
                  </p>
                  <p className="text-xs text-secondary-foreground/50 mt-1">{s.label}</p>
                </div>
              ))}
            </div>
          </FadeInSection>

          <FadeInSection delay={0.3}>
            <div className="text-center space-y-3">
              <a href="#contact" className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-8 py-3.5 rounded-2xl font-bold shadow-lg shadow-primary/25 hover:scale-[1.03] active:scale-[0.97] transition-transform">
                Onboard Your Store <ArrowRight size={18} />
              </a>
              <br />
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => navigate("/dashboard")}
                className="inline-flex items-center gap-2 border-2 border-secondary-foreground/20 text-secondary-foreground px-6 py-3 rounded-2xl font-bold text-sm hover:border-secondary-foreground/40 transition-colors"
              >
                See Retailer Dashboard →
              </motion.button>
            </div>
          </FadeInSection>
        </div>
      </section>

      {/* ─── FAQ ─────────────────────────────────────── */}
      <section className="py-20 bg-background">
        <div className="max-w-2xl mx-auto px-6">
          <FadeInSection>
            <h2 className="text-3xl font-bold text-foreground text-center mb-10">Common questions</h2>
          </FadeInSection>
          <div className="space-y-3">
            {faqs.map((faq, i) => (
              <FadeInSection key={i} delay={i * 0.05}>
                <motion.div className="border border-border rounded-2xl overflow-hidden">
                  <button onClick={() => setFaqOpen(faqOpen === i ? null : i)} className="w-full flex items-center justify-between p-4 text-left">
                    <span className="font-semibold text-foreground text-sm">{faq.q}</span>
                    <motion.div animate={{ rotate: faqOpen === i ? 180 : 0 }}>
                      <ChevronDown size={18} className="text-muted-foreground" />
                    </motion.div>
                  </button>
                  {faqOpen === i && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} transition={{ duration: 0.2 }}>
                      <div className="px-4 pb-4">
                        <p className="text-sm text-muted-foreground">{faq.a}</p>
                      </div>
                    </motion.div>
                  )}
                </motion.div>
              </FadeInSection>
            ))}
          </div>
        </div>
      </section>

      {/* ─── CONTACT ─────────────────────────────────── */}
      <section id="contact" className="bg-muted/50 py-16">
        <div className="max-w-xl mx-auto px-6 text-center">
          <FadeInSection>
            <h2 className="text-2xl font-bold text-foreground mb-3">Let's talk</h2>
            <p className="text-muted-foreground text-sm mb-6">Whether you're a shopper or a store owner — drop your email and we'll be in touch.</p>
          </FadeInSection>

          <FadeInSection delay={0.1}>
            {submitted ? (
              <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="bg-success/10 text-success rounded-2xl p-6 font-semibold">
                ✅ Thanks! We'll reach out soon.
              </motion.div>
            ) : (
              <form onSubmit={handleEmailSubmit} className="flex gap-2">
                <div className="relative flex-1">
                  <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your@email.com"
                    className="w-full bg-card border border-border rounded-xl py-3 pl-10 pr-4 text-sm outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>
                <motion.button whileTap={{ scale: 0.95 }} type="submit" className="bg-primary text-primary-foreground px-6 py-3 rounded-xl font-semibold text-sm">
                  Get in Touch
                </motion.button>
              </form>
            )}
          </FadeInSection>
        </div>
      </section>

      {/* ─── FOOTER ──────────────────────────────────── */}
      <footer className="bg-secondary py-10">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2">
              <img src={skaapIcon} alt="SKAAP" className="w-8 h-8 rounded-lg" />
              <div>
                <span className="font-bold text-secondary-foreground">SKAAP</span>
                <p className="text-xs text-secondary-foreground/40">Turning your smartphone into a virtual checkout.</p>
              </div>
            </div>
            <div className="flex gap-6 text-sm text-secondary-foreground/50">
              <a href="#shoppers" className="hover:text-secondary-foreground transition-colors">For Shoppers</a>
              <a href="#stores" className="hover:text-secondary-foreground transition-colors">For Stores</a>
              <button onClick={() => navigate("/login")} className="hover:text-secondary-foreground transition-colors">Sign In</button>
              <button onClick={() => navigate("/dashboard")} className="hover:text-secondary-foreground transition-colors">Dashboard</button>
              <a href="#contact" className="hover:text-secondary-foreground transition-colors">Contact</a>
            </div>
          </div>
          <div className="border-t border-secondary-foreground/10 mt-6 pt-6 text-center">
            <p className="text-xs text-secondary-foreground/30">© 2026 SKAAP Technologies Inc.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
