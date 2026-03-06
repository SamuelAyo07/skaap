import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Store, Package, BarChart3, Settings, LogOut, Plus,
  TrendingUp, Users, DollarSign, ShoppingCart, Menu, X,
  Search, Bell, ChevronRight
} from "lucide-react";
import skaapIcon from "@/assets/skaap-icon.png";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

// Mock dashboard data
const mockStores = [
  { id: "1", name: "Publix - Brickell", address: "1776 Brickell Ave, Miami, FL", status: "active", transactions: 1284, revenue: 38520 },
  { id: "2", name: "Whole Foods - Georgetown", address: "2323 Wisconsin Ave NW, DC", status: "active", transactions: 892, revenue: 26760 },
  { id: "3", name: "Kroger - Buckhead", address: "3330 Piedmont Rd NE, Atlanta, GA", status: "pending", transactions: 0, revenue: 0 },
];

const mockProducts = [
  { id: "1", name: "SuperDrink Strawberry Banana", sku: "SD-001", price: 2.99, stock: 145, category: "Beverages" },
  { id: "2", name: "Original Mac & Cheese", sku: "MC-002", price: 1.50, stock: 312, category: "Pantry" },
  { id: "3", name: "All Dressed Crackers", sku: "CR-003", price: 2.49, stock: 89, category: "Snacks" },
  { id: "4", name: "Orange Juice 1L", sku: "OJ-004", price: 3.99, stock: 67, category: "Beverages" },
  { id: "5", name: "Whole Grain Bread", sku: "BR-005", price: 4.29, stock: 203, category: "Bakery" },
];

const mockAnalytics = {
  totalRevenue: 65280,
  totalTransactions: 2176,
  avgOrderValue: 29.99,
  activeCustomers: 843,
  revenueChange: 12.4,
  transactionChange: 8.7,
  customerChange: 15.2,
};

type Tab = "overview" | "stores" | "inventory" | "analytics" | "settings";

const Dashboard = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    supabase.auth.onAuthStateChange((_, session) => {
      setUser(session?.user ?? null);
    });
    supabase.auth.getSession().then(({ data }) => setUser(data.session?.user ?? null));
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  const tabs: { id: Tab; label: string; icon: any }[] = [
    { id: "overview", label: "Overview", icon: BarChart3 },
    { id: "stores", label: "Stores", icon: Store },
    { id: "inventory", label: "Inventory", icon: Package },
    { id: "analytics", label: "Analytics", icon: TrendingUp },
    { id: "settings", label: "Settings", icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-muted/30 flex">
      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-40 w-64 bg-secondary text-secondary-foreground transform transition-transform lg:translate-x-0 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="p-5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img src={skaapIcon} alt="SKAAP" className="w-8 h-8 rounded-lg" />
            <span className="font-bold text-lg">SKAAP</span>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-secondary-foreground/50">
            <X size={20} />
          </button>
        </div>
        <p className="px-5 text-xs text-secondary-foreground/40 mb-6">Retailer Dashboard</p>

        <nav className="px-3 space-y-1">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => { setActiveTab(tab.id); setSidebarOpen(false); }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-colors ${
                  activeTab === tab.id
                    ? "bg-primary text-primary-foreground font-semibold"
                    : "text-secondary-foreground/60 hover:text-secondary-foreground hover:bg-secondary-foreground/5"
                }`}
              >
                <Icon size={18} />
                {tab.label}
              </button>
            );
          })}
        </nav>

        <div className="absolute bottom-5 left-3 right-3">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-secondary-foreground/50 hover:text-secondary-foreground hover:bg-secondary-foreground/5 transition-colors"
          >
            <LogOut size={18} /> Sign Out
          </button>
        </div>
      </aside>

      {/* Overlay */}
      {sidebarOpen && <div onClick={() => setSidebarOpen(false)} className="fixed inset-0 bg-black/30 z-30 lg:hidden" />}

      {/* Main content */}
      <main className="flex-1 lg:ml-64">
        {/* Top bar */}
        <header className="bg-background border-b border-border px-5 py-3 flex items-center justify-between sticky top-0 z-20">
          <div className="flex items-center gap-3">
            <button onClick={() => setSidebarOpen(true)} className="lg:hidden text-foreground">
              <Menu size={22} />
            </button>
            <h1 className="font-bold text-lg text-foreground capitalize">{activeTab}</h1>
          </div>
          <div className="flex items-center gap-3">
            <button className="relative p-2 text-muted-foreground hover:text-foreground transition-colors">
              <Bell size={20} />
              <span className="absolute top-1 right-1 w-2 h-2 bg-primary rounded-full" />
            </button>
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
              {user?.email?.[0]?.toUpperCase() || "R"}
            </div>
          </div>
        </header>

        <div className="p-5 md:p-8 max-w-7xl mx-auto">
          {activeTab === "overview" && <OverviewTab />}
          {activeTab === "stores" && <StoresTab />}
          {activeTab === "inventory" && <InventoryTab />}
          {activeTab === "analytics" && <AnalyticsTab />}
          {activeTab === "settings" && <SettingsTab user={user} />}
        </div>
      </main>
    </div>
  );
};

// ─── Overview Tab ───────────────────────────
const OverviewTab = () => (
  <div className="space-y-6">
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {[
        { label: "Total Revenue", value: `$${mockAnalytics.totalRevenue.toLocaleString()}`, change: `+${mockAnalytics.revenueChange}%`, icon: DollarSign },
        { label: "Transactions", value: mockAnalytics.totalTransactions.toLocaleString(), change: `+${mockAnalytics.transactionChange}%`, icon: ShoppingCart },
        { label: "Avg Order", value: `$${mockAnalytics.avgOrderValue}`, change: "+3.2%", icon: TrendingUp },
        { label: "Active Customers", value: mockAnalytics.activeCustomers.toLocaleString(), change: `+${mockAnalytics.customerChange}%`, icon: Users },
      ].map((stat, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.1 }}
          className="bg-card rounded-2xl border border-border p-5"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-muted-foreground">{stat.label}</span>
            <stat.icon size={18} className="text-primary" />
          </div>
          <p className="text-2xl font-bold text-foreground">{stat.value}</p>
          <p className="text-xs text-success font-medium mt-1">{stat.change} vs last month</p>
        </motion.div>
      ))}
    </div>

    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Recent transactions */}
      <div className="bg-card rounded-2xl border border-border p-5">
        <h3 className="font-bold text-foreground mb-4">Recent Transactions</h3>
        <div className="space-y-3">
          {[
            { customer: "Sarah M.", amount: 34.97, items: 5, time: "2 min ago" },
            { customer: "James K.", amount: 12.48, items: 3, time: "8 min ago" },
            { customer: "Maria L.", amount: 67.23, items: 12, time: "15 min ago" },
            { customer: "David R.", amount: 8.99, items: 2, time: "22 min ago" },
          ].map((tx, i) => (
            <div key={i} className="flex items-center justify-between py-2 border-b border-border last:border-0">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-bold">
                  {tx.customer.split(" ").map(n => n[0]).join("")}
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">{tx.customer}</p>
                  <p className="text-xs text-muted-foreground">{tx.items} items · {tx.time}</p>
                </div>
              </div>
              <p className="text-sm font-bold text-foreground">${tx.amount.toFixed(2)}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Store performance */}
      <div className="bg-card rounded-2xl border border-border p-5">
        <h3 className="font-bold text-foreground mb-4">Store Performance</h3>
        <div className="space-y-4">
          {mockStores.filter(s => s.status === "active").map((store) => (
            <div key={store.id}>
              <div className="flex items-center justify-between mb-1">
                <p className="text-sm font-medium text-foreground">{store.name}</p>
                <p className="text-sm font-bold text-primary">${store.revenue.toLocaleString()}</p>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${(store.revenue / 40000) * 100}%` }}
                  transition={{ delay: 0.3, duration: 0.8 }}
                  className="bg-primary rounded-full h-2"
                />
              </div>
              <p className="text-xs text-muted-foreground mt-1">{store.transactions} transactions</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  </div>
);

// ─── Stores Tab ───────────────────────────
const StoresTab = () => (
  <div className="space-y-4">
    <div className="flex items-center justify-between">
      <p className="text-muted-foreground text-sm">{mockStores.length} stores</p>
      <motion.button
        whileTap={{ scale: 0.95 }}
        className="bg-primary text-primary-foreground rounded-xl px-4 py-2 text-sm font-semibold flex items-center gap-2"
      >
        <Plus size={16} /> Add Store
      </motion.button>
    </div>

    {mockStores.map((store, i) => (
      <motion.div
        key={store.id}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: i * 0.1 }}
        className="bg-card rounded-2xl border border-border p-5 flex items-center justify-between"
      >
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
            <Store size={22} className="text-primary" />
          </div>
          <div>
            <h3 className="font-bold text-foreground">{store.name}</h3>
            <p className="text-xs text-muted-foreground">{store.address}</p>
            <div className="flex items-center gap-3 mt-1">
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                store.status === "active" ? "bg-success/10 text-success" : "bg-muted text-muted-foreground"
              }`}>
                {store.status}
              </span>
              {store.transactions > 0 && (
                <span className="text-xs text-muted-foreground">{store.transactions} transactions</span>
              )}
            </div>
          </div>
        </div>
        <ChevronRight size={18} className="text-muted-foreground" />
      </motion.div>
    ))}
  </div>
);

// ─── Inventory Tab ───────────────────────────
const InventoryTab = () => {
  const [search, setSearch] = useState("");
  const filtered = mockProducts.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.sku.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search products..."
            className="w-full bg-card border border-border rounded-xl py-2.5 pl-10 pr-4 text-sm outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>
        <motion.button
          whileTap={{ scale: 0.95 }}
          className="bg-primary text-primary-foreground rounded-xl px-4 py-2.5 text-sm font-semibold flex items-center gap-2"
        >
          <Plus size={16} /> Add Product
        </motion.button>
      </div>

      <div className="bg-card rounded-2xl border border-border overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">Product</th>
              <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground hidden md:table-cell">SKU</th>
              <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">Price</th>
              <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">Stock</th>
              <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground hidden md:table-cell">Category</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((product) => (
              <tr key={product.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                <td className="py-3 px-4 text-sm font-medium text-foreground">{product.name}</td>
                <td className="py-3 px-4 text-sm text-muted-foreground hidden md:table-cell">{product.sku}</td>
                <td className="py-3 px-4 text-sm font-bold text-primary">${product.price.toFixed(2)}</td>
                <td className="py-3 px-4">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    product.stock < 100 ? "bg-destructive/10 text-destructive" : "bg-success/10 text-success"
                  }`}>
                    {product.stock}
                  </span>
                </td>
                <td className="py-3 px-4 text-sm text-muted-foreground hidden md:table-cell">{product.category}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// ─── Analytics Tab ───────────────────────────
const AnalyticsTab = () => (
  <div className="space-y-6">
    <div className="bg-card rounded-2xl border border-border p-6">
      <h3 className="font-bold text-foreground mb-4">Revenue This Month</h3>
      <div className="flex items-end gap-1 h-48">
        {[28, 42, 35, 58, 44, 62, 55, 71, 48, 65, 82, 73, 88, 95, 68, 78, 92, 85, 96, 102, 89, 75, 93, 87, 104, 98, 110, 95, 88, 100].map((val, i) => (
          <motion.div
            key={i}
            initial={{ height: 0 }}
            animate={{ height: `${(val / 110) * 100}%` }}
            transition={{ delay: i * 0.03, duration: 0.5 }}
            className="flex-1 bg-primary/20 hover:bg-primary/40 rounded-t transition-colors relative group"
          >
            <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-foreground text-background text-[10px] px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
              ${(val * 10).toLocaleString()}
            </div>
          </motion.div>
        ))}
      </div>
      <div className="flex justify-between text-xs text-muted-foreground mt-2">
        <span>Mar 1</span>
        <span>Mar 15</span>
        <span>Mar 30</span>
      </div>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="bg-card rounded-2xl border border-border p-6">
        <h3 className="font-bold text-foreground mb-4">Top Products</h3>
        <div className="space-y-3">
          {mockProducts.sort((a, b) => b.stock - a.stock).slice(0, 4).map((p, i) => (
            <div key={i} className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-xs font-bold text-muted-foreground w-5">{i + 1}</span>
                <span className="text-sm font-medium text-foreground">{p.name}</span>
              </div>
              <span className="text-sm font-bold text-primary">${p.price}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-card rounded-2xl border border-border p-6">
        <h3 className="font-bold text-foreground mb-4">Peak Hours</h3>
        <div className="space-y-2">
          {[
            { hour: "11 AM - 1 PM", pct: 85 },
            { hour: "5 PM - 7 PM", pct: 92 },
            { hour: "9 AM - 11 AM", pct: 64 },
            { hour: "7 PM - 9 PM", pct: 45 },
          ].map((h, i) => (
            <div key={i}>
              <div className="flex items-center justify-between text-sm mb-1">
                <span className="text-foreground">{h.hour}</span>
                <span className="text-muted-foreground">{h.pct}%</span>
              </div>
              <div className="w-full bg-muted rounded-full h-1.5">
                <motion.div
                  initial={{ width: 0 }}
                  whileInView={{ width: `${h.pct}%` }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1, duration: 0.6 }}
                  className="bg-primary rounded-full h-1.5"
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  </div>
);

// ─── Settings Tab ───────────────────────────
const SettingsTab = ({ user }: { user: any }) => (
  <div className="max-w-lg space-y-6">
    <div className="bg-card rounded-2xl border border-border p-6">
      <h3 className="font-bold text-foreground mb-4">Account</h3>
      <div className="space-y-3">
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1 block">Email</label>
          <input
            type="email"
            value={user?.email || ""}
            disabled
            className="w-full bg-muted rounded-xl py-2.5 px-4 text-sm text-muted-foreground"
          />
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1 block">Store Name</label>
          <input
            type="text"
            placeholder="Your store name"
            className="w-full bg-muted rounded-xl py-2.5 px-4 text-sm outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>
      </div>
    </div>

    <div className="bg-card rounded-2xl border border-border p-6">
      <h3 className="font-bold text-foreground mb-2">Zapier Integration</h3>
      <p className="text-xs text-muted-foreground mb-3">Connect Zapier to receive receipts, notifications, and store alerts.</p>
      <input
        type="url"
        placeholder="https://hooks.zapier.com/hooks/catch/..."
        className="w-full bg-muted rounded-xl py-2.5 px-4 text-sm outline-none focus:ring-2 focus:ring-primary/30"
      />
    </div>
  </div>
);

export default Dashboard;
