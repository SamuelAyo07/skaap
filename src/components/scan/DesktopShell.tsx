import { ReactNode } from "react";
import skaapIcon from "@/assets/skaap-icon.png";
import { ScanLine, Shield, Sparkles, Globe } from "lucide-react";
import { SocialLinks } from "@/components/scan/SocialLinks";

interface DesktopShellProps {
  children: ReactNode;
}

export function DesktopShell({ children }: DesktopShellProps) {
  return (
    <div className="hidden md:flex min-h-[100dvh] w-full" style={{ background: "#060a14" }}>
      {/* Left panel, branding */}
      <div className="flex-1 flex flex-col items-end justify-center pr-12 relative overflow-hidden">
        {/* Ambient glow */}
        <div className="absolute top-1/4 right-0 w-96 h-96 rounded-full pointer-events-none"
          style={{ background: "radial-gradient(circle, rgba(196,30,58,0.08) 0%, transparent 70%)", filter: "blur(100px)" }} />

        <div className="relative z-10 max-w-sm text-right">
          <div className="flex items-center justify-end gap-3 mb-6">
            <span className="font-extrabold text-2xl tracking-tight text-white">SKAAP</span>
            <img src={skaapIcon} alt="SKAAP" className="w-10 h-10 rounded-xl" />
          </div>
          <h2 className="text-3xl font-extrabold text-white tracking-tight leading-tight mb-3">
            Food Intelligence<br />
            <span style={{ color: "#C41E3A" }}>in your hands.</span>
          </h2>
          <p className="text-sm leading-relaxed mb-8" style={{ color: "rgba(255,255,255,0.45)" }}>
            Scan any product. Decode ingredients, additives, and nutrition scores instantly. Works with 3M+ products worldwide.
          </p>

          <div className="space-y-3">
            {[
              { icon: ScanLine, label: "Instant barcode & photo scanning" },
              { icon: Shield, label: "Additive risk detection & alerts" },
              { icon: Sparkles, label: "AI-powered health insights" },
              { icon: Globe, label: "3M+ products worldwide" },
            ].map(({ icon: Icon, label }) => (
              <div key={label} className="flex items-center justify-end gap-2.5">
                <span className="text-[13px] font-medium" style={{ color: "rgba(255,255,255,0.5)" }}>{label}</span>
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "rgba(255,255,255,0.06)" }}>
                  <Icon size={15} style={{ color: "rgba(255,255,255,0.4)" }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Center, phone frame */}
      <div className="flex items-center justify-center py-8">
        <div className="relative" style={{ width: 430, minHeight: "90vh" }}>
          {/* Phone bezel */}
          <div className="absolute -inset-3 rounded-[40px] pointer-events-none"
            style={{
              background: "linear-gradient(180deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.02) 100%)",
              border: "1px solid rgba(255,255,255,0.08)",
              boxShadow: "0 20px 80px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.05)",
            }}
          />
          {/* Notch */}
          <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-32 h-6 rounded-b-2xl pointer-events-none"
            style={{ background: "#060a14", border: "1px solid rgba(255,255,255,0.06)", borderTop: "none" }}
          />
          {/* App content */}
          <div className="relative rounded-[28px] overflow-hidden" style={{ background: "#fff" }}>
            {children}
          </div>
        </div>
      </div>

      {/* Right panel, stats/info */}
      <div className="flex-1 flex flex-col items-start justify-center pl-12 relative overflow-hidden">
        <div className="absolute bottom-1/4 left-0 w-72 h-72 rounded-full pointer-events-none"
          style={{ background: "radial-gradient(circle, rgba(34,197,94,0.06) 0%, transparent 70%)", filter: "blur(80px)" }} />

        <div className="relative z-10 max-w-xs">
          <p className="text-[10px] font-bold uppercase tracking-widest mb-4" style={{ color: "rgba(255,255,255,0.25)" }}>How it works</p>
          {[
            { step: "1", title: "Scan", desc: "Point your camera at any barcode or take a photo of the product" },
            { step: "2", title: "Decode", desc: "Get instant SKAAP Score, Nutri-Score, additives analysis, and NOVA group" },
            { step: "3", title: "Decide", desc: "See healthier alternatives and share your findings with friends" },
          ].map(({ step, title, desc }) => (
            <div key={step} className="flex gap-3 mb-5">
              <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 font-extrabold text-sm"
                style={{ background: "rgba(196,30,58,0.12)", color: "#C41E3A" }}>{step}</div>
              <div>
                <p className="font-bold text-sm text-white">{title}</p>
                <p className="text-[12px] leading-relaxed mt-0.5" style={{ color: "rgba(255,255,255,0.4)" }}>{desc}</p>
              </div>
            </div>
          ))}

          <div className="mt-8 px-4 py-3 rounded-xl" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}>
            <p className="text-[11px] font-semibold" style={{ color: "rgba(255,255,255,0.3)" }}>
              💡 For the best experience, install SKAAP on your phone as a PWA, tap Share → Add to Home Screen.
            </p>
          </div>

          <div className="mt-4">
            <SocialLinks variant="inline" />
          </div>
        </div>
      </div>
    </div>
  );
}
