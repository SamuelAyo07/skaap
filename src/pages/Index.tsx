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
              <a href="https://www.instagram.com/useskaap?igsh=MWV5aDY5ZHJzam1keQ%3D%3D&utm_source=qr" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground transition-colors"><Instagram size={18} /></a>
              <a href="https://www.linkedin.com/company/skaaptech/" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground transition-colors"><Linkedin size={18} /></a>
            </div>
            <button onClick={() => navigate("/login")} className="text-sm text-muted-foreground hover:text-foreground transition-colors hidden md:block font-medium">Sign In</button>
            <motion.button whileTap={{ scale: 0.95 }} onClick={() => navigate("/app")} className="bg-foreground text-background px-5 py-2.5 rounded-full text-sm font-semibold hover:opacity-90 transition-opacity flex items-center gap-2">
              <Play size={12} fill="currentColor" /> Try Demo
            </motion.button>
          </div>
        </div>
      </nav>

      {/* ─── HERO ─── */}
      <section className="relative pt-32 pb-20 md:pt-44 md:pb-28 overflow-hidden bg-foreground">
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: "radial-gradient(circle at 1px 1px, hsl(0 0% 100%) 1px, transparent 0)", backgroundSize: "40px 40px" }} />
        <div className="relative max-w-5xl mx-auto px-6 text-center">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <span className="inline-flex items-center gap-1.5 bg-background/10 text-background/80 text-xs font-medium px-3.5 py-1.5 rounded-full mb-6 backdrop-blur-sm">
              <Sparkles size={12} /> Now launching on the East Coast 🇺🇸
            </span>
            <h1 className="text-5xl md:text-7xl lg:text-[5.5rem] font-black text-background leading-[0.92] tracking-tighter mb-6">
              Scan it.<br />Pay instantly.<br /><span className="text-gradient">Walk out.</span>
            </h1>
            <p className="text-background/50 text-lg md:text-xl mb-10 max-w-2xl mx-auto font-light leading-relaxed">
              Your phone becomes the checkout. No lines, no registers, no waiting.
            </p>
          </motion.div>

          {/* LOUD Demo CTA */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="flex flex-col items-center gap-4">
            <motion.button
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              onClick={() => navigate("/app")}
              className="bg-accent text-accent-foreground px-12 py-6 rounded-full font-black text-xl flex items-center gap-3 shadow-hero relative overflow-hidden group"
            >
              <motion.div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
              <Play size={20} fill="currentColor" /> Try the Demo
            </motion.button>
            <p className="text-background/25 text-xs">30 seconds · No account needed</p>
            <a href="#retailers" className="border border-background/20 text-background/70 px-7 py-3.5 rounded-full font-semibold text-sm flex items-center gap-2 hover:bg-background/5 transition-colors mt-1">
              <Store size={15} /> I Own a Store
            </a>
          </motion.div>
        </div>
        <motion.div animate={{ y: [0, 6, 0] }} transition={{ duration: 2, repeat: Infinity }} className="absolute bottom-8 left-1/2 -translate-x-1/2 text-background/20">
          <ChevronDown size={20} />
        </motion.div>
      </section>

      {/* ─── HOW IT WORKS ─── */}
      <section id="how-it-works" className="py-20 bg-background">
        <div className="max-w-5xl mx-auto px-6">
          <FadeIn>
            <div className="text-center mb-14">
              <span className="text-accent text-xs font-bold uppercase tracking-widest">How it Works</span>
              <h2 className="text-4xl md:text-5xl font-black text-foreground mt-3 tracking-tight">Three steps. That's it.</h2>
            </div>
          </FadeIn>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { step: "01", icon: ScanLine, title: "Scan products", desc: "Point your camera at any barcode. Items add to your bag instantly." },
              { step: "02", icon: CreditCard, title: "Pay in-app", desc: "Apple Pay, Google Pay, or card. One tap — no register needed." },
              { step: "03", icon: Receipt, title: "Show receipt & go", desc: "Flash your QR receipt at the exit. Walk out." },
            ].map((item, i) => (
              <FadeIn key={i} delay={i * 0.08}>
                <motion.div whileHover={{ y: -4 }} className="relative bg-muted/40 rounded-3xl p-8 text-center border border-border/50">
                  <span className="text-7xl font-black text-foreground/[0.04] absolute top-4 right-6 select-none">{item.step}</span>
                  <div className="w-14 h-14 rounded-2xl bg-foreground flex items-center justify-center mx-auto mb-5">
                    <item.icon size={24} className="text-background" />
                  </div>
                  <h3 className="font-bold text-xl text-foreground tracking-tight mb-2">{item.title}</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">{item.desc}</p>
                </motion.div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ─── SMART INFO ─── */}
      <section className="py-20 bg-muted/30">
        <div className="max-w-5xl mx-auto px-6">
          <FadeIn>
            <div className="text-center mb-12">
              <span className="text-accent text-xs font-bold uppercase tracking-widest">Smart Info</span>
              <h2 className="text-4xl md:text-5xl font-black text-foreground mt-3 tracking-tight">
                Know what you're buying.<br className="hidden md:block" /> Instantly.
              </h2>
              <p className="text-muted-foreground mt-4 max-w-2xl mx-auto leading-relaxed">
                Tap any scanned item for real-time nutrition data — Nutri-Score, ingredients, allergens, additives, and certifications. All powered by open data, right in the checkout flow.
              </p>
            </div>
          </FadeIn>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { emoji: "🅰️", title: "Nutri-Score", desc: "A-to-E nutritional quality rating at a glance — color-coded so you know in a second." },
              { emoji: "🧪", title: "Additives & Allergens", desc: "See every E-number with risk levels, plus allergens highlighted in bold." },
              { emoji: "📊", title: "Full Nutrition Facts", desc: "Calories, fats, sugars, protein, fiber — per 100g with color-coded levels." },
              { emoji: "🏷️", title: "Labels & Certifications", desc: "Organic, Vegan, Fair Trade, Non-GMO — see what's on the label without reading it." },
            ].map((card, i) => (
              <FadeIn key={i} delay={i * 0.06}>
                <motion.div whileHover={{ y: -3 }} className="bg-background border border-border/50 rounded-2xl p-6 h-full">
                  <span className="text-2xl mb-3 block">{card.emoji}</span>
                  <h3 className="font-bold text-foreground tracking-tight mb-1.5">{card.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{card.desc}</p>
                </motion.div>
              </FadeIn>
            ))}
          </div>

          <FadeIn delay={0.25}>
            <div className="text-center mt-10">
              <p className="text-xs text-muted-foreground">
                Nutritional data powered by Open Food Facts · 100% optional · never slows down checkout
              </p>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ─── FOR RETAILERS ─── */}
      <section id="retailers" className="bg-foreground py-20">
        <div className="max-w-5xl mx-auto px-6">
          <FadeIn>
            <div className="text-center mb-6">
              <span className="text-accent text-xs font-bold uppercase tracking-widest">For Retailers</span>
              <h2 className="text-4xl md:text-5xl font-black text-background mt-3 tracking-tight">
                Built for the stores<br className="hidden md:block" /> that built your neighborhood
              </h2>
            </div>
          </FadeIn>

          <FadeIn delay={0.1}>
            <div className="bg-background/5 border border-background/10 rounded-3xl p-8 mb-10 max-w-3xl mx-auto">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-2xl bg-accent flex items-center justify-center flex-shrink-0">
                  <Heart size={22} className="text-accent-foreground" />
                </div>
                <div>
                  <h3 className="font-bold text-xl text-background tracking-tight mb-2">Your store matters. We're here to prove it.</h3>
                  <p className="text-background/45 leading-relaxed text-sm">
                    The big chains have entire teams building for the future. You have grit and loyal customers. SKAAP levels the playing field — so your store doesn't just survive, it leads.
                  </p>
                </div>
              </div>
            </div>
          </FadeIn>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
            {[
              { icon: Smartphone, title: "Zero hardware", desc: "Customers use their own phones. No POS terminals." },
              { icon: Zap, title: "Live in 48 hours", desc: "Upload inventory, start accepting scan-to-pay in two days." },
              { icon: Users, title: "Happier customers", desc: "Faster trips, less friction, more repeat visits." },
            ].map((card, i) => (
              <FadeIn key={i} delay={0.1 + i * 0.06}>
                <motion.div whileHover={{ y: -3 }} className="bg-background/5 border border-background/10 rounded-2xl p-6">
                  <div className="w-11 h-11 rounded-xl bg-accent flex items-center justify-center mb-4">
                    <card.icon size={20} className="text-accent-foreground" />
                  </div>
                  <h3 className="font-bold text-background mb-1.5 tracking-tight">{card.title}</h3>
                  <p className="text-sm text-background/40 leading-relaxed">{card.desc}</p>
                </motion.div>
              </FadeIn>
            ))}
          </div>

          <FadeIn delay={0.2}>
            <div className="text-center space-y-3">
              <a href="#contact" className="inline-flex items-center gap-2.5 bg-accent text-accent-foreground px-8 py-4 rounded-full font-bold text-base shadow-hero hover:opacity-90 transition-opacity">
                Get Started — Free for 90 Days <ArrowRight size={16} />
              </a>
              <br />
              <motion.button whileTap={{ scale: 0.97 }} onClick={() => navigate("/dashboard")} className="inline-flex items-center gap-2 border border-background/20 text-background/60 px-6 py-3 rounded-full font-medium text-sm hover:text-background transition-colors">
                See Retailer Dashboard →
              </motion.button>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ─── FAQ ─── */}
      <section className="py-20 bg-background">
        <div className="max-w-2xl mx-auto px-6">
          <FadeIn><h2 className="text-3xl font-black text-foreground text-center mb-10 tracking-tight">Questions</h2></FadeIn>
          <div className="space-y-2">
            {faqs.map((faq, i) => (
              <FadeIn key={i} delay={i * 0.03}>
                <motion.div className="border border-border rounded-2xl overflow-hidden">
                  <button onClick={() => setFaqOpen(faqOpen === i ? null : i)} className="w-full flex items-center justify-between p-4 text-left">
                    <span className="font-semibold text-foreground text-sm">{faq.q}</span>
                    <motion.div animate={{ rotate: faqOpen === i ? 180 : 0 }} transition={{ duration: 0.2 }}><ChevronDown size={16} className="text-muted-foreground" /></motion.div>
                  </button>
                  {faqOpen === i && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} transition={{ duration: 0.2 }}>
                      <div className="px-4 pb-4"><p className="text-sm text-muted-foreground leading-relaxed">{faq.a}</p></div>
                    </motion.div>
                  )}
                </motion.div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ─── CONTACT ─── */}
      <section id="contact" className="bg-muted/30 py-16">
        <div className="max-w-xl mx-auto px-6 text-center">
          <FadeIn>
            <h2 className="text-3xl font-black text-foreground mb-3 tracking-tight">Let's talk</h2>
            <p className="text-muted-foreground text-sm mb-8">Shopper or store owner — drop your email.</p>
          </FadeIn>
          <FadeIn delay={0.1}>
            {submitted ? (
              <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} className="bg-success/10 text-success rounded-2xl p-6 font-semibold">✅ Thanks! We'll reach out soon.</motion.div>
            ) : (
              <form onSubmit={handleEmailSubmit} className="flex gap-2">
                <div className="relative flex-1">
                  <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="your@email.com" className="w-full bg-card border border-border rounded-full py-3.5 pl-11 pr-4 text-sm outline-none focus:ring-2 focus:ring-foreground/10 transition-shadow" />
                </div>
                <motion.button whileTap={{ scale: 0.95 }} type="submit" disabled={submitting} className="bg-foreground text-background px-6 py-3.5 rounded-full font-semibold text-sm disabled:opacity-60 hover:opacity-90 transition-opacity">
                  {submitting ? "Sending…" : "Get in Touch"}
                </motion.button>
              </form>
            )}
          </FadeIn>
        </div>
      </section>

      {/* ─── FOOTER ─── */}
      <footer className="bg-foreground py-10">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex flex-col items-center gap-6">
            <div className="flex items-center gap-2.5">
              <img src={skaapIcon} alt="SKAAP" className="w-8 h-8 rounded-lg" />
              <div>
                <span className="font-bold text-background tracking-tight">SKAAP</span>
                <p className="text-xs text-background/30">Your phone is the checkout.</p>
              </div>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-3 text-sm text-background/50 font-medium">
              <a href="#how-it-works" className="hover:text-background transition-colors">How it Works</a>
              <a href="#retailers" className="hover:text-background transition-colors">Retailers</a>
              <button onClick={() => navigate("/login")} className="hover:text-background transition-colors">Sign In</button>
              <a href="#contact" className="hover:text-background transition-colors">Contact</a>
            </div>
            <div className="flex items-center gap-5">
              <a href="https://www.instagram.com/useskaap?igsh=MWV5aDY5ZHJzam1keQ%3D%3D&utm_source=qr" target="_blank" rel="noopener noreferrer" className="text-background/50 hover:text-background transition-colors"><Instagram size={22} /></a>
              <a href="https://www.linkedin.com/company/skaaptech/" target="_blank" rel="noopener noreferrer" className="text-background/50 hover:text-background transition-colors"><Linkedin size={22} /></a>
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
