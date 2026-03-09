import { useState, useEffect } from "react";
import { CartProvider } from "@/context/CartContext";
import BottomNav from "@/components/app/BottomNav";
import HomeScreen from "@/components/app/HomeScreen";
import ScanScreen from "@/components/app/ScanScreen";
import BagScreen from "@/components/app/BagScreen";
import PaymentScreen from "@/components/app/PaymentScreen";
import OrderCompleteScreen from "@/components/app/OrderCompleteScreen";
import ProfileScreen from "@/components/app/ProfileScreen";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ChevronLeft } from "lucide-react";
import skaapIcon from "@/assets/skaap-icon.png";

const pageVariants = {
  initial: { opacity: 0, x: 30 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -30 },
};

const AppPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const directScan = searchParams.get("mode") === "scan";
  const [activeTab, setActiveTab] = useState(directScan ? "scan" : "home");
  const [screen, setScreen] = useState(directScan ? "scan" : "home");
  const [splashDone, setSplashDone] = useState(directScan); // skip splash for direct scan

  useEffect(() => {
    if (directScan) return; // no splash for direct scan
    const timer = setTimeout(() => setSplashDone(true), 1600);
    return () => clearTimeout(timer);
  }, []);

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    if (tab === "home") setScreen("home");
    else if (tab === "scan") setScreen("scan");
    else if (tab === "bag") setScreen("bag");
    else if (tab === "profile") setScreen("profile");
  };

  return (
    <CartProvider>
      <div className="min-h-screen flex justify-center bg-background md:bg-foreground">
        <div className="w-full md:max-w-[390px] min-h-screen relative bg-background md:shadow-elevated overflow-hidden">
          {splashDone && screen === "home" && (
            <button
              onClick={() => navigate("/")}
              className="absolute top-3 left-3 z-[90] inline-flex items-center gap-1 rounded-full border border-border bg-background/90 px-2.5 py-1 text-[11px] font-medium text-muted-foreground backdrop-blur"
            >
              <ChevronLeft size={12} /> Back to website
            </button>
          )}
          <AnimatePresence mode="wait">
            {!splashDone ? (
              <motion.div
                key="splash"
                initial={{ opacity: 1 }}
                exit={{ opacity: 0, scale: 1.1 }}
                transition={{ duration: 0.4, ease: "easeInOut" }}
                className="fixed inset-0 md:max-w-[390px] mx-auto bg-foreground flex flex-col items-center justify-center z-[100]"
              >
                <motion.img
                  src={skaapIcon}
                  alt="SKAAP"
                  className="w-20 h-20 rounded-3xl"
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.1, type: "spring", stiffness: 200, damping: 15 }}
                />
                <motion.p
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="text-background font-bold text-2xl tracking-tight mt-4"
                >
                  SKAAP
                </motion.p>
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 0.4 }}
                  transition={{ delay: 0.7 }}
                  className="text-background text-xs mt-1 font-medium"
                >
                  Skip every line
                </motion.p>
                <motion.div
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ delay: 0.5, duration: 1, ease: "easeInOut" }}
                  className="w-12 h-[2px] bg-background/20 rounded-full mt-6 origin-left"
                />
              </motion.div>
            ) : (
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
                {screen === "profile" && <ProfileScreen />}
              </motion.div>
            )}
          </AnimatePresence>

          {splashDone && screen !== "complete" && screen !== "payment" && (
            <BottomNav activeTab={activeTab} onTabChange={handleTabChange} />
          )}
        </div>
      </div>
    </CartProvider>
  );
};

export default AppPage;
