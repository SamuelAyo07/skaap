import { useNavigate } from "react-router-dom";
import { Download, Store, ScanLine, CreditCard, QrCode, ChevronRight, Mail } from "lucide-react";
import skaapIcon from "@/assets/skaap-icon.png";
import heroPhone from "@/assets/hero-phone-mockup.png";
import { useState } from "react";

const Index = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) setSubmitted(true);
  };

  return (
    <div className="min-h-screen bg-background font-sans">
      {/* Nav */}
      <nav className="fixed top-0 w-full z-50 bg-secondary/95 backdrop-blur-md border-b border-secondary">
        <div className="max-w-6xl mx-auto flex items-center justify-between px-6 py-3">
          <div className="flex items-center gap-2">
            <img src={skaapIcon} alt="SKAAP" className="w-8 h-8 rounded-lg" />
            <span className="font-bold text-lg text-secondary-foreground">SKAAP</span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm text-secondary-foreground/80">
            <a href="#how-it-works" className="hover:text-secondary-foreground transition-colors">How It Works</a>
            <a href="#stores" className="hover:text-secondary-foreground transition-colors">For Stores</a>
            <a href="#contact" className="hover:text-secondary-foreground transition-colors">Contact</a>
          </div>
          <button
            onClick={() => navigate("/app")}
            className="bg-primary text-primary-foreground px-4 py-2 rounded-xl text-sm font-semibold hover:opacity-90 transition-opacity"
          >
            Try Demo
          </button>
        </div>
      </nav>

      {/* HERO */}
      <section className="bg-secondary pt-28 pb-16 md:pt-36 md:pb-24">
        <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row items-center gap-10">
          <div className="flex-1">
            <h1 className="text-4xl md:text-6xl font-black text-secondary-foreground leading-tight mb-5">
              Scan it.<br />
              Skip the line.<br />
              <span className="text-gradient">Escape the wait.</span>
            </h1>
            <p className="text-secondary-foreground/70 text-lg mb-8 max-w-lg">
              SKAAP turns your smartphone into a virtual checkout — no queues, no kiosks, no hassle.
            </p>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => navigate("/app")}
                className="bg-primary text-primary-foreground px-7 py-3.5 rounded-2xl font-bold text-base flex items-center gap-2 hover:opacity-90 transition-opacity"
              >
                <Download size={18} /> Download the App
              </button>
              <a
                href="#stores"
                className="border-2 border-secondary-foreground/30 text-secondary-foreground px-7 py-3.5 rounded-2xl font-bold text-base flex items-center gap-2 hover:border-secondary-foreground/60 transition-colors"
              >
                <Store size={18} /> For Store Owners
              </a>
            </div>
          </div>
          <div className="flex-1 flex justify-center">
            <img src={heroPhone} alt="SKAAP App" className="w-72 md:w-80 drop-shadow-2xl" />
          </div>
        </div>
      </section>

      {/* STAT BAR */}
      <section className="bg-primary py-8">
        <div className="max-w-6xl mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
          {[
            { stat: "$284B", desc: "lost to checkout friction" },
            { stat: "40B hrs", desc: "wasted in lines yearly" },
            { stat: "82%", desc: "of shoppers avoid long queues" },
          ].map((item) => (
            <div key={item.stat}>
              <p className="text-3xl font-black text-primary-foreground">{item.stat}</p>
              <p className="text-primary-foreground/80 text-sm">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how-it-works" className="py-20 bg-background">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground text-center mb-12">
            Shopping in 4 steps
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: Download, step: "1", title: "Download SKAAP", desc: "Get the free app on iOS or Android" },
              { icon: ScanLine, step: "2", title: "Scan items", desc: "Use your camera to scan barcodes as you shop" },
              { icon: CreditCard, step: "3", title: "Pay in-app", desc: "Checkout securely with Apple Pay, card, or Google Pay" },
              { icon: QrCode, step: "4", title: "Show QR & go", desc: "Flash your QR code at the exit and walk out" },
            ].map((s) => {
              const Icon = s.icon;
              return (
                <div key={s.step} className="bg-card rounded-2xl p-6 shadow-card text-center">
                  <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center mx-auto mb-4 text-lg font-bold">
                    {s.step}
                  </div>
                  <Icon size={28} className="mx-auto mb-3 text-primary" />
                  <h3 className="font-bold text-foreground mb-1">{s.title}</h3>
                  <p className="text-sm text-muted-foreground">{s.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* FOR STORE OWNERS */}
      <section id="stores" className="bg-secondary py-20">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-3xl md:text-4xl font-bold text-secondary-foreground text-center mb-4">
            Give your store a competitive edge
          </h2>
          <p className="text-secondary-foreground/60 text-center mb-12 max-w-2xl mx-auto">
            No heavy hardware. No long integrations. Just a better checkout.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
            {[
              { title: "No Hardware Needed", desc: "Customers use their own phones. Zero POS investment." },
              { title: "Live in 48 Hours", desc: "Onboard your store in two days with our guided setup." },
              { title: "0.9% per transaction", desc: "Pay only when it works. No monthly fees, no contracts." },
            ].map((c) => (
              <div key={c.title} className="bg-secondary-foreground/5 border border-secondary-foreground/10 rounded-2xl p-6">
                <h3 className="font-bold text-secondary-foreground mb-2">{c.title}</h3>
                <p className="text-sm text-secondary-foreground/60">{c.desc}</p>
              </div>
            ))}
          </div>
          <div className="text-center">
            <a
              href="#contact"
              className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-8 py-3.5 rounded-2xl font-bold hover:opacity-90 transition-opacity"
            >
              Onboard Your Store <ChevronRight size={18} />
            </a>
          </div>
        </div>
      </section>

      {/* SOCIAL PROOF */}
      <section className="py-20 bg-background">
        <div className="max-w-6xl mx-auto px-6 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-10">Built on real research</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
            {[
              { num: "100+", label: "Shopper Interviews" },
              { num: "50+", label: "Retailer Conversations" },
              { num: "3", label: "Pilot Stores Onboarded" },
            ].map((s) => (
              <div key={s.label}>
                <p className="text-4xl font-black text-primary">{s.num}</p>
                <p className="text-muted-foreground text-sm">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CONTACT */}
      <section id="contact" className="bg-muted py-16">
        <div className="max-w-xl mx-auto px-6 text-center">
          <h2 className="text-2xl font-bold text-foreground mb-3">Interested? Let's talk.</h2>
          <p className="text-muted-foreground text-sm mb-6">
            Drop your email and we'll reach out to discuss how SKAAP can work for your store.
          </p>
          {submitted ? (
            <div className="bg-success/10 text-success rounded-2xl p-6 font-semibold">
              Thanks! We'll be in touch soon.
            </div>
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
              <button
                type="submit"
                className="bg-primary text-primary-foreground px-6 py-3 rounded-xl font-semibold text-sm hover:opacity-90 transition-opacity"
              >
                Get in Touch
              </button>
            </form>
          )}
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-secondary py-10">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2">
              <img src={skaapIcon} alt="SKAAP" className="w-8 h-8 rounded-lg" />
              <div>
                <span className="font-bold text-secondary-foreground">SKAAP</span>
                <p className="text-xs text-secondary-foreground/50">Turning your smartphone into a virtual checkout.</p>
              </div>
            </div>
            <div className="flex gap-6 text-sm text-secondary-foreground/60">
              <a href="#" className="hover:text-secondary-foreground transition-colors">About</a>
              <a href="#stores" className="hover:text-secondary-foreground transition-colors">For Stores</a>
              <a href="/app" className="hover:text-secondary-foreground transition-colors">Try App</a>
              <a href="#contact" className="hover:text-secondary-foreground transition-colors">Contact</a>
            </div>
          </div>
          <div className="border-t border-secondary-foreground/10 mt-6 pt-6 text-center">
            <p className="text-xs text-secondary-foreground/40">© 2026 SKAAP Technologies Inc.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
