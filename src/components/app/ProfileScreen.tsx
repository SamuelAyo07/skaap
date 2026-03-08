import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { User, ShoppingBag, Settings, ChevronRight, LogOut, Bell, CreditCard, HelpCircle, Package } from "lucide-react";
import skaapIcon from "@/assets/skaap-icon.png";
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
      <div className="px-5 pt-14 pb-24 bg-background min-h-screen">
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
          <button
            onClick={() => setActiveSection("main")}
            className="text-sm text-primary font-medium mb-4"
          >
            ← Back
          </button>
          <h1 className="text-xl font-bold text-foreground mb-6">Order History</h1>
        </motion.div>

        <div className="space-y-3">
          {demoOrders.map((order, i) => (
            <motion.div
              key={order.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
              className="bg-card rounded-2xl p-4 shadow-card"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <Package size={14} className="text-primary" />
                  </div>
                  <span className="text-xs text-muted-foreground">{formatDate(order.created_at)}</span>
                </div>
                <span className="text-sm font-bold text-foreground">${order.total.toFixed(2)}</span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {(order.items as any[]).map((it: any) => it.name || it.product?.name || "Item").join(", ")}
              </p>
              <div className="mt-2 flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-[hsl(var(--success))]" />
                <span className="text-[10px] text-muted-foreground capitalize">{order.status}</span>
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
    <div className="px-5 pt-14 pb-24 bg-background min-h-screen">
      {/* Profile header */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-3 mb-8"
      >
        <img src={skaapIcon} alt="SKAAP" className="w-10 h-10 rounded-xl" />
        <h1 className="text-lg font-bold text-foreground">Profile</h1>
      </motion.div>

      {/* User card */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.08 }}
        className="bg-card rounded-[20px] p-5 shadow-elevated mb-6 flex items-center gap-4"
      >
        <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
          <User size={24} className="text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="text-base font-bold text-foreground truncate">
            {user?.user_metadata?.full_name || "Demo User"}
          </h2>
          <p className="text-xs text-muted-foreground truncate">
            {user?.email || "demo@skaap.app"}
          </p>
        </div>
      </motion.div>

      {/* Quick stats */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.14 }}
        className="grid grid-cols-3 gap-3 mb-6"
      >
        {[
          { label: "Orders", value: demoOrders.length.toString() },
          { label: "Saved", value: "$12.40" },
          { label: "Points", value: "340" },
        ].map((stat) => (
          <div key={stat.label} className="bg-card rounded-2xl p-3.5 shadow-card text-center">
            <p className="text-lg font-bold text-foreground">{stat.value}</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">{stat.label}</p>
          </div>
        ))}
      </motion.div>

      {/* Settings list */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-card rounded-2xl shadow-card overflow-hidden mb-4"
      >
        {settingsItems.map((item, i) => {
          const Icon = item.icon;
          return (
            <button
              key={item.label}
              onClick={item.action}
              className={`w-full flex items-center gap-3.5 px-4 py-3.5 text-left hover:bg-muted/50 transition-colors ${
                i < settingsItems.length - 1 ? "border-b border-border" : ""
              }`}
            >
              <Icon size={18} className="text-muted-foreground" />
              <span className="flex-1 text-sm font-medium text-foreground">{item.label}</span>
              <ChevronRight size={16} className="text-muted-foreground/40" />
            </button>
          );
        })}
      </motion.div>

      {/* Sign out */}
      <motion.button
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.26 }}
        onClick={() => supabase.auth.signOut()}
        className="w-full flex items-center gap-3.5 bg-card rounded-2xl px-4 py-3.5 shadow-card text-left hover:bg-muted/50 transition-colors"
      >
        <LogOut size={18} className="text-destructive" />
        <span className="text-sm font-medium text-destructive">Sign Out</span>
      </motion.button>
    </div>
  );
};

export default ProfileScreen;
