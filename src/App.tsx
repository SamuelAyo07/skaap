import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { AuthProvider } from "@/context/AuthContext";
import { SubscriptionProvider } from "@/context/SubscriptionContext";
import { UpgradeSheet } from "@/components/scan/UpgradeSheet";

import AutoUpdater from "@/components/AutoUpdater";
import { OfflineBanner } from "@/components/OfflineBanner";
import Index from "./pages/Index";
import AppPage from "./pages/AppPage";
import SkaapScan from "./pages/SkaapScan";
import NotFound from "./pages/NotFound";
import Unsubscribe from "./pages/Unsubscribe";
import Privacy from "./pages/Privacy";

const queryClient = new QueryClient();

const AppRoutes = () => (
  <Routes>
    <Route path="/" element={<Index />} />
    <Route path="/index" element={<Index />} />
    <Route path="/app" element={<AppPage />} />
    <Route path="/scan" element={<SkaapScan />} />
    <Route path="/unsubscribe" element={<Unsubscribe />} />
    <Route path="/privacy" element={<Privacy />} />
    <Route path="*" element={<NotFound />} />
  </Routes>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <SubscriptionProvider>
          <Toaster />
          <Sonner />
          <OfflineBanner />
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
