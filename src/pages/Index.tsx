import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, useInView, useScroll, useTransform } from "framer-motion";
import {
  Download, Store, ScanLine, CreditCard, QrCode, ChevronRight,
  Mail, MapPin, Clock, Smile, ShieldCheck, TrendingUp, Zap,
  Smartphone, ArrowRight, Star, Users, ChevronDown
} from "lucide-react";
import skaapIcon from "@/assets/skaap-icon.png";
import heroPhone from "@/assets/hero-phone-mockup.png";

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

// ─── Interactive Store Finder ────────────────────────────────
const mockStores = [
  { name: "Whole Foods Market", address: "226 E 57th St, New York, NY", distance: "0.3 mi", lat: 40.76, lng: -73.97 },
  { name: "Trader Joe's", address: "1095 6th Ave, New York, NY", distance: "0.5 mi", lat: 40.755, lng: -73.983 },
  { name: "Target", address: "615 10th Ave, New York, NY", distance: "0.8 mi", lat: 40.76, lng: -73.995 },
  { name: "Kroger", address: "3535 Perimeter Dr, Austin, TX", distance: "1.2 mi", lat: 30.39, lng: -97.73 },
  { name: "Safeway", address: "1525 N El Camino Real, San Jose, CA", distance: "0.4 mi", lat: 37.36, lng: -121.93 },
];

const StoreFinder = () => {
  const [selectedStore, setSelectedStore] = useState(0);
  const [zipCode, setZipCode] = useState("");

  return (
    <div className="bg-card rounded-3xl shadow-elevated overflow-hidden border border-border">
      {/* Map placeholder - interactive grid */}
      <div className="relative h-64 bg-secondary overflow-hidden">
        <div className="absolute inset-0 grid grid-cols-12 grid-rows-8 gap-px opacity-20">
          {Array.from({ length: 96 }).map((_, i) => (
            <div key={i} className="bg-secondary-foreground/10 rounded-sm" />
          ))}
        </div>
        {/* Store pins */}
        {mockStores.map((store, i) => (
          <motion.button
            key={i}
            initial={{ scale: 0 }}
            animate={{ scale: selectedStore === i ? 1.3 : 1 }}
            whileHover={{ scale: 1.4 }}
            onClick={() => setSelectedStore(i)}
            className="absolute"
            style={{
              left: `${15 + (i * 17)}%`,
              top: `${20 + (i % 3) * 25}%`,
            }}
          >
            <MapPin
              size={selectedStore === i ? 28 : 22}
              className={selectedStore === i ? "text-primary fill-primary" : "text-primary/60"}
            />
          </motion.button>
        ))}
        {/* Selected store popup */}
        <motion.div
          key={selectedStore}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute bottom-4 left-4 right-4 bg-background/95 backdrop-blur-sm rounded-2xl p-3 shadow-card"
        >
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-bold text-sm text-foreground">{mockStores[selectedStore].name}</h4>
              <p className="text-xs text-muted-foreground">{mockStores[selectedStore].address}</p>
            </div>
            <span className="text-xs font-semibold text-primary bg-primary/10 px-2 py-1 rounded-lg">
              {mockStores[selectedStore].distance}
            </span>
          </div>
        </motion.div>
      </div>
      {/* Search */}
      <div className="p-4">
        <div className="flex gap-2">
          <input
            type="text"
            value={zipCode}
            onChange={(e) => setZipCode(e.target.value)}
            placeholder="Enter your ZIP code..."
            className="flex-1 bg-muted rounded-xl py-2.5 px-4 text-sm outline-none focus:ring-2 focus:ring-primary/30"
          />
          <motion.button
            whileTap={{ scale: 0.95 }}
            className="bg-primary text-primary-foreground rounded-xl px-4 py-2.5 text-sm font-semibold"
          >
            Find
          </motion.button>
        </div>
        <div className="mt-3 space-y-2">
          {mockStores.slice(0, 3).map((store, i) => (
            <motion.button
              key={i}
              whileHover={{ x: 4 }}
              onClick={() => setSelectedStore(i)}
              className={`w-full flex items-center justify-between p-2 rounded-xl text-left transition-colors ${
                selectedStore === i ? "bg-primary/5 border border-primary/20" : "hover:bg-muted"
              }`}
            >
              <div className="flex items-center gap-2">
                <MapPin size={14} className="text-primary" />
                <span className="text-sm font-medium text-foreground">{store.name}</span>
              </div>
              <span className="text-xs text-muted-foreground">{store.distance}</span>
            </motion.button>
          ))}
        </div>
      </div>
    </div>
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
      {/* Phone frame */}
      <div className="bg-secondary rounded-[2.5rem] p-3 shadow-elevated">
        <div className="bg-background rounded-[2rem] overflow-hidden">
          {/* Notch */}
          <div className="flex justify-center pt-2 pb-3">
            <div className="w-20 h-5 bg-secondary rounded-full" />
          </div>
          {/* Screen content */}
          <div className="px-4 pb-6">
            <motion.div
              key={step}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <div className={`w-14 h-14 rounded-2xl ${steps[step].color} flex items-center justify-center mb-3`}>
                {(() => { const Icon = steps[step].icon; return <Icon size={24} />; })()}
              </div>
              <h4 className="font-bold text-foreground text-lg">{steps[step].title}</h4>
              <p className="text-muted-foreground text-sm mt-1">{steps[step].subtitle}</p>
            </motion.div>

            {/* Progress dots */}
            <div className="flex gap-2 mt-6">
              {steps.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setStep(i)}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    i === step ? "w-8 bg-primary" : "w-1.5 bg-muted-foreground/30"
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── Shopper Testimonial Carousel ────────────────────────────
const testimonials = [
  { name: "Sarah M.", location: "Brooklyn, NY", text: "I literally walked in, scanned my groceries, and walked out in 8 minutes. Never going back to checkout lines.", rating: 5 },
  { name: "James K.", location: "Austin, TX", text: "The scanning is so fast — feels like Snapchat for shopping. My kids love it too.", rating: 5 },
  { name: "Maria L.", location: "San Jose, CA", text: "I save 20+ minutes every grocery trip. That's hours back every month.", rating: 5 },
];

const TestimonialCarousel = () => {
  const [active, setActive] = useState(0);
  return (
    <div className="relative">
      <motion.div
        key={active}
        initial={{ opacity: 0, x: 30 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -30 }}
        className="bg-card rounded-2xl p-6 shadow-card border border-border"
      >
        <div className="flex gap-0.5 mb-3">
          {Array.from({ length: testimonials[active].rating }).map((_, i) => (
            <Star key={i} size={14} className="text-primary fill-primary" />
          ))}
        </div>
        <p className="text-foreground text-base mb-4 leading-relaxed">"{testimonials[active].text}"</p>
        <div>
          <p className="font-semibold text-foreground text-sm">{testimonials[active].name}</p>
          <p className="text-xs text-muted-foreground">{testimonials[active].location}</p>
        </div>
      </motion.div>
      <div className="flex gap-2 mt-4 justify-center">
        {testimonials.map((_, i) => (
          <button
            key={i}
            onClick={() => setActive(i)}
            className={`w-2 h-2 rounded-full transition-all ${i === active ? "bg-primary w-6" : "bg-muted-foreground/30"}`}
          />
        ))}
      </div>
    </div>
  );
};

// ─── MAIN PAGE ──────────────────────────────────────────────
const Index = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [webhookUrl, setWebhookUrl] = useState("");
  const [faqOpen, setFaqOpen] = useState<number | null>(null);

  const { scrollYProgress } = useScroll();
  const heroOpacity = useTransform(scrollYProgress, [0, 0.15], [1, 0]);
  const heroY = useTransform(scrollYProgress, [0, 0.15], [0, -50]);

  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      setSubmitted(true);
      // Fire Zapier webhook if configured
      if (webhookUrl) {
        fetch(webhookUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          mode: "no-cors",
          body: JSON.stringify({
            type: "new_lead",
            email,
            timestamp: new Date().toISOString(),
            source: "website_contact",
          }),
        }).catch(console.error);
      }
    }
  };

  const faqs = [
    { q: "How does SKAAP work?", a: "Download the app, walk into a participating store, scan items with your phone camera as you shop, pay in-app, and show your QR code at the exit. That's it — no checkout lines." },
    { q: "Which stores support SKAAP?", a: "We're launching in select grocery and retail stores across the US. Enter your ZIP code above to find stores near you. More stores are being added weekly." },
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
            <a href="#find-store" className="hover:text-foreground transition-colors">Find a Store</a>
            <a href="#contact" className="hover:text-foreground transition-colors">Contact</a>
          </div>
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate("/app")}
            className="bg-primary text-primary-foreground px-4 py-2 rounded-xl text-sm font-semibold hover:opacity-90 transition-opacity"
          >
            Try Demo
          </motion.button>
        </div>
      </nav>

      {/* ─── HERO ────────────────────────────────────── */}
      <motion.section style={{ opacity: heroOpacity, y: heroY }} className="relative pt-28 pb-20 md:pt-40 md:pb-28 overflow-hidden">
        <div className="absolute inset-0 bg-secondary" />
        {/* Subtle animated shapes */}
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
          className="absolute -top-20 -right-20 w-96 h-96 rounded-full border border-primary/10"
        />
        <motion.div
          animate={{ rotate: -360 }}
          transition={{ duration: 80, repeat: Infinity, ease: "linear" }}
          className="absolute -bottom-32 -left-32 w-[500px] h-[500px] rounded-full border border-primary/5"
        />

        <div className="relative max-w-6xl mx-auto px-6 flex flex-col lg:flex-row items-center gap-12">
          <div className="flex-1 text-center lg:text-left">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7 }}
            >
              <span className="inline-block bg-primary/10 text-primary text-xs font-semibold px-3 py-1 rounded-full mb-5">
                Now available in select US stores
              </span>
              <h1 className="text-4xl md:text-6xl lg:text-7xl font-black text-secondary-foreground leading-[1.05] mb-6">
                Scan it.<br />
                Bag it.<br />
                <span className="text-gradient">Skip the line.</span>
              </h1>
              <p className="text-secondary-foreground/60 text-lg md:text-xl mb-8 max-w-lg mx-auto lg:mx-0">
                SKAAP turns your phone into a checkout. Shop at your pace, pay instantly, and walk out — no lines, ever.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.5 }}
              className="flex flex-wrap gap-3 justify-center lg:justify-start"
            >
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => navigate("/app")}
                className="bg-primary text-primary-foreground px-7 py-3.5 rounded-2xl font-bold text-base flex items-center gap-2 shadow-lg shadow-primary/25"
              >
                <Download size={18} /> Get the App
              </motion.button>
              <motion.a
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                href="#stores"
                className="border-2 border-secondary-foreground/20 text-secondary-foreground px-7 py-3.5 rounded-2xl font-bold text-base flex items-center gap-2 hover:border-secondary-foreground/40 transition-colors"
              >
                <Store size={18} /> I Own a Store
              </motion.a>
            </motion.div>

            {/* Social proof mini */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="mt-8 flex items-center gap-3 justify-center lg:justify-start"
            >
              <div className="flex -space-x-2">
                {["😊", "🛒", "⭐", "🎉"].map((emoji, i) => (
                  <div key={i} className="w-8 h-8 rounded-full bg-primary/10 border-2 border-background flex items-center justify-center text-sm">
                    {emoji}
                  </div>
                ))}
              </div>
              <p className="text-xs text-secondary-foreground/50">
                <span className="font-semibold text-secondary-foreground/80">2,400+</span> shoppers saving time daily
              </p>
            </motion.div>
          </div>

          {/* Hero phone */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, rotateY: 15 }}
            animate={{ opacity: 1, scale: 1, rotateY: 0 }}
            transition={{ delay: 0.2, duration: 0.8, type: "spring" }}
            className="flex-1 flex justify-center"
          >
            <img src={heroPhone} alt="SKAAP App" className="w-64 md:w-80 drop-shadow-2xl" />
          </motion.div>
        </div>

        {/* Scroll indicator */}
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="absolute bottom-6 left-1/2 -translate-x-1/2 text-secondary-foreground/30"
        >
          <ChevronDown size={24} />
        </motion.div>
      </motion.section>

      {/* ─── OUTCOME BAR ────────────────────────────── */}
      <section className="bg-primary py-10">
        <div className="max-w-6xl mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            { icon: Clock, stat: "19 min", desc: "Average time saved per shopping trip" },
            { icon: Smile, stat: "94%", desc: "Shoppers say they'd never go back to regular checkout" },
            { icon: TrendingUp, stat: "3x", desc: "Faster than self-checkout kiosks" },
          ].map((item, i) => (
            <FadeInSection key={i} delay={i * 0.1}>
              <div className="text-center flex flex-col items-center">
                <item.icon size={28} className="text-primary-foreground/80 mb-2" />
                <p className="text-3xl md:text-4xl font-black text-primary-foreground">{item.stat}</p>
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
              <h2 className="text-3xl md:text-5xl font-bold text-foreground mt-2">
                Your grocery trip, reimagined
              </h2>
              <p className="text-muted-foreground mt-3 max-w-xl mx-auto">
                No more waiting. No more conveyor belts. Just scan, pay, and go.
              </p>
            </div>
          </FadeInSection>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Interactive phone demo */}
            <FadeInSection delay={0.1}>
              <DemoPhone />
            </FadeInSection>

            {/* Benefits */}
            <div className="space-y-5">
              {[
                { icon: ScanLine, title: "Scan as you shop", desc: "Point your camera at any barcode. Items appear instantly — like a Snapchat filter for groceries." },
                { icon: CreditCard, title: "Pay from your pocket", desc: "Apple Pay, Google Pay, or card. Checkout happens in your hand, not at a counter." },
                { icon: QrCode, title: "Flash & walk out", desc: "Show your QR at the exit. No bagging, no waiting, no awkward self-checkout errors." },
                { icon: ShieldCheck, title: "Bank-level security", desc: "256-bit encryption. Your payment data is tokenized and never stored." },
              ].map((b, i) => (
                <FadeInSection key={i} delay={0.15 + i * 0.1}>
                  <motion.div
                    whileHover={{ x: 6 }}
                    className="flex gap-4 p-4 rounded-2xl hover:bg-muted/50 transition-colors cursor-default"
                  >
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

      {/* ─── TESTIMONIALS ────────────────────────────── */}
      <section className="py-16 bg-muted/50">
        <div className="max-w-6xl mx-auto px-6">
          <FadeInSection>
            <div className="text-center mb-10">
              <h2 className="text-3xl md:text-4xl font-bold text-foreground">Shoppers love it</h2>
              <p className="text-muted-foreground mt-2">Real feedback from real people</p>
            </div>
          </FadeInSection>
          <FadeInSection delay={0.1}>
            <div className="max-w-lg mx-auto">
              <TestimonialCarousel />
            </div>
          </FadeInSection>
        </div>
      </section>

      {/* ─── FIND A STORE ────────────────────────────── */}
      <section id="find-store" className="py-20 bg-background">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
            <FadeInSection>
              <div>
                <span className="text-primary text-sm font-semibold uppercase tracking-wider">Find a Store</span>
                <h2 className="text-3xl md:text-5xl font-bold text-foreground mt-2 mb-4">
                  SKAAP near you
                </h2>
                <p className="text-muted-foreground mb-6">
                  We're rolling out across the US. Find participating stores in your area or request SKAAP at your favorite store.
                </p>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <MapPin size={14} className="text-primary" />
                  <span>Currently live in <span className="font-semibold text-foreground">New York, Austin, San Jose</span> and expanding</span>
                </div>
              </div>
            </FadeInSection>
            <FadeInSection delay={0.15}>
              <StoreFinder />
            </FadeInSection>
          </div>
        </div>
      </section>

      {/* ─── FOR STORE OWNERS ────────────────────────── */}
      <section id="stores" className="bg-secondary py-20">
        <div className="max-w-6xl mx-auto px-6">
          <FadeInSection>
            <div className="text-center mb-14">
              <span className="text-primary text-sm font-semibold uppercase tracking-wider">For Retailers</span>
              <h2 className="text-3xl md:text-5xl font-bold text-secondary-foreground mt-2">
                Give your store a checkout upgrade
              </h2>
              <p className="text-secondary-foreground/50 mt-3 max-w-xl mx-auto">
                No hardware. No contracts. Just happier customers and faster throughput.
              </p>
            </div>
          </FadeInSection>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            {[
              { icon: Smartphone, title: "Zero hardware cost", desc: "Customers use their own phones. No POS terminals, no scanners, no installation." },
              { icon: Zap, title: "Live in 48 hours", desc: "Our team handles onboarding. Upload your inventory and you're ready to go." },
              { icon: TrendingUp, title: "0.9% per transaction", desc: "Pay only when customers use SKAAP. No monthly fees, cancel anytime." },
            ].map((card, i) => (
              <FadeInSection key={i} delay={i * 0.1}>
                <motion.div
                  whileHover={{ y: -4 }}
                  className="bg-secondary-foreground/5 border border-secondary-foreground/10 rounded-2xl p-6"
                >
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                    <card.icon size={22} className="text-primary" />
                  </div>
                  <h3 className="font-bold text-secondary-foreground mb-2">{card.title}</h3>
                  <p className="text-sm text-secondary-foreground/50">{card.desc}</p>
                </motion.div>
              </FadeInSection>
            ))}
          </div>

          {/* Retailer outcomes */}
          <FadeInSection delay={0.2}>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
              {[
                { stat: "32%", label: "Less checkout staffing needed" },
                { stat: "4.8★", label: "Average store rating boost" },
                { stat: "28%", label: "Increase in repeat visits" },
                { stat: "< 48h", label: "From signup to live" },
              ].map((s, i) => (
                <div key={i} className="text-center p-3">
                  <p className="text-2xl font-black text-primary">{s.stat}</p>
                  <p className="text-xs text-secondary-foreground/50 mt-1">{s.label}</p>
                </div>
              ))}
            </div>
          </FadeInSection>

          <FadeInSection delay={0.3}>
            <div className="text-center">
              <motion.a
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                href="#contact"
                className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-8 py-3.5 rounded-2xl font-bold shadow-lg shadow-primary/25"
              >
                Onboard Your Store <ArrowRight size={18} />
              </motion.a>
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
                  <button
                    onClick={() => setFaqOpen(faqOpen === i ? null : i)}
                    className="w-full flex items-center justify-between p-4 text-left"
                  >
                    <span className="font-semibold text-foreground text-sm">{faq.q}</span>
                    <motion.div animate={{ rotate: faqOpen === i ? 180 : 0 }}>
                      <ChevronDown size={18} className="text-muted-foreground" />
                    </motion.div>
                  </button>
                  <AnimatePresenceFAQ isOpen={faqOpen === i}>
                    <div className="px-4 pb-4">
                      <p className="text-sm text-muted-foreground">{faq.a}</p>
                    </div>
                  </AnimatePresenceFAQ>
                </motion.div>
              </FadeInSection>
            ))}
          </div>
        </div>
      </section>

      {/* ─── CONTACT + ZAPIER ────────────────────────── */}
      <section id="contact" className="bg-muted/50 py-16">
        <div className="max-w-xl mx-auto px-6 text-center">
          <FadeInSection>
            <h2 className="text-2xl font-bold text-foreground mb-3">Let's talk</h2>
            <p className="text-muted-foreground text-sm mb-6">
              Whether you're a shopper or a store owner — drop your email and we'll be in touch.
            </p>
          </FadeInSection>

          <FadeInSection delay={0.1}>
            {submitted ? (
              <motion.div
                initial={{ scale: 0.9 }}
                animate={{ scale: 1 }}
                className="bg-success/10 text-success rounded-2xl p-6 font-semibold"
              >
                ✅ Thanks! We'll reach out soon.
              </motion.div>
            ) : (
              <form onSubmit={handleEmailSubmit} className="space-y-3">
                <div className="flex gap-2">
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
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    type="submit"
                    className="bg-primary text-primary-foreground px-6 py-3 rounded-xl font-semibold text-sm"
                  >
                    Get in Touch
                  </motion.button>
                </div>
                {/* Zapier webhook config (hidden by default, shown on click) */}
                <details className="text-left">
                  <summary className="text-xs text-muted-foreground cursor-pointer hover:text-foreground">
                    Connect Zapier webhook (optional)
                  </summary>
                  <input
                    type="url"
                    value={webhookUrl}
                    onChange={(e) => setWebhookUrl(e.target.value)}
                    placeholder="https://hooks.zapier.com/hooks/catch/..."
                    className="w-full mt-2 bg-card border border-border rounded-xl py-2 px-3 text-xs outline-none focus:ring-2 focus:ring-primary/30"
                  />
                  <p className="text-[10px] text-muted-foreground mt-1">Leads, receipts & alerts sent to your Zap</p>
                </details>
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
              <a href="/app" className="hover:text-secondary-foreground transition-colors">Try Demo</a>
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

// ─── FAQ Animated Content ───────────────────────────────────
const AnimatePresenceFAQ = ({ isOpen, children }: { isOpen: boolean; children: React.ReactNode }) => {
  if (!isOpen) return null;
  return (
    <motion.div
      initial={{ height: 0, opacity: 0 }}
      animate={{ height: "auto", opacity: 1 }}
      exit={{ height: 0, opacity: 0 }}
      transition={{ duration: 0.2 }}
    >
      {children}
    </motion.div>
  );
};

export default Index;
