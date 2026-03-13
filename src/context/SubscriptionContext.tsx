import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./AuthContext";

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
      const { data } = await supabase
        .from("user_subscriptions")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (data && (data.status === "active" || data.status === "trialing") && data.plan === "plus") {
        const trialActive = data.status === "trialing";
        const trialDays = data.trial_ends_at
          ? Math.max(0, Math.ceil((new Date(data.trial_ends_at).getTime() - Date.now()) / 86400000))
          : 0;
        setState(s => ({
          ...s, plan: "plus", isPlus: true, status: data.status!,
          trialActive, trialDaysRemaining: trialDays, loading: false,
        }));
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
