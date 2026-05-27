import { useEffect, useRef, useState, forwardRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { trackEvent } from "@/lib/analytics";
import { motion, useInView } from "framer-motion";
import { ScanLine, Instagram, Linkedin, Send, Eye, Clock, AlertTriangle, Check, ChevronDown, Beaker, FlaskConical, Wheat, Factory, Sparkles, Droplet, Quote, Star, Utensils, Download } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import skaapIcon from "@/assets/skaap-icon.png";
import productCrackers from "@/assets/product-crackers.png";
import productMacaroni from "@/assets/product-macaroni.png";
import productOj from "@/assets/product-oj.png";
import productMoisturizer from "@/assets/product-moisturizer.png";


const spring = { duration: 0.5, ease: [0.34, 1.56, 0.64, 1] as [number, number, number, number] };

const FadeIn = forwardRef<HTMLDivElement, { children: React.ReactNode; className?: string; delay?: number }>(
  ({ children, className = "", delay = 0 }, _r) => {
    const ref = useRef(null);
    const isInView = useInView(ref, { once: true, margin: "200px 0px 200px 0px" });
    return (
      <motion.div ref={ref} initial={{ opacity: 0, y: 8 }} animate={isInView ? { opacity: 1, y: 0 } : { opacity: 1, y: 0 }}
        transition={{ ...spring, delay }} className={className}>
        {children}
      </motion.div>
    );
  }
);
FadeIn.displayName = "FadeIn";

/* ─── Sticky bottom CTA (mobile), install SKAAP to Home Screen ─── */
const StickyScanCTA = ({ onScan: _onScan }: { onScan: () => void }) => {
  const [show, setShow] = useState(false);
  const [open, setOpen] = useState(false);

  const isIOS = typeof navigator !== "undefined" && /iPad|iPhone|iPod/.test(navigator.userAgent);

  useEffect(() => {
    const onScroll = () => setShow(window.scrollY > 480);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <>
      <motion.div
        initial={false}
        animate={{ y: show ? 0 : 96, opacity: show ? 1 : 0 }}
        transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 px-4 pb-[max(12px,env(safe-area-inset-bottom))] pt-3 pointer-events-none"
        style={{ background: "linear-gradient(to top, rgba(10,15,30,0.96) 60%, rgba(10,15,30,0))" }}
      >
        <button
          onClick={() => { trackEvent("cta_clicked", { cta: "sticky_install_cta" }); setOpen(true); }}
          className="pointer-events-auto w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl font-bold text-sm shadow-2xl"
          style={{
            background: "linear-gradient(135deg, #C41E3A, #a11830)",
            color: "#fff",
            boxShadow: "0 10px 30px -8px rgba(196,30,58,0.55)",
          }}
        >
          <Download size={16} /> Add SKAAP to Home Screen
        </button>
      </motion.div>

      {/* Install instructions sheet */}
      {open && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="md:hidden fixed inset-0 z-50 flex items-end justify-center"
          style={{ background: "rgba(10,15,30,0.6)", backdropFilter: "blur(6px)" }}
          onClick={() => setOpen(false)}
        >
          <motion.div
            initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className="w-full rounded-t-3xl p-5 pb-[max(20px,env(safe-area-inset-bottom))] bg-white"
            onClick={e => e.stopPropagation()}
          >
            <div className="mx-auto w-10 h-1 rounded-full mb-4" style={{ background: "#E5E7EB" }} />
            <h3 className="text-lg font-extrabold tracking-tight" style={{ color: "#0A1220" }}>
              Install SKAAP in 5 seconds
            </h3>
            <p className="text-xs mb-4" style={{ color: "#6B7280" }}>
              Works just like an app. No store. No download.
            </p>

            {isIOS ? (
              <ol className="space-y-2 text-sm" style={{ color: "#0A1220" }}>
                <li><span className="font-bold">1.</span> Tap the <span className="font-bold">Share</span> button at the bottom of Safari.</li>
                <li><span className="font-bold">2.</span> Scroll and tap <span className="font-bold">Add to Home Screen</span>.</li>
                <li><span className="font-bold">3.</span> Tap <span className="font-bold">Add</span>. Done.</li>
              </ol>
            ) : (
              <ol className="space-y-2 text-sm" style={{ color: "#0A1220" }}>
                <li><span className="font-bold">1.</span> Tap the <span className="font-bold">⋮ menu</span> in Chrome.</li>
                <li><span className="font-bold">2.</span> Tap <span className="font-bold">Add to Home Screen</span> (or "Install app").</li>
                <li><span className="font-bold">3.</span> Tap <span className="font-bold">Install</span>. Done.</li>
              </ol>
            )}

            <button
              onClick={() => setOpen(false)}
              className="w-full mt-5 py-3 rounded-xl font-bold text-sm text-white"
              style={{ background: "#0A1220" }}
            >
              Got it
            </button>
          </motion.div>
        </motion.div>
      )}
    </>
  );
};

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
        aspectRatio: "9 / 12",
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


interface BIPEvent extends Event { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }>; }

const Index = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [contact, setContact] = useState({ name: "", email: "", message: "", type: "general" });
  const [sending, setSending] = useState(false);
  const [streak, setStreak] = useState<number>(() => Number(localStorage.getItem("skaap_scan_count") || 0));
  const [device, setDevice] = useState<"ios" | "android" | "desktop">("desktop");
  const [installed, setInstalled] = useState(false);
  const [showIosTip, setShowIosTip] = useState(false);
  const deferredRef = useRef<BIPEvent | null>(null);

  useEffect(() => {
    trackEvent("page_view", { page: "landing", utm_source: searchParams.get("utm_source") }, "/");

    // Detect device
    const ua = navigator.userAgent;
    const isIOS = /iPad|iPhone|iPod/.test(ua) && !(window as unknown as { MSStream?: unknown }).MSStream;
    const isAndroid = /Android/.test(ua);
    setDevice(isIOS ? "ios" : isAndroid ? "android" : "desktop");
    setInstalled(window.matchMedia("(display-mode: standalone)").matches);

    // Capture install prompt for Android/Chrome
    const onBIP = (e: Event) => {
      e.preventDefault();
      deferredRef.current = e as BIPEvent;
    };
    window.addEventListener("beforeinstallprompt", onBIP);
    return () => window.removeEventListener("beforeinstallprompt", onBIP);
  }, []);

  const handleStartScan = () => {
    trackEvent("cta_clicked", { cta: "hero_start_scanning" });
    // Increment local streak so the teaser feels alive
    const next = streak + 1;
    localStorage.setItem("skaap_scan_count", String(next));
    setStreak(next);
    navigate("/scan");
  };

  const handleInstall = async () => {
    trackEvent("cta_clicked", { cta: "install_pwa", device });
    if (device === "ios") {
      setShowIosTip(true);
      return;
    }
    if (deferredRef.current) {
      await deferredRef.current.prompt();
      const choice = await deferredRef.current.userChoice;
      if (choice.outcome === "accepted") setInstalled(true);
      deferredRef.current = null;
    } else {
      // Android with no prompt available, or desktop, show toast
      toast.info(device === "android" ? "Open this page in Chrome, then tap menu (⋮) → Install app." : "Open useskaap.com on your phone to install.");
    }
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

      {/* ─── 2. HERO, urgency framing ─── */}
      <section
        className="relative flex items-center justify-center"
        style={{ minHeight: "auto", paddingTop: 64, paddingBottom: 12, background: "radial-gradient(ellipse at 50% 30%, #1a1f3a 0%, #0A0F1E 70%)" }}
      >
        <div className="absolute top-16 right-8 w-48 h-48 rounded-full pointer-events-none" style={{ background: "rgba(196,30,58,0.10)", filter: "blur(70px)" }} />

        <div className="w-full max-w-[680px] mx-auto px-4 text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
            className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest mb-2"
            style={{ background: "rgba(196,30,58,0.15)", color: "#FCA5A5", border: "1px solid rgba(196,30,58,0.25)" }}
          >
            <AlertTriangle size={11} /> Your body deserves to know
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ ...spring, delay: 0.1 }}
            className="font-extrabold tracking-tighter leading-[1.02] text-white"
            style={{ fontSize: "clamp(36px, 8vw, 60px)" }}
          >
            Know what goes<br />
            <span className="text-gradient">in and on your body.</span>
          </motion.h1>

          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.25 }}
            className="mt-2.5 text-[13px] max-w-sm mx-auto" style={{ color: "rgba(255,255,255,0.78)" }}>
            Scan any food or beauty barcode. See what's really inside, in 2 seconds.
          </motion.p>

          <motion.button
            initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
            whileTap={{ scale: 0.97 }}
            onClick={handleStartScan}
            className="mt-4 inline-flex items-center justify-center gap-2 px-6 py-3 rounded-2xl font-bold text-sm cta-pulse"
            style={{ background: "linear-gradient(135deg, #C41E3A, #a11830)", color: "#fff" }}
          >
            <ScanLine size={16} /> Scan a barcode for free
          </motion.button>

          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.55 }}
            className="mt-2 text-[11px]" style={{ color: "rgba(255,255,255,0.45)" }}>
            Works on any product, anywhere · No signup · No app store
          </motion.p>
        </div>
      </section>

      {/* ─── 3. HOW IT WORKS, 3 mockups with REAL product images ─── */}
      <section className="py-4" style={{ background: "#0A0F1E" }}>
        <div className="max-w-5xl mx-auto px-4">
          <FadeIn>
            <h2 className="text-center text-xl md:text-2xl font-extrabold tracking-tight text-white mb-1">
              See it in action
            </h2>
            <p className="text-center text-xs mb-4" style={{ color: "rgba(255,255,255,0.45)" }}>
              Scan → Score → Decide.
            </p>
          </FadeIn>

          <div className="grid grid-cols-3 gap-2 md:gap-4 max-w-2xl mx-auto items-end">
            <FadeIn delay={0.05}>
              <PhoneMockup
                productImage={productCrackers}
                productLabel="Snack Crackers"
                signals={[
                  { dot: "#C41E3A", text: "Sodium: 600mg" },
                  { dot: "#F59E0B", text: "6 additives" },
                  { dot: "#F59E0B", text: "NOVA 4" },
                ]}
                verdict="Poor"
                score="21"
                scoreColor="#C41E3A"
              />
            </FadeIn>
            <FadeIn delay={0.15}>
              <PhoneMockup
                productImage={productMacaroni}
                productLabel="Mac & Cheese Box"
                signals={[
                  { dot: "#C41E3A", text: "Sodium: 720mg" },
                  { dot: "#C41E3A", text: "7 additives" },
                  { dot: "#F59E0B", text: "Fiber: 1g" },
                ]}
                verdict="Poor"
                score="14"
                scoreColor="#C41E3A"
              />
            </FadeIn>
            <FadeIn delay={0.25}>
              <PhoneMockup
                productImage={productMoisturizer}
                productLabel="Daily Moisturizer"
                signals={[
                  { dot: "#F59E0B", text: "Fragrance listed" },
                  { dot: "#C41E3A", text: "2 hormone disruptors" },
                  { dot: "#22C55E", text: "Hyaluronic acid" },
                ]}
                verdict="Fair"
                score="54"
                scoreColor="#F59E0B"
              />
            </FadeIn>

          </div>
        </div>
      </section>

      {/* (section merged into Food & Beauty translated below) */}

      {/* ─── 6. WHAT'S INSIDE, informational, no judgment ─── */}
      <section className="py-4" style={{ background: "#FBF6E9" }}>
        <div className="max-w-3xl mx-auto px-5">
          <FadeIn>
            <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full mb-3" style={{ background: "rgba(196,30,58,0.1)", color: "#C41E3A" }}>
              <Eye size={12} /> What's actually inside
            </span>
            <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight mb-2" style={{ color: "#0A1220" }}>
              Every label, finally readable.
            </h2>
            <p className="text-sm leading-relaxed" style={{ color: "#374151" }}>
              Food and beauty labels are packed with chemical names, codes, and fine print written for regulators, not for you. SKAAP unpacks every ingredient: what it actually is, what it does in your body or on your skin, whether it's been linked to health issues, and whether it's banned in other countries. No PhD required. No guessing in the aisle.
            </p>
            <p className="text-sm leading-relaxed mt-3 font-semibold" style={{ color: "#0A1220" }}>
              We don't tell you what to think. We just show you what's inside. You decide.
            </p>
          </FadeIn>

          {/* What we show you */}
          <FadeIn delay={0.1}>
            <div className="bg-white rounded-2xl p-4 mt-5" style={{ border: "1px solid rgba(10,18,32,0.06)" }}>
              <p className="text-[11px] font-bold uppercase tracking-widest mb-3" style={{ color: "#6B7280" }}>What we show you</p>
              <div className="grid grid-cols-2 gap-x-3 gap-y-2">
                {[
                  { icon: Beaker, label: "Sugar, added and hidden" },
                  { icon: FlaskConical, label: "Additives and where they're banned" },
                  { icon: Wheat, label: "Allergens" },
                  { icon: Factory, label: "Processing level (NOVA)" },
                  { icon: Droplet, label: "Skincare ingredients" },
                  { icon: AlertTriangle, label: "Hormone-disrupting chemicals" },
                ].map((item, i) => {
                  const Icon = item.icon;
                  return (
                    <div key={i} className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0" style={{ background: "rgba(34,197,94,0.12)" }}>
                        <Check size={12} color="#22C55E" strokeWidth={3} />
                      </span>
                      <Icon size={12} color="#6B7280" />
                      <span className="text-[12px] font-semibold" style={{ color: "#0A1220" }}>{item.label}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </FadeIn>
        </div>
      </section>



      {/* ─── 6b. FOOD vs BEAUTY, two-rail explainer with example cards ─── */}
      <section className="py-4" style={{ background: "#FFFFFF" }}>
        <div className="max-w-5xl mx-auto px-5">
          <FadeIn>
            <div className="text-center mb-5">
              <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight" style={{ color: "#0A1220" }}>
                Food <em className="not-italic" style={{ color: "#C41E3A" }}>and</em> beauty, finally translated.
              </h2>
            </div>
          </FadeIn>


          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* FOOD */}
            <FadeIn delay={0.05}>
              <div className="rounded-2xl p-5 h-full" style={{ background: "linear-gradient(180deg,#FBF6E9, #FFFFFF)", border: "1px solid #E5E7EB" }}>
                <div className="flex items-center gap-2 mb-3">
                  <span className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: "rgba(196,30,58,0.1)" }}>
                    <Utensils size={15} color="#C41E3A" />
                  </span>
                  <h3 className="font-extrabold text-base" style={{ color: "#0A1220" }}>Food</h3>
                  <span className="ml-auto text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: "#0A1220", color: "#fff" }}>4M+ products</span>
                </div>

                <div className="rounded-xl p-3 mb-3 flex items-center gap-3" style={{ background: "#fff", border: "1px solid #F1F2F4" }}>
                  <img src={productCrackers} alt="Snack crackers" className="w-12 h-12 object-contain" loading="lazy" />
                  <div className="flex-1 min-w-0">
                    <p className="text-[12px] font-bold leading-tight" style={{ color: "#0A1220" }}>Snack Crackers</p>
                    <p className="text-[10.5px]" style={{ color: "#6B7280" }}>Ultra-processed · 6 additives</p>
                  </div>
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-[12px] font-extrabold text-white" style={{ background: "#C41E3A" }}>21</div>
                </div>

                <p className="text-[10.5px] font-bold uppercase tracking-wider mb-1.5" style={{ color: "#6B7280" }}>What's inside</p>
                <div className="grid grid-cols-2 gap-1.5">
                  {["Hidden sugar","Banned additives","Ultra-processing","Sodium bombs","Seed oils","Allergens"].map(t => (
                    <div key={t} className="flex items-center gap-1.5 text-[11.5px]" style={{ color: "#374151" }}>
                      <span className="w-1.5 h-1.5 rounded-full" style={{ background: "#C41E3A" }} /> {t}
                    </div>
                  ))}
                </div>
              </div>
            </FadeIn>

            {/* BEAUTY */}
            <FadeIn delay={0.12}>
              <div className="rounded-2xl p-5 h-full" style={{ background: "linear-gradient(180deg,#FCE9EE, #FFFFFF)", border: "1px solid #F3D5DE" }}>
                <div className="flex items-center gap-2 mb-3">
                  <span className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: "rgba(196,30,58,0.12)" }}>
                    <Droplet size={15} color="#C41E3A" />
                  </span>
                  <h3 className="font-extrabold text-base" style={{ color: "#0A1220" }}>Beauty &amp; Skincare</h3>
                  <span className="ml-auto text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: "#C41E3A", color: "#fff" }}>New</span>
                </div>

                <div className="rounded-xl p-3 mb-3 flex items-center gap-3" style={{ background: "#fff", border: "1px solid #F3D5DE" }}>
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl" style={{ background: "#FBF6E9" }}>🧴</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[12px] font-bold leading-tight" style={{ color: "#0A1220" }}>Daily Moisturizer</p>
                    <p className="text-[10.5px]" style={{ color: "#6B7280" }}>2 hormone disruptors · Fragrance</p>
                  </div>
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-[12px] font-extrabold text-white" style={{ background: "#F59E0B" }}>54</div>
                </div>

                <p className="text-[10.5px] font-bold uppercase tracking-wider mb-1.5" style={{ color: "#6B7280" }}>What's inside</p>
                <div className="grid grid-cols-2 gap-1.5">
                  {["Hormone disruptors","Parabens","Synthetic fragrance","Sulfates","Allergens","Comedogenic oils"].map(t => (
                    <div key={t} className="flex items-center gap-1.5 text-[11.5px]" style={{ color: "#374151" }}>
                      <span className="w-1.5 h-1.5 rounded-full" style={{ background: "#C41E3A" }} /> {t}
                    </div>
                  ))}
                </div>
              </div>
            </FadeIn>
          </div>

        </div>
      </section>

      {/* ─── 6c. TESTIMONIALS, short, kind, human ─── */}
      <section className="py-4" style={{ background: "#F9FAFB" }}>
        <div className="max-w-4xl mx-auto px-5">
          <FadeIn>
            <div className="text-center mb-6">
              <div className="inline-flex items-center gap-1 mb-2" style={{ color: "#F59E0B" }}>
                {[0,1,2,3,4].map(i => <Star key={i} size={14} fill="#F59E0B" stroke="#F59E0B" />)}
              </div>
              <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight" style={{ color: "#0A1220" }}>
                Real changes.
              </h2>

            </div>
          </FadeIn>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {[
              { q: "I scanned a popular biscuit my kids eat almost every day and saw it had three additives banned in Europe. I switched the brand the same afternoon. My grocery runs feel completely different now because I actually know what I am buying.", n: "Adaeze O.", r: "Mom of 3 · Lagos, Nigeria" },
              { q: "I used to spend twenty minutes Googling ingredients in the aisle and still leave confused. Now I scan, read the breakdown, and decide in seconds. My pantry got cleaner in a month without me trying to be perfect about it.", n: "Maya R.", r: "Home cook · Austin, TX" },
              { q: "I had been blaming my breakouts on stress for months. SKAAP showed me my moisturizer had two ingredients flagged for sensitive skin. I swapped products and my skin calmed down in three weeks. I am never buying skincare blind again.", n: "Jordan K.", r: "Sensitive skin · New York" },
            ].map((t, i) => (

              <FadeIn key={i} delay={i * 0.06}>
                <div className="bg-white rounded-2xl p-4 h-full flex flex-col" style={{ border: "1px solid #E5E7EB" }}>
                  <Quote size={16} style={{ color: "#C41E3A" }} className="mb-2" />
                  <p className="text-[13px] leading-snug flex-1" style={{ color: "#0A1220" }}>"{t.q}"</p>
                  <div className="mt-3 pt-3" style={{ borderTop: "1px solid #F1F2F4" }}>
                    <p className="text-[12px] font-bold" style={{ color: "#0A1220" }}>{t.n}</p>
                    <p className="text-[10.5px]" style={{ color: "#6B7280" }}>{t.r}</p>
                  </div>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ─── 8. RETAIL, frictionless self-checkout teaser ─── */}
      <section className="py-4" style={{ background: "#0A0F1E" }}>
        <div className="max-w-3xl mx-auto px-5 text-center">
          <FadeIn>
            <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full mb-3" style={{ background: "rgba(196,30,58,0.18)", color: "#fff" }}>
              <Clock size={12} /> Coming soon
            </span>
            <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white">
              Frictionless retail self-checkout.
            </h2>
            <p className="text-xs mt-2 max-w-md mx-auto" style={{ color: "rgba(255,255,255,0.55)" }}>
              Scan as you shop, pay from your phone, walk out. In the works.
            </p>
          </FadeIn>
        </div>
      </section>

      {/* ─── 9. FAQs ─── */}
      <section className="py-4" style={{ background: "#F9FAFB" }}>
        <div className="max-w-2xl mx-auto px-5">
          <FadeIn>
            <div className="text-center mb-4">
              <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight" style={{ color: "#0A1220" }}>
                Questions? We've got answers.
              </h2>
            </div>
          </FadeIn>
          <div className="space-y-2">
            {[
              { q: "Does SKAAP work on any product, anywhere in the world?", a: "Yes. SKAAP works on any barcode on the planet. Whether you are shopping in Lagos, London, New York, Tokyo, or anywhere else, point the camera at the barcode and we pull the ingredients. Works on food, drinks, snacks, skincare, makeup and household products." },
              { q: "Is SKAAP free?", a: "Yes. Scanning, scores, and ingredient breakdowns are free forever. SKAAP Plus is pay-what-you-want, starting at $2.99 a month or a one-time yearly contribution, and unlocks weekly habit reports, custom alerts, and product search." },
              { q: "How is the SKAAP Score calculated?", a: "0 to 100 scale: 60% nutrition (Nutri-Score), 30% additives (with bans flagged), and 10% organic and processing. Same product, same score, anywhere." },
              { q: "Where does the data come from?", a: "Open Food Facts, USDA FoodData Central, and our own additive database, cross-checked with FDA and EFSA bans. AI translates the science so anyone can understand it." },
              { q: "Do you sell my data or run ads?", a: "Never. No ads. No third-party tracking. Your scans are private to your account." },
              { q: "Does it work without signup?", a: "Yes. Scan as a guest. Sign up only if you want to save scans, set alerts, or see your weekly grocery score." },
              { q: "Can I install it on my phone?", a: "Yes. Open useskaap.com on your phone, then 'Add to Home Screen' (iOS Share menu) or tap 'Install' (Android Chrome). It works like a native app." },

            ].map((f, i) => (
              <FadeIn key={i} delay={i * 0.03}>
                <FAQItem q={f.q} a={f.a} />
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ─── 10. CONTACT, single simple bar ─── */}
      <section className="py-4" style={{ background: "#FBF6E9" }}>
        <div className="max-w-xl mx-auto px-5">
          <FadeIn>
            <div className="text-center mb-3">
              <h2 className="text-xl md:text-2xl font-extrabold tracking-tight" style={{ color: "#0A1220" }}>
                Contact us
              </h2>
              <p className="text-xs mt-1" style={{ color: "#6B7280" }}>
                Any message lands straight in our inbox.
              </p>
            </div>
          </FadeIn>

          <FadeIn delay={0.1}>
            <form onSubmit={handleContactSubmit} className="bg-white rounded-2xl p-3 flex flex-col sm:flex-row gap-2" style={{ border: "1px solid #E5E7EB" }}>
              <input
                type="email" required placeholder="Your email" value={contact.email}
                onChange={e => setContact({ ...contact, email: e.target.value })}
                className="flex-1 px-3 py-2.5 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#C41E3A]/30"
                style={{ background: "#F9FAFB", border: "1px solid #E5E7EB" }}
                maxLength={255}
              />
              <input
                type="text" required placeholder="Your message" value={contact.message}
                onChange={e => setContact({ ...contact, message: e.target.value })}
                className="flex-[2] px-3 py-2.5 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#C41E3A]/30"
                style={{ background: "#F9FAFB", border: "1px solid #E5E7EB" }}
                maxLength={1000}
              />
              <button
                type="submit" disabled={sending}
                className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg font-bold text-sm disabled:opacity-60 whitespace-nowrap"
                style={{ background: "#0A1220", color: "#fff" }}
              >
                <Send size={14} /> {sending ? "Sending..." : "Send"}
              </button>
            </form>
          </FadeIn>
        </div>
      </section>


      {/* ─── 11. FOOTER ─── */}
      <footer className="py-6" style={{ background: "#0A0F1E", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
        <div className="max-w-6xl mx-auto px-5 flex flex-col items-center gap-3">
          <div className="flex items-center gap-2.5">
            <img src={skaapIcon} alt="SKAAP" className="w-6 h-6 rounded-md" width="24" height="24" />
            <span className="font-bold text-white tracking-tight text-sm">SKAAP</span>
          </div>
          <div className="flex items-center gap-4">
            <a href="https://www.instagram.com/useskaap" target="_blank" rel="noopener noreferrer" aria-label="Instagram" style={{ color: "rgba(255,255,255,0.4)" }}><Instagram size={16} /></a>
            <a href="https://www.linkedin.com/company/skaaptech/" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn" style={{ color: "rgba(255,255,255,0.4)" }}><Linkedin size={16} /></a>
          </div>
          <p className="text-[10px]" style={{ color: "rgba(255,255,255,0.18)" }}>© 2026 SKAAP Technologies Inc.</p>
        </div>
      </footer>

    </div>
  );
};

export default Index;
