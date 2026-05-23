import { Instagram, Linkedin } from "lucide-react";

interface SocialLinksProps {
  variant?: "pill" | "inline" | "footer";
}

export function SocialLinks({ variant = "pill" }: SocialLinksProps) {
  const links = [
    { icon: Instagram, href: "https://www.instagram.com/useskaap", label: "Instagram" },
    { icon: Linkedin, href: "https://www.linkedin.com/company/skaaptech/", label: "LinkedIn" },
  ];

  if (variant === "footer") {
    return (
      <div className="flex items-center justify-center gap-3 py-3">
        <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: "#9CA3AF" }}>Follow us</span>
        {links.map(({ icon: Icon, href, label }) => (
          <a key={label} href={href} target="_blank" rel="noopener noreferrer"
            className="w-8 h-8 rounded-full flex items-center justify-center transition-colors active:scale-95"
            style={{ background: "#F3F4F6" }}
            aria-label={label}>
            <Icon size={14} style={{ color: "#374151" }} />
          </a>
        ))}
      </div>
    );
  }

  if (variant === "inline") {
    return (
      <div className="flex items-center gap-2">
        {links.map(({ icon: Icon, href, label }) => (
          <a key={label} href={href} target="_blank" rel="noopener noreferrer"
            className="w-7 h-7 rounded-full flex items-center justify-center transition-colors active:scale-95"
            style={{ background: "rgba(255,255,255,0.08)" }}
            aria-label={label}>
            <Icon size={13} style={{ color: "rgba(255,255,255,0.5)" }} />
          </a>
        ))}
      </div>
    );
  }

  // pill variant, compact row with brand
  return (
    <div className="flex items-center justify-between px-4 py-2.5 rounded-2xl"
      style={{ background: "#F9FAFB", border: "1px solid #F3F4F6" }}>
      <div className="flex items-center gap-2">
        <span className="text-[11px] font-bold" style={{ color: "#374151" }}>@useskaap</span>
        <span className="text-[10px]" style={{ color: "#9CA3AF" }}>· Follow for food intel</span>
      </div>
      <div className="flex items-center gap-1.5">
        {links.map(({ icon: Icon, href, label }) => (
          <a key={label} href={href} target="_blank" rel="noopener noreferrer"
            className="w-7 h-7 rounded-full flex items-center justify-center transition-colors active:scale-95"
            style={{ background: "#E5E7EB" }}
            aria-label={label}>
            <Icon size={13} style={{ color: "#374151" }} />
          </a>
        ))}
      </div>
    </div>
  );
}
