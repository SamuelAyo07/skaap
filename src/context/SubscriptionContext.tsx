import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./AuthContext";
import { toast } from "sonner";

const celebratePlus = (userId: string) => {
  const key = `skaap_plus_welcomed_${userId}`;
  if (typeof window === "undefined" || localStorage.getItem(key)) return;
  localStorage.setItem(key, "1");
  setTimeout(() => {
    toast.success("✦ Welcome to SKAAP Plus", {
      description: "Every feature unlocked — on us. Thank you for being part of Skaap.",
      duration: 8000,
    });
  }, 800);
};

interface SubscriptionState {
  plan: "free" | "plus";
  isPlus: boolean;
  status: string;
  trialActive: boolean;
  trialDaysRemaining: number;
  loading: boolean;
  showUpgradeSheet: boolean;
  upgradeFeature: string;
}

interface SubscriptionContextType extends SubscriptionState {
  openUpgrade: (featureName?: string) => void;
  closeUpgrade: () => void;
  refresh: () => Promise<void>;
}

const SubscriptionContext = createContext<SubscriptionContextType>({
  plan: "free", isPlus: false, status: "active", trialActive: false,
  trialDaysRemaining: 0, loading: true, showUpgradeSheet: false,
  upgradeFeature: "",
  openUpgrade: () => {}, closeUpgrade: () => {}, refresh: async () => {},
});

export const useSubscription = () => useContext(SubscriptionContext);

export function SubscriptionProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [state, setState] = useState<SubscriptionState>({
    plan: "free", isPlus: false, status: "active", trialActive: false,
    trialDaysRemaining: 0, loading: true, showUpgradeSheet: false,
    upgradeFeature: "",
  });

  const fetchSubscription = useCallback(async () => {
    if (!user) {
      setState(s => ({ ...s, plan: "free", isPlus: false, loading: false }));
      return;
    }
    try {
      // Check via edge function which queries Stripe directly
      const { data, error } = await supabase.functions.invoke("check-subscription");
      if (!error && data?.subscribed) {
        const trialEnd = data.trial_end ? new Date(data.trial_end) : null;
        const trialActive = data.status === "trialing";
        const trialDays = trialEnd ? Math.max(0, Math.ceil((trialEnd.getTime() - Date.now()) / 86400000)) : 0;
        setState(s => ({
          ...s, plan: "plus", isPlus: true, status: data.status || "active",
          trialActive, trialDaysRemaining: trialDays, loading: false,
        }));
        celebratePlus(user.id);
        return;
      }

      // Fallback: check Supabase table
      const { data: subData } = await supabase
        .from("user_subscriptions")
        .select("plan, status, trial_ends_at, current_period_end")
        .eq("user_id", user.id)
        .maybeSingle();

      if (subData && (subData.status === "active" || subData.status === "trialing") && subData.plan === "plus") {
        const trialActive = subData.status === "trialing";
        const trialDays = subData.trial_ends_at
          ? Math.max(0, Math.ceil((new Date(subData.trial_ends_at).getTime() - Date.now()) / 86400000))
          : 0;
        setState(s => ({
          ...s, plan: "plus", isPlus: true, status: subData.status!,
          trialActive, trialDaysRemaining: trialDays, loading: false,
        }));
        celebratePlus(user.id);
      } else {
        setState(s => ({ ...s, plan: "free", isPlus: false, loading: false }));
      }
    } catch {
      setState(s => ({ ...s, loading: false }));
    }
  }, [user]);

  useEffect(() => { fetchSubscription(); }, [fetchSubscription]);

  // Refresh on window focus
  useEffect(() => {
    const handler = () => fetchSubscription();
    window.addEventListener("focus", handler);
    return () => window.removeEventListener("focus", handler);
  }, [fetchSubscription]);

  const openUpgrade = (featureName = "") => {
    setState(s => ({ ...s, showUpgradeSheet: true, upgradeFeature: featureName }));
  };

  const closeUpgrade = () => {
    setState(s => ({ ...s, showUpgradeSheet: false, upgradeFeature: "" }));
  };

  return (
    <SubscriptionContext.Provider value={{
      ...state,
      openUpgrade,
      closeUpgrade,
      refresh: fetchSubscription,
    }}>
      {children}
    </SubscriptionContext.Provider>
  );
}
