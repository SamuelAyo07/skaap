import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Route, Routes, useLocation } from "react-router-dom";
import { AuthProvider } from "@/context/AuthContext";
import { SubscriptionProvider } from "@/context/SubscriptionContext";
import { UpgradeSheet } from "@/components/scan/UpgradeSheet";
import InstallBanner from "@/components/InstallBanner";
import AutoUpdater from "@/components/AutoUpdater";
import Index from "./pages/Index";
import AppPage from "./pages/AppPage";
import SkaapScan from "./pages/SkaapScan";
import NotFound from "./pages/NotFound";
import Unsubscribe from "./pages/Unsubscribe";

const queryClient = new QueryClient();

function isStandaloneApp() {
  if (typeof window === "undefined") return false;

  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

const StandaloneLaunchRedirect = () => {
  const location = useLocation();
  const shouldOpenFoodIntelligence =
    isStandaloneApp() && ["/", "/index", "/app"].includes(location.pathname);

  return shouldOpenFoodIntelligence ? <Navigate to="/scan" replace /> : null;
};

const AppRoutes = () => (
  <>
    <StandaloneLaunchRedirect />
    <Routes>
      <Route path="/" element={<Index />} />
      <Route path="/index" element={<Index />} />
      <Route path="/app" element={<AppPage />} />
      <Route path="/scan" element={<SkaapScan />} />
      <Route path="/unsubscribe" element={<Unsubscribe />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  </>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <SubscriptionProvider>
          <Toaster />
          <Sonner />
          <UpgradeSheet />
          <InstallBanner />
          <AutoUpdater />
          <BrowserRouter>
            <AppRoutes />
          </BrowserRouter>
        </SubscriptionProvider>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
