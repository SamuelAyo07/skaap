import { useState, useEffect, useCallback } from "react";
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

type Tab = "overview" | "stores" | "inventory" | "analytics" | "settings";

const Dashboard = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [stores, setStores] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.onAuthStateChange((_, session) => {
      setUser(session?.user ?? null);
    });
    supabase.auth.getSession().then(({ data }) => setUser(data.session?.user ?? null));
  }, []);

  const fetchData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const [storesRes, productsRes, ordersRes] = await Promise.all([
      supabase.from("stores").select("*").eq("owner_id", user.id),
      supabase.from("products").select("*, stores!inner(owner_id)").eq("stores.owner_id", user.id),
      supabase.from("orders").select("*"),
    ]);
    setStores(storesRes.data || []);
    setProducts(productsRes.data || []);
    setOrders(ordersRes.data || []);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  // Computed analytics
  const totalRevenue = orders.reduce((s, o) => s + Number(o.total || 0), 0);
  const totalTransactions = orders.length;
  const avgOrderValue = totalTransactions > 0 ? totalRevenue / totalTransactions : 0;

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

      {sidebarOpen && <div onClick={() => setSidebarOpen(false)} className="fixed inset-0 bg-black/30 z-30 lg:hidden" />}

      <main className="flex-1 lg:ml-64">
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
          {activeTab === "overview" && (
            <OverviewTab stores={stores} orders={orders} totalRevenue={totalRevenue} totalTransactions={totalTransactions} avgOrderValue={avgOrderValue} loading={loading} />
          )}
          {activeTab === "stores" && <StoresTab stores={stores} onRefresh={fetchData} user={user} />}
          {activeTab === "inventory" && <InventoryTab products={products} stores={stores} onRefresh={fetchData} />}
          {activeTab === "analytics" && <AnalyticsTab orders={orders} products={products} />}
          {activeTab === "settings" && <SettingsTab user={user} />}
        </div>
      </main>
    </div>
  );
};

// ─── Overview Tab ───────────────────────────
const OverviewTab = ({ stores, orders, totalRevenue, totalTransactions, avgOrderValue, loading }: any) => {
  const activeStores = stores.filter((s: any) => s.status === "active");
  const hasData = stores.length > 0 || orders.length > 0;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Revenue", value: `$${totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}`, icon: DollarSign },
          { label: "Transactions", value: totalTransactions.toLocaleString(), icon: ShoppingCart },
          { label: "Avg Order", value: `$${avgOrderValue.toFixed(2)}`, icon: TrendingUp },
          { label: "Active Stores", value: activeStores.length.toString(), icon: Store },
        ].map((stat, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} className="bg-card rounded-2xl border border-border p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-muted-foreground">{stat.label}</span>
              <stat.icon size={18} className="text-primary" />
            </div>
            <p className="text-2xl font-bold text-foreground">{loading ? "—" : stat.value}</p>
          </motion.div>
        ))}
      </div>

      {!hasData && !loading && (
        <div className="bg-card rounded-2xl border border-border p-8 text-center">
          <Store size={40} className="mx-auto text-muted-foreground mb-3" />
          <h3 className="font-bold text-foreground mb-1">No stores yet</h3>
          <p className="text-sm text-muted-foreground">Add your first store from the Stores tab to get started.</p>
        </div>
      )}

      {activeStores.length > 0 && (
        <div className="bg-card rounded-2xl border border-border p-5">
          <h3 className="font-bold text-foreground mb-4">Store Performance</h3>
          <div className="space-y-4">
            {activeStores.map((store: any) => {
              const storeOrders = orders.filter((o: any) => o.store_id === store.id);
              const storeRevenue = storeOrders.reduce((s: number, o: any) => s + Number(o.total || 0), 0);
              return (
                <div key={store.id}>
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-sm font-medium text-foreground">{store.name}</p>
                    <p className="text-sm font-bold text-primary">${storeRevenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <motion.div initial={{ width: 0 }} animate={{ width: `${Math.min((storeRevenue / Math.max(totalRevenue, 1)) * 100, 100)}%` }} transition={{ delay: 0.3, duration: 0.8 }} className="bg-primary rounded-full h-2" />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">{storeOrders.length} transactions</p>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

// ─── Stores Tab ───────────────────────────
const StoresTab = ({ stores, onRefresh, user }: any) => {
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");

  const handleAdd = async () => {
    if (!name || !address) return toast.error("Name and address are required");
    const { error } = await supabase.from("stores").insert({ name, address, owner_id: user.id, status: "active" });
    if (error) return toast.error(error.message);
    toast.success("Store added!");
    setName(""); setAddress(""); setAdding(false);
    onRefresh();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-muted-foreground text-sm">{stores.length} stores</p>
        <motion.button whileTap={{ scale: 0.95 }} onClick={() => setAdding(!adding)} className="bg-primary text-primary-foreground rounded-xl px-4 py-2 text-sm font-semibold flex items-center gap-2">
          <Plus size={16} /> Add Store
        </motion.button>
      </div>

      {adding && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="bg-card rounded-2xl border border-border p-5 space-y-3">
          <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Store name" className="w-full bg-muted rounded-xl py-2.5 px-4 text-sm outline-none focus:ring-2 focus:ring-primary/30" />
          <input type="text" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Full address" className="w-full bg-muted rounded-xl py-2.5 px-4 text-sm outline-none focus:ring-2 focus:ring-primary/30" />
          <div className="flex gap-2">
            <button onClick={handleAdd} className="bg-primary text-primary-foreground rounded-xl px-4 py-2 text-sm font-semibold">Save</button>
            <button onClick={() => setAdding(false)} className="text-muted-foreground text-sm px-4 py-2">Cancel</button>
          </div>
        </motion.div>
      )}

      {stores.map((store: any, i: number) => (
        <motion.div key={store.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} className="bg-card rounded-2xl border border-border p-5 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <Store size={22} className="text-primary" />
            </div>
            <div>
              <h3 className="font-bold text-foreground">{store.name}</h3>
              <p className="text-xs text-muted-foreground">{store.address}</p>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium mt-1 inline-block ${store.status === "active" ? "bg-green-500/10 text-green-600" : "bg-muted text-muted-foreground"}`}>
                {store.status}
              </span>
            </div>
          </div>
          <ChevronRight size={18} className="text-muted-foreground" />
        </motion.div>
      ))}

      {stores.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <Store size={40} className="mx-auto mb-3 opacity-40" />
          <p className="text-sm">No stores yet. Add your first store above.</p>
        </div>
      )}
    </div>
  );
};

// ─── Inventory Tab ───────────────────────────
const InventoryTab = ({ products, stores, onRefresh }: any) => {
  const [search, setSearch] = useState("");
  const filtered = products.filter((p: any) =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    (p.sku || "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search products..." className="w-full bg-card border border-border rounded-xl py-2.5 pl-10 pr-4 text-sm outline-none focus:ring-2 focus:ring-primary/30" />
        </div>
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
            {filtered.length === 0 ? (
              <tr><td colSpan={5} className="py-8 text-center text-sm text-muted-foreground">No products found. Add products via your store.</td></tr>
            ) : (
              filtered.map((product: any) => (
                <tr key={product.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                  <td className="py-3 px-4 text-sm font-medium text-foreground">{product.name}</td>
                  <td className="py-3 px-4 text-sm text-muted-foreground hidden md:table-cell">{product.sku || "—"}</td>
                  <td className="py-3 px-4 text-sm font-bold text-primary">${Number(product.price).toFixed(2)}</td>
                  <td className="py-3 px-4">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${product.stock < 100 ? "bg-destructive/10 text-destructive" : "bg-green-500/10 text-green-600"}`}>
                      {product.stock}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-sm text-muted-foreground hidden md:table-cell">{product.category || "—"}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// ─── Analytics Tab ───────────────────────────
const AnalyticsTab = ({ orders, products }: any) => (
  <div className="space-y-6">
    <div className="bg-card rounded-2xl border border-border p-6">
      <h3 className="font-bold text-foreground mb-4">Revenue Overview</h3>
      {orders.length === 0 ? (
        <p className="text-sm text-muted-foreground py-8 text-center">No order data yet. Analytics will appear once transactions are recorded.</p>
      ) : (
        <div className="flex items-end gap-1 h-48">
          {orders.slice(-30).map((order: any, i: number) => {
            const val = Number(order.total || 0);
            const max = Math.max(...orders.map((o: any) => Number(o.total || 0)), 1);
            return (
              <motion.div key={i} initial={{ height: 0 }} animate={{ height: `${(val / max) * 100}%` }} transition={{ delay: i * 0.03, duration: 0.5 }} className="flex-1 bg-primary/20 hover:bg-primary/40 rounded-t transition-colors relative group">
                <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-foreground text-background text-[10px] px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                  ${val.toFixed(2)}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>

    <div className="bg-card rounded-2xl border border-border p-6">
      <h3 className="font-bold text-foreground mb-4">Top Products</h3>
      {products.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-4">No products added yet.</p>
      ) : (
        <div className="space-y-3">
          {products.sort((a: any, b: any) => b.stock - a.stock).slice(0, 5).map((p: any, i: number) => (
            <div key={i} className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-xs font-bold text-muted-foreground w-5">{i + 1}</span>
                <span className="text-sm font-medium text-foreground">{p.name}</span>
              </div>
              <span className="text-sm font-bold text-primary">${Number(p.price).toFixed(2)}</span>
            </div>
          ))}
        </div>
      )}
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
          <input type="email" value={user?.email || ""} disabled className="w-full bg-muted rounded-xl py-2.5 px-4 text-sm text-muted-foreground" />
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1 block">Store Name</label>
          <input type="text" placeholder="Your store name" className="w-full bg-muted rounded-xl py-2.5 px-4 text-sm outline-none focus:ring-2 focus:ring-primary/30" />
        </div>
      </div>
    </div>

    <div className="bg-card rounded-2xl border border-border p-6">
      <h3 className="font-bold text-foreground mb-2">Zapier Integration</h3>
      <p className="text-xs text-muted-foreground mb-3">Connect Zapier to receive receipts, notifications, and store alerts.</p>
      <input type="url" placeholder="https://hooks.zapier.com/hooks/catch/..." className="w-full bg-muted rounded-xl py-2.5 px-4 text-sm outline-none focus:ring-2 focus:ring-primary/30" />
    </div>
  </div>
);

export default Dashboard;
