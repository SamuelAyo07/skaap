import { Clock, BarChart3, Scan, Trophy, Search } from "lucide-react";

interface BottomNavBarProps {
  active: string;
  onNavigate: (screen: string) => void;
}

export function BottomNavBar({ active, onNavigate }: BottomNavBarProps) {
  const items = [
    { icon: <Clock size={22} />, label: "History", key: "history" },
    { icon: <BarChart3 size={22} />, label: "Recs", key: "kitchen" },
    { icon: <Scan size={28} />, label: "Scan", key: "scan", center: true },
    { icon: <Trophy size={22} />, label: "Top", key: "top" },
    { icon: <Search size={22} />, label: "Search", key: "search" },
  ];

  return (
    <div
      className="flex items-center justify-around"
      style={{
        height: 83,
        paddingBottom: "env(safe-area-inset-bottom, 20px)",
        borderTop: "1px solid #E5E7EB",
        background: "#fff",
      }}
    >
      {items.map((item) => (
        <button
          key={item.key}
          onClick={() => onNavigate(item.key)}
          className="flex flex-col items-center gap-0.5 relative"
          style={{ minWidth: 56 }}
        >
          {item.center ? (
            <div
              className="flex items-center justify-center"
              style={{
                width: 56,
                height: 56,
                borderRadius: 28,
                background: "#E8314A",
                marginTop: -24,
                boxShadow: "0 4px 16px rgba(232,49,74,0.3)",
              }}
            >
              <span style={{ color: "#fff" }}>{item.icon}</span>
            </div>
          ) : (
            <span style={{ color: active === item.key ? "#E8314A" : "#9CA3AF" }}>
              {item.icon}
            </span>
          )}
          <span
            className="text-[10px] font-medium"
            style={{
              color: item.center
                ? "#E8314A"
                : active === item.key
                ? "#E8314A"
                : "#9CA3AF",
              marginTop: item.center ? -2 : 0,
            }}
          >
            {item.label}
          </span>
          {active === item.key && !item.center && (
            <div
              className="w-1 h-1 rounded-full"
              style={{ background: "#E8314A", marginTop: -2 }}
            />
          )}
        </button>
      ))}
    </div>
  );
}
