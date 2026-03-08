import { Home, ScanLine, ShoppingBag, User } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { motion } from "framer-motion";

interface BottomNavProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const BottomNav = ({ activeTab, onTabChange }: BottomNavProps) => {
  const { itemCount } = useCart();

  const tabs = [
    { id: "home", icon: Home, label: "Home" },
    { id: "scan", icon: ScanLine, label: "Scan" },
    { id: "bag", icon: ShoppingBag, label: "Bag", badge: itemCount },
    { id: "profile", icon: User, label: "Profile" },
  ];

  return (
    <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full md:max-w-[390px] glass border-t border-border/50 z-50">
      <div className="flex justify-around items-center h-16 px-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className="flex flex-col items-center gap-0.5 py-1 px-3 rounded-xl transition-colors relative"
            >
              <div className="relative">
                <Icon
                  size={22}
                  strokeWidth={isActive ? 2.5 : 1.5}
                  className={isActive ? "text-foreground" : "text-muted-foreground/60"}
                />
                {tab.badge && tab.badge > 0 && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-1.5 -right-2.5 bg-accent text-accent-foreground text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center"
                  >
                    {tab.badge}
                  </motion.span>
                )}
              </div>
              <span className={`text-[10px] ${isActive ? "font-semibold text-foreground" : "font-medium text-muted-foreground/60"}`}>
                {tab.label}
              </span>
              {isActive && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute -top-0.5 w-4 h-0.5 rounded-full bg-foreground"
                  transition={{ type: "spring", stiffness: 300, damping: 25 }}
                />
              )}
            </button>
          );
        })}
      </div>
      <div className="h-[env(safe-area-inset-bottom)]" />
    </nav>
  );
};

export default BottomNav;
