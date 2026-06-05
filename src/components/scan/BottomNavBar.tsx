import { Clock, ScanLine, Globe } from "lucide-react";
import { hapticSelection } from "@/lib/haptics";

interface BottomNavBarProps {
  active: string;
  onNavigate: (screen: string) => void;
}

/**
 * iOS-style tab bar.
 * - Translucent material background (UIKit "regular" blur)
 * - Hairline top border (1px @ system separator opacity)
 * - 49pt nav height + dynamic home-indicator safe area
 * - Centered emphasized "Scan" action (SwiftUI floating accessory style)
 * - Selection haptic on tap (matches UITabBar feel)
 */
export function BottomNavBar({ active, onNavigate }: BottomNavBarProps) {
  const go = (key: string) => {
    hapticSelection();
    onNavigate(key);
  };

  const items: Array<{
    key: string;
    label: string;
    icon: React.ReactNode;
    center?: boolean;
  }> = [
    { key: "history", label: "History", icon: <Clock size={24} strokeWidth={2} /> },
    { key: "community", label: "Community", icon: <Globe size={24} strokeWidth={2} /> },
    { key: "scan", label: "Scan", center: true, icon: <ScanLine size={26} strokeWidth={2.25} /> },
    { key: "profile", label: "Me", icon: <span className="text-[20px] leading-none">👤</span> },
  ];

  return (
    <nav
      role="tablist"
      aria-label="Primary"
      className="flex items-stretch justify-around select-none"
      style={{
        height: 49,
        paddingBottom: "env(safe-area-inset-bottom, 0px)",
        borderTop: "0.5px solid rgba(60,60,67,0.18)",
        background: "rgba(255,255,255,0.78)",
        backdropFilter: "saturate(180%) blur(30px)",
        WebkitBackdropFilter: "saturate(180%) blur(30px)",
      }}
    >
      {items.map((item) => {
        const isActive = active === item.key;
        const tint = isActive || item.center ? "#B01830" : "#8E8E93"; // iOS systemGray
        return (
          <button
            key={item.key}
            role="tab"
            aria-selected={isActive}
            aria-label={item.label}
            onClick={() => go(item.key)}
            className="flex-1 flex flex-col items-center justify-center gap-0.5 transition-transform duration-150 ease-out active:scale-[0.92]"
            style={{ WebkitTapHighlightColor: "transparent", minHeight: 49 }}
          >
            {item.center ? (
              <div
                className="flex items-center justify-center transition-transform duration-200 active:scale-95"
                style={{
                  width: 52,
                  height: 52,
                  borderRadius: 26,
                  background: "linear-gradient(135deg, #B01830 0%, #E8314A 100%)",
                  marginTop: -22,
                  boxShadow:
                    "0 6px 18px rgba(176,24,48,0.42), 0 2px 6px rgba(176,24,48,0.28), inset 0 1px 0 rgba(255,255,255,0.25)",
                  border: "1px solid rgba(255,255,255,0.22)",
                  color: "#fff",
                }}
              >
                {item.icon}
              </div>
            ) : (
              <span style={{ color: tint }} className="transition-colors">
                {item.icon}
              </span>
            )}
            <span
              className="font-medium tracking-tight transition-colors"
              style={{
                fontSize: 10,
                lineHeight: 1.1,
                color: tint,
                marginTop: item.center ? 0 : 2,
                letterSpacing: 0.05,
              }}
            >
              {item.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
}
