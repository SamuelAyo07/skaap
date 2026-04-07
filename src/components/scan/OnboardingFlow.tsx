import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Barcode, Sparkles, ShieldCheck, ArrowRight, Zap } from "lucide-react";
import { hapticLight, hapticSuccess } from "@/lib/haptics";
import skaapIcon from "@/assets/skaap-icon.png";

const ONBOARDING_KEY = "skaap_onboarding_done";

export function hasSeenOnboarding(): boolean {
  try { return localStorage.getItem(ONBOARDING_KEY) === "1"; } catch { return false; }
}

export function markOnboardingDone() {
  try { localStorage.setItem(ONBOARDING_KEY, "1"); } catch {}
}

interface Step {
  icon: React.ReactNode;
  emoji: string;
  title: string;
  subtitle: string;
  color: string;
}

const steps: Step[] = [
  {
    icon: <Barcode size={36} strokeWidth={2} />,
    emoji: "📸",
    title: "Scan any product",
    subtitle: "Point your camera at a barcode or take a photo — we'll identify it instantly.",
    color: "#1B2A4A",
  },
  {
    icon: <Sparkles size={36} strokeWidth={2} />,
    emoji: "🧪",
    title: "Get your SKAAP Score",
    subtitle: "A 0-100 health score based on nutrition, additives & processing. Higher = healthier!",
    color: "#C41E3A",
  },
  {
    icon: <ShieldCheck size={36} strokeWidth={2} />,
    emoji: "🛡️",
    title: "AI flags the bad stuff",
    subtitle: "Our AI analyzes ingredients, flags harmful additives, and suggests healthier swaps.",
    color: "#2D7D46",
  },
  {
    icon: <Zap size={36} strokeWidth={2} />,
    emoji: "⚡",
    title: "Shop smarter every time",
    subtitle: "Build your kitchen score, track streaks, and share with friends. Let's go!",
    color: "#FF6D00",
  },
];

interface OnboardingFlowProps {
  onComplete: () => void;
}

export function OnboardingFlow({ onComplete }: OnboardingFlowProps) {
  const [step, setStep] = useState(0);
  const isLast = step === steps.length - 1;
  const current = steps[step];

  const next = () => {
    hapticLight();
    if (isLast) {
      hapticSuccess();
      markOnboardingDone();
      onComplete();
    } else {
      setStep(s => s + 1);
    }
  };

  const skip = () => {
    hapticLight();
    markOnboardingDone();
    onComplete();
  };

  return (
    <div className="fixed inset-0 z-[200] flex flex-col items-center justify-between"
      style={{ background: "#FFFFFF", maxWidth: 430, margin: "0 auto" }}>
      
      {/* Skip */}
      <div className="w-full flex justify-end px-5 pt-[env(safe-area-inset-top,12px)] mt-2">
        <button onClick={skip} className="text-[13px] font-medium px-3 py-1.5 rounded-full"
          style={{ color: "#9CA3AF" }}>
          Skip
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col items-center justify-center px-8 text-center">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="flex flex-col items-center"
          >
            {/* Icon circle */}
            <motion.div
              initial={{ scale: 0.5 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.1, type: "spring", stiffness: 200, damping: 15 }}
              className="w-24 h-24 rounded-[28px] flex items-center justify-center mb-6 relative overflow-hidden"
              style={{ background: `${current.color}10` }}
            >
              <span className="text-4xl">{current.emoji}</span>
              {/* Shimmer */}
              <motion.div
                initial={{ x: "-100%" }}
                animate={{ x: "200%" }}
                transition={{ delay: 0.4, duration: 0.8, ease: "easeInOut" }}
                className="absolute inset-y-0 w-12"
                style={{ background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)" }}
              />
            </motion.div>

            <h2 className="text-[22px] font-extrabold tracking-tight mb-2" style={{ color: "#1B2A4A" }}>
              {current.title}
            </h2>
            <p className="text-[15px] leading-relaxed max-w-[280px]" style={{ color: "#6B7280" }}>
              {current.subtitle}
            </p>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Bottom: dots + button */}
      <div className="w-full px-8 pb-[env(safe-area-inset-bottom,24px)] mb-4">
        {/* Progress dots */}
        <div className="flex items-center justify-center gap-2 mb-6">
          {steps.map((_, i) => (
            <motion.div
              key={i}
              animate={{
                width: i === step ? 24 : 8,
                background: i === step ? current.color : "#E5E7EB",
              }}
              transition={{ duration: 0.3 }}
              className="h-2 rounded-full"
            />
          ))}
        </div>

        {/* CTA Button */}
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={next}
          className="w-full h-14 rounded-2xl flex items-center justify-center gap-2 text-white font-bold text-[16px]"
          style={{ background: isLast ? "#C41E3A" : "#1B2A4A" }}
        >
          {isLast ? (
            <>
              <Sparkles size={18} />
              Start scanning
            </>
          ) : (
            <>
              Next
              <ArrowRight size={18} />
            </>
          )}
        </motion.button>

        {/* Branding */}
        <div className="flex items-center justify-center gap-1.5 mt-4 opacity-40">
          <img src={skaapIcon} alt="" className="w-4 h-4 rounded" />
          <span className="text-[10px] font-semibold" style={{ color: "#1B2A4A" }}>SKAAP</span>
        </div>
      </div>
    </div>
  );
}
