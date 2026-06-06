import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { User, ShoppingBag, ChevronRight, LogOut, Bell, CreditCard, HelpCircle, Package, ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface Order {
  id: string;
  created_at: string;
  total: number;
  items: any[];
  status: string;
}

const ProfileScreen = () => {
  const [user, setUser] = useState<any>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [activeSection, setActiveSection] = useState<"main" | "orders">("main");

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user ?? null);
      if (data.session?.user) {
        supabase
          .from("orders")
          .select("*")
          .eq("user_id", data.session.user.id)
          .order("created_at", { ascending: false })
          .limit(20)
          .then(({ data: orderData }) => {
            if (orderData) setOrders(orderData as Order[]);
          });
      }
    });
  }, []);

  const demoOrders: Order[] = orders.length > 0 ? orders : [
    { id: "demo-1", created_at: new Date(Date.now() - 86400000).toISOString(), total: 23.47, items: [{name: "Nutella"}, {name: "Orange Juice"}, {name: "Bread"}], status: "completed" },
    { id: "demo-2", created_at: new Date(Date.now() - 86400000 * 3).toISOString(), total: 15.99, items: [{name: "Macaroni"}, {name: "Crackers"}], status: "completed" },
    { id: "demo-3", created_at: new Date(Date.now() - 86400000 * 7).toISOString(), total: 42.18, items: [{name: "Super Drink"}, {name: "Bread"}, {name: "Orange Juice"}, {name: "Crackers"}], status: "completed" },
  ];

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    const now = new Date();
    const diff = Math.floor((now.getTime() - d.getTime()) / 86400000);
    if (diff === 0) return "Today";
    if (diff === 1) return "Yesterday";
    if (diff < 7) return `${diff} days ago`;
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  if (activeSection === "orders") {
    return (
      <div className="px-4 pt-12 pb-20 bg-background min-h-[100dvh]">
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
          <button
            onClick={() => setActiveSection("main")}
            className="flex items-center gap-1 text-[13px] text-accent font-medium mb-4"
          >
            <ArrowLeft size={13} /> Back
          </button>
          <h1 className="text-2xl font-bold text-foreground tracking-tight mb-4">Orders</h1>
        </motion.div>

        <div className="space-y-2">
          {demoOrders.map((order, i) => (
            <motion.div
              key={order.id}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05, type: "spring", stiffness: 200, damping: 24 }}
              className="bg-muted/50 rounded-xl p-3.5"
            >
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-foreground flex items-center justify-center">
                    <Package size={12} className="text-background" />
                  </div>
                  <span className="text-[11px] text-muted-foreground font-medium">{formatDate(order.created_at)}</span>
                </div>
                <span className="text-[13px] font-bold text-foreground tabular-nums">${order.total.toFixed(2)}</span>
              </div>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                {(order.items as any[]).map((it: any) => it.name || it.product?.name || "Item").join(", ")}
              </p>
              <div className="mt-2 flex items-center gap-1">
                <div className="w-1.5 h-1.5 rounded-full bg-success" />
                <span className="text-[9px] text-muted-foreground capitalize font-medium">{order.status}</span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    );
  }

  const settingsItems = [
    { icon: ShoppingBag, label: "Order History", action: () => setActiveSection("orders") },
    { icon: CreditCard, label: "Payment Methods", action: () => {} },
    { icon: Bell, label: "Notifications", action: () => {} },
    { icon: HelpCircle, label: "Help & Support", action: () => {} },
  ];

  return (
    <div className="px-4 pt-12 pb-20 bg-background min-h-[100dvh]">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-5"
      >
        <h1 className="text-2xl font-bold text-foreground tracking-tight">Profile</h1>
      </motion.div>

      {/* User card */}
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.06, type: "spring", stiffness: 200, damping: 24 }}
        className="bg-foreground rounded-2xl p-4 mb-4 flex items-center gap-3.5"
      >
        <div className="w-12 h-12 rounded-full bg-background/15 flex items-center justify-center">
          <User size={22} className="text-background" />
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="text-[15px] font-bold text-background truncate tracking-tight">
            {user?.user_metadata?.full_name || "Demo User"}
          </h2>
          <p className="text-[11px] text-background/50 truncate">
            {user?.email || "demo@skaap.app"}
          </p>
        </div>
      </motion.div>

      {/* Quick stats */}
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.12, type: "spring", stiffness: 200, damping: 24 }}
        className="grid grid-cols-3 gap-1.5 mb-4"
      >
        {[
          { label: "Orders", value: demoOrders.length.toString() },
          { label: "Saved", value: "$12.40" },
          { label: "Points", value: "340" },
        ].map((stat) => (
          <div key={stat.label} className="bg-muted/50 rounded-xl p-3 text-center">
            <p className="text-lg font-bold text-foreground tabular-nums">{stat.value}</p>
            <p className="text-[9px] text-muted-foreground mt-0.5 font-medium uppercase tracking-wider">{stat.label}</p>
          </div>
        ))}
      </motion.div>

      {/* SKAAP Plus — Personalization preview (teaser) */}
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.16, type: "spring", stiffness: 200, damping: 24 }}
        className="relative bg-gradient-to-br from-foreground to-foreground/90 rounded-2xl p-4 mb-4 overflow-hidden"
      >
        <div className="flex items-center justify-between mb-2.5">
          <div>
            <p className="text-[9px] font-bold text-background/50 uppercase tracking-widest">SKAAP Plus</p>
            <p className="text-[14px] font-bold text-background tracking-tight leading-tight">Personalize your scans</p>
          </div>
          <span className="text-[10px] font-bold text-background bg-primary rounded-full px-2.5 py-1">Preview</span>
        </div>
        <div className="grid grid-cols-3 gap-1.5 mb-3">
          {[
            { emoji: "🥗", label: "Diet" },
            { emoji: "🚫", label: "Allergies" },
            { emoji: "🎯", label: "Goals" },
            { emoji: "💄", label: "Beauty" },
            { emoji: "✨", label: "Skin type" },
            { emoji: "👶", label: "Life stage" },
          ].map((t) => (
            <div
              key={t.label}
              className="bg-background/10 rounded-lg p-2 text-center opacity-70"
            >
              <p className="text-base leading-none mb-0.5">{t.emoji}</p>
              <p className="text-[9px] font-semibold text-background/80 truncate">{t.label}</p>
            </div>
          ))}
        </div>
        <button className="w-full bg-background text-foreground rounded-full py-2 text-[12px] font-bold tracking-tight">
          Unlock for $1.99/mo
        </button>
      </motion.div>

      {/* Settings list */}
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.22, type: "spring", stiffness: 200, damping: 24 }}
        className="bg-muted/50 rounded-xl overflow-hidden mb-2.5"
      >
        {settingsItems.map((item, i) => {
          const Icon = item.icon;
          return (
            <button
              key={item.label}
              onClick={item.action}
              className={`w-full flex items-center gap-3 px-3.5 py-3 text-left active:bg-muted transition-colors ${
                i < settingsItems.length - 1 ? "border-b border-border/60" : ""
              }`}
            >
              <Icon size={16} className="text-muted-foreground" />
              <span className="flex-1 text-[13px] font-medium text-foreground">{item.label}</span>
              <ChevronRight size={13} className="text-muted-foreground/40" />
            </button>
          );
        })}
      </motion.div>


      {/* Sign out */}
      <motion.button
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.24, type: "spring", stiffness: 200, damping: 24 }}
        onClick={() => supabase.auth.signOut()}
        className="w-full flex items-center gap-3 bg-muted/50 rounded-xl px-3.5 py-3 text-left active:bg-muted transition-colors"
      >
        <LogOut size={16} className="text-accent" />
        <span className="text-[13px] font-medium text-accent">Sign Out</span>
      </motion.button>
    </div>
  );
};

export default ProfileScreen;
