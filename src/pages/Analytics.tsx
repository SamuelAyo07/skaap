import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import {
  BarChart3, Users, ScanLine, ShoppingBag, TrendingUp,
  Smartphone, Monitor, ArrowLeft, Eye, MousePointerClick,
  Target, Lightbulb, Clock,
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, CartesianGrid,
} from "recharts";

interface AnalyticsRow {
  event_type: string;
  event_data: any;
  page: string;
  created_at: string;
  session_id: string;
  user_agent: string;
  screen_width: number;
}

const COLORS = [
  "hsl(142,71%,45%)", "hsl(220,70%,55%)", "hsl(30,90%,55%)",
  "hsl(320,60%,55%)", "hsl(48,95%,55%)", "hsl(0,70%,55%)",
];

const Analytics = () => {
  const navigate = useNavigate();
  const [events, setEvents] = useState<AnalyticsRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<"24h" | "7d" | "30d">("7d");

  useEffect(() => {
    fetchAnalytics();
  }, [timeRange]);

  const fetchAnalytics = async () => {
    setLoading(true);
    const since = new Date();
    if (timeRange === "24h") since.setHours(since.getHours() - 24);
    else if (timeRange === "7d") since.setDate(since.getDate() - 7);
    else since.setDate(since.getDate() - 30);

    const { data } = await (supabase as any)
      .from("analytics_events")
      .select("*")
      .gte("created_at", since.toISOString())
      .order("created_at", { ascending: true });

    setEvents(data || []);
    setLoading(false);
  };

  // Derived metrics
  const uniqueSessions = new Set(events.map((e) => e.session_id)).size;
  const totalEvents = events.length;

  const eventCounts: Record<string, number> = {};
  events.forEach((e) => {
    eventCounts[e.event_type] = (eventCounts[e.event_type] || 0) + 1;
  });

  const scans = eventCounts["scan_success"] || 0;
  const addToCarts = eventCounts["add_to_cart"] || 0;
  const checkouts = eventCounts["checkout_started"] || 0;
  const orders = eventCounts["order_completed"] || 0;
  const infoViews = eventCounts["product_info_viewed"] || 0;

  // Funnel
  const funnelData = [
    { step: "Page Views", count: eventCounts["page_view"] || 0 },
    { step: "Scans", count: scans },
    { step: "Add to Cart", count: addToCarts },
    { step: "Checkout", count: checkouts },
    { step: "Completed", count: orders },
  ];

  // Device breakdown
  const deviceMap: Record<string, number> = { mobile: 0, tablet: 0, desktop: 0 };
  events.forEach((e) => {
    if (e.screen_width < 768) deviceMap.mobile++;
    else if (e.screen_width < 1024) deviceMap.tablet++;
    else deviceMap.desktop++;
  });
  const deviceData = Object.entries(deviceMap)
    .filter(([, v]) => v > 0)
    .map(([name, value]) => ({ name, value }));

  // Events by type for bar chart
  const eventTypeData = Object.entries(eventCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([name, count]) => ({ name: name.replace(/_/g, " "), count }));

  // Daily trend
  const dailyMap: Record<string, number> = {};
  events.forEach((e) => {
    const day = e.created_at.slice(0, 10);
    dailyMap[day] = (dailyMap[day] || 0) + 1;
  });
  const dailyTrend = Object.entries(dailyMap)
    .sort()
    .map(([date, count]) => ({ date: date.slice(5), count }));

  // Session depth (avg events per session)
  const sessionEvents: Record<string, number> = {};
  events.forEach((e) => {
    sessionEvents[e.session_id] = (sessionEvents[e.session_id] || 0) + 1;
  });
  const avgDepth = uniqueSessions > 0
    ? (Object.values(sessionEvents).reduce((a, b) => a + b, 0) / uniqueSessions).toFixed(1)
    : "0";

  // Scan-to-cart conversion
  const scanToCart = scans > 0 ? ((addToCarts / scans) * 100).toFixed(1) : "0";
  // Cart-to-checkout conversion
  const cartToCheckout = addToCarts > 0 ? ((checkouts / addToCarts) * 100).toFixed(1) : "0";

  // PM Insights
  const insights: { icon: typeof Lightbulb; title: string; text: string; type: "info" | "warning" | "success" }[] = [];

  if (Number(scanToCart) < 30) {
    insights.push({
      icon: Target,
      title: "Low scan-to-cart conversion",
      text: `Only ${scanToCart}% of scans result in an add-to-cart. Consider auto-adding scanned items or reducing friction.`,
      type: "warning",
    });
  }

  if (deviceMap.mobile > (deviceMap.desktop + deviceMap.tablet)) {
    insights.push({
      icon: Smartphone,
      title: "Mobile-first audience",
      text: `${((deviceMap.mobile / totalEvents) * 100).toFixed(0)}% of traffic is mobile. Prioritize mobile UX optimizations.`,
      type: "info",
    });
  }

  if (infoViews > scans * 0.5) {
    insights.push({
      icon: Eye,
      title: "High nutrition info engagement",
      text: `${infoViews} info views vs ${scans} scans — users love the nutrition feature. Make it more prominent in marketing.`,
      type: "success",
    });
  }

  if (Number(cartToCheckout) < 50 && addToCarts > 5) {
    insights.push({
      icon: ShoppingBag,
      title: "Cart abandonment detected",
      text: `Only ${cartToCheckout}% of carts proceed to checkout. Consider simplifying the payment flow or adding trust signals.`,
      type: "warning",
    });
  }

  if (Number(avgDepth) < 3 && uniqueSessions > 5) {
    insights.push({
      icon: Clock,
      title: "Shallow sessions",
      text: `Average ${avgDepth} events/session. Users may not understand the flow — consider onboarding tooltips.`,
      type: "warning",
    });
  }

  if (insights.length === 0) {
    insights.push({
      icon: Lightbulb,
      title: "Collecting data",
      text: "Not enough data yet for actionable insights. Keep driving traffic to see patterns emerge.",
      type: "info",
    });
  }

  const StatCard = ({ icon: Icon, label, value, sub }: { icon: any; label: string; value: string | number; sub?: string }) => (
    <div className="bg-card border border-border/50 rounded-2xl p-4">
      <div className="flex items-center gap-2 mb-2">
        <div className="w-8 h-8 rounded-lg bg-foreground/5 flex items-center justify-center">
          <Icon size={16} className="text-muted-foreground" />
        </div>
        <span className="text-[11px] text-muted-foreground font-medium uppercase tracking-wider">{label}</span>
      </div>
      <p className="text-2xl font-black text-foreground tracking-tight">{value}</p>
      {sub && <p className="text-[11px] text-muted-foreground mt-0.5">{sub}</p>}
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto px-4 md:px-6 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate("/")} className="w-9 h-9 rounded-full bg-foreground/5 flex items-center justify-center">
              <ArrowLeft size={16} className="text-foreground" />
            </button>
            <div>
              <h1 className="text-2xl font-black text-foreground tracking-tight">Analytics</h1>
              <p className="text-xs text-muted-foreground">Product & user journey insights</p>
            </div>
          </div>
          <div className="flex gap-1 bg-muted/50 rounded-full p-1">
            {(["24h", "7d", "30d"] as const).map((r) => (
              <button
                key={r}
                onClick={() => setTimeRange(r)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                  timeRange === r ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {r}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-6 h-6 border-2 border-foreground/20 border-t-foreground rounded-full animate-spin" />
          </div>
        ) : (
          <>
            {/* KPI Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
              <StatCard icon={Users} label="Sessions" value={uniqueSessions} sub={`${totalEvents} total events`} />
              <StatCard icon={ScanLine} label="Scans" value={scans} sub={`${scanToCart}% → cart`} />
              <StatCard icon={ShoppingBag} label="Orders" value={orders} sub={`${cartToCheckout}% checkout rate`} />
              <StatCard icon={TrendingUp} label="Avg Depth" value={avgDepth} sub="events/session" />
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              {/* Daily Trend */}
              <div className="bg-card border border-border/50 rounded-2xl p-4">
                <h3 className="text-sm font-bold text-foreground mb-3 tracking-tight">Daily Activity</h3>
                {dailyTrend.length > 0 ? (
                  <ResponsiveContainer width="100%" height={180}>
                    <LineChart data={dailyTrend}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="date" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                      <YAxis tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                      <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 12, fontSize: 12 }} />
                      <Line type="monotone" dataKey="count" stroke="hsl(var(--foreground))" strokeWidth={2} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-xs text-muted-foreground py-10 text-center">No data yet</p>
                )}
              </div>

              {/* Event Breakdown */}
              <div className="bg-card border border-border/50 rounded-2xl p-4">
                <h3 className="text-sm font-bold text-foreground mb-3 tracking-tight">Event Breakdown</h3>
                {eventTypeData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={180}>
                    <BarChart data={eventTypeData} layout="vertical">
                      <XAxis type="number" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                      <YAxis dataKey="name" type="category" tick={{ fontSize: 9 }} width={90} stroke="hsl(var(--muted-foreground))" />
                      <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 12, fontSize: 12 }} />
                      <Bar dataKey="count" fill="hsl(var(--foreground))" radius={[0, 6, 6, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-xs text-muted-foreground py-10 text-center">No data yet</p>
                )}
              </div>
            </div>

            {/* Funnel + Devices */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              {/* Conversion Funnel */}
              <div className="md:col-span-2 bg-card border border-border/50 rounded-2xl p-4">
                <h3 className="text-sm font-bold text-foreground mb-3 tracking-tight">Conversion Funnel</h3>
                <div className="space-y-2">
                  {funnelData.map((step, i) => {
                    const maxCount = Math.max(...funnelData.map((s) => s.count), 1);
                    const pct = (step.count / maxCount) * 100;
                    const dropoff = i > 0 && funnelData[i - 1].count > 0
                      ? ((1 - step.count / funnelData[i - 1].count) * 100).toFixed(0)
                      : null;
                    return (
                      <div key={step.step}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-medium text-foreground">{step.step}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-foreground">{step.count}</span>
                            {dropoff && Number(dropoff) > 0 && (
                              <span className="text-[10px] text-destructive font-medium">-{dropoff}%</span>
                            )}
                          </div>
                        </div>
                        <div className="h-2 bg-muted/50 rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${pct}%` }}
                            transition={{ duration: 0.6, delay: i * 0.1 }}
                            className="h-full rounded-full"
                            style={{ backgroundColor: COLORS[i % COLORS.length] }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Device Split */}
              <div className="bg-card border border-border/50 rounded-2xl p-4">
                <h3 className="text-sm font-bold text-foreground mb-3 tracking-tight">Devices</h3>
                {deviceData.length > 0 ? (
                  <div className="flex flex-col items-center">
                    <ResponsiveContainer width="100%" height={120}>
                      <PieChart>
                        <Pie data={deviceData} dataKey="value" cx="50%" cy="50%" outerRadius={50} innerRadius={30}>
                          {deviceData.map((_, i) => (
                            <Cell key={i} fill={COLORS[i % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 12, fontSize: 12 }} />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="flex gap-3 mt-2">
                      {deviceData.map((d, i) => (
                        <div key={d.name} className="flex items-center gap-1.5">
                          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                          <span className="text-[10px] text-muted-foreground font-medium capitalize">{d.name}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground py-10 text-center">No data yet</p>
                )}
              </div>
            </div>

            {/* PM Insights */}
            <div className="bg-card border border-border/50 rounded-2xl p-4 mb-6">
              <h3 className="text-sm font-bold text-foreground mb-3 tracking-tight flex items-center gap-2">
                <Lightbulb size={14} className="text-accent" /> PM Insights & Recommendations
              </h3>
              <div className="space-y-3">
                {insights.map((insight, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className={`flex gap-3 p-3 rounded-xl border ${
                      insight.type === "warning"
                        ? "bg-destructive/5 border-destructive/20"
                        : insight.type === "success"
                        ? "bg-accent/5 border-accent/20"
                        : "bg-muted/30 border-border/50"
                    }`}
                  >
                    <insight.icon size={16} className={
                      insight.type === "warning" ? "text-destructive mt-0.5" :
                      insight.type === "success" ? "text-accent mt-0.5" :
                      "text-muted-foreground mt-0.5"
                    } />
                    <div>
                      <p className="text-xs font-bold text-foreground">{insight.title}</p>
                      <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">{insight.text}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Analytics;
