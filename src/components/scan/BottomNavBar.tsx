import { Clock, BarChart3, Scan, Trophy, Search, Globe } from "lucide-react";

interface BottomNavBarProps {
  active: string;
  onNavigate: (screen: string) => void;
}

export function BottomNavBar({ active, onNavigate }: BottomNavBarProps) {
  const items = [
    { icon: <Clock size={22} />, label: "History", key: "history" },
    { icon: <Globe size={22} />, label: "Community", key: "community" },
    { icon: <Scan size={28} />, label: "Scan", key: "scan", center: true },
    { icon: <Trophy size={22} />, label: "Top", key: "top" },
    { icon: <Search size={22} />, label: "Search", key: "search" },
  ];

  return (
    <div
      className="flex items-center justify-around"
      style={{
        height: 64,
        paddingBottom: "env(safe-area-inset-bottom, 8px)",
        borderTop: "1px solid rgba(0,0,0,0.06)",
        background: "rgba(255,255,255,0.88)",
        backdropFilter: "blur(40px) saturate(180%)",
        WebkitBackdropFilter: "blur(40px) saturate(180%)",
        boxShadow: "0 -1px 12px rgba(0,0,0,0.04)",
      }}
    >
      {items.map((item) => (
        <button
          key={item.key}
          onClick={() => onNavigate(item.key)}
          className="flex flex-col items-center gap-0.5 relative transition-transform active:scale-90"
          style={{
            minWidth: 56,
            WebkitTapHighlightColor: "transparent",
          }}
        >
          {item.center ? (
            <div
              className="flex items-center justify-center transition-transform active:scale-95"
              style={{
                width: 48,
                height: 48,
                borderRadius: 24,
                background: "linear-gradient(135deg, #B01830 0%, #D42040 100%)",
                marginTop: -18,
                boxShadow: "0 4px 16px rgba(176,24,48,0.45), 0 2px 6px rgba(176,24,48,0.25)",
                border: "1.5px solid rgba(255,255,255,0.2)",
              }}
            >
              <span style={{ color: "#fff" }}>{item.icon}</span>
            </div>
          ) : (
            <span
              className="transition-colors duration-200"
              style={{ color: active === item.key ? "#B01830" : "#6B7280" }}
            >
              {item.icon}
            </span>
          )}
          <span
            className="text-[10px] font-medium transition-colors duration-200"
            style={{
              color: item.center
                ? "#B01830"
                : active === item.key
                ? "#B01830"
                : "#6B7280",
              marginTop: item.center ? -2 : 0,
            }}
          >
            {item.label}
          </span>
          {active === item.key && !item.center && (
            <div
              className="w-1 h-1 rounded-full"
              style={{ background: "#B01830", marginTop: -2 }}
            />
          )}
        </button>
      ))}
    </div>
  );
}
