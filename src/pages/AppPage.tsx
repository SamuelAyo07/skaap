import { useState } from "react";
import { CartProvider } from "@/context/CartContext";
import BottomNav from "@/components/app/BottomNav";
import HomeScreen from "@/components/app/HomeScreen";
import ScanScreen from "@/components/app/ScanScreen";
import BagScreen from "@/components/app/BagScreen";
import PaymentScreen from "@/components/app/PaymentScreen";
import OrderCompleteScreen from "@/components/app/OrderCompleteScreen";
import ProfileScreen from "@/components/app/ProfileScreen";
import { motion, AnimatePresence } from "framer-motion";

const pageVariants = {
  initial: { opacity: 0, x: 30 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -30 },
};

const AppPage = () => {
  const [activeTab, setActiveTab] = useState("home");
  const [screen, setScreen] = useState("home");

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    if (tab === "home") setScreen("home");
    else if (tab === "scan") setScreen("scan");
    else if (tab === "bag") setScreen("bag");
    else if (tab === "profile") setScreen("home");
  };

  return (
    <CartProvider>
      <div className="min-h-screen bg-background flex justify-center">
        <div className="w-full max-w-[390px] min-h-screen relative bg-background shadow-elevated overflow-hidden">
          <AnimatePresence mode="wait">
            <motion.div
              key={screen}
              variants={pageVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{ duration: 0.25, ease: "easeOut" }}
              className="min-h-screen"
            >
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
            </motion.div>
          </AnimatePresence>

          {screen !== "complete" && screen !== "payment" && (
            <BottomNav activeTab={activeTab} onTabChange={handleTabChange} />
          )}
        </div>
      </div>
    </CartProvider>
  );
};

export default AppPage;
