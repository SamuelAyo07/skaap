import { useState } from "react";
import { CartProvider } from "@/context/CartContext";
import BottomNav from "@/components/app/BottomNav";
import HomeScreen from "@/components/app/HomeScreen";
import ScanScreen from "@/components/app/ScanScreen";
import BagScreen from "@/components/app/BagScreen";
import PaymentScreen from "@/components/app/PaymentScreen";
import OrderCompleteScreen from "@/components/app/OrderCompleteScreen";

const AppPage = () => {
  const [activeTab, setActiveTab] = useState("home");
  const [screen, setScreen] = useState("home"); // home | scan | bag | payment | complete

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    if (tab === "home") setScreen("home");
    else if (tab === "scan") setScreen("scan");
    else if (tab === "bag") setScreen("bag");
    else if (tab === "profile") setScreen("home"); // placeholder
  };

  return (
    <CartProvider>
      <div className="min-h-screen bg-background flex justify-center">
        <div className="w-full max-w-[390px] min-h-screen relative bg-background shadow-elevated">
          {screen === "home" && (
            <HomeScreen onSelectStore={() => { setScreen("scan"); setActiveTab("scan"); }} />
          )}
          {screen === "scan" && (
            <ScanScreen onOpenBag={() => { setScreen("bag"); setActiveTab("bag"); }} />
          )}
          {screen === "bag" && (
            <BagScreen onPayNow={() => setScreen("payment")} />
          )}
          {screen === "payment" && (
            <PaymentScreen
              onComplete={() => setScreen("complete")}
              onBack={() => setScreen("bag")}
            />
          )}
          {screen === "complete" && (
            <OrderCompleteScreen onDone={() => { setScreen("home"); setActiveTab("home"); }} />
          )}

          {screen !== "complete" && screen !== "payment" && (
            <BottomNav activeTab={activeTab} onTabChange={handleTabChange} />
          )}
        </div>
      </div>
    </CartProvider>
  );
};

export default AppPage;
