import { CheckCircle } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { motion } from "framer-motion";

interface OrderCompleteScreenProps {
  onDone: () => void;
}

const OrderCompleteScreen = ({ onDone }: OrderCompleteScreenProps) => {
  const { total, clearCart } = useCart();
  const orderId = `#${Math.floor(100000 + Math.random() * 900000)}`;
  const today = new Date();
  const dateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")} ${String(today.getHours()).padStart(2, "0")}:${String(today.getMinutes()).padStart(2, "0")}`;
  const savedMinutes = Math.floor(12 + Math.random() * 15);
  const savedMoney = (total * 0.08).toFixed(2);

  const handleDone = () => {
    clearCart();
    onDone();
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-5 pb-24 pt-14">
      <motion.div
        initial={{ scale: 0, rotate: -180 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.2 }}
        className="mb-6"
      >
        <CheckCircle size={80} className="text-success" strokeWidth={1.5} />
      </motion.div>

      <motion.h1
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="text-2xl font-bold text-foreground mb-1"
      >
        Order Complete!
      </motion.h1>
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="text-muted-foreground text-sm italic mb-6"
      >
        Today you saved {savedMinutes} min in line
      </motion.p>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.7 }}
        className="text-center mb-6"
      >
        <p className="font-semibold text-foreground">Order {orderId}</p>
        <p className="text-xs text-muted-foreground">{dateStr}</p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.8, type: "spring" }}
        className="w-48 h-48 bg-card border-2 border-border rounded-2xl flex items-center justify-center mb-4 shadow-card"
      >
        <div className="grid grid-cols-7 gap-0.5">
          {Array.from({ length: 49 }).map((_, i) => (
            <div
              key={i}
              className={`w-4 h-4 rounded-[2px] ${
                Math.random() > 0.35 ? "bg-foreground" : "bg-transparent"
              }`}
            />
          ))}
        </div>
      </motion.div>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
        className="font-bold text-sm text-foreground mb-6"
      >
        Show this QR at the exit
      </motion.p>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.1 }}
        className="text-primary font-bold text-lg mb-8"
      >
        Today you saved ${savedMoney}
      </motion.p>

      <motion.button
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.2 }}
        whileTap={{ scale: 0.97 }}
        onClick={handleDone}
        className="w-full max-w-[280px] bg-primary text-primary-foreground rounded-2xl py-4 font-bold text-base"
      >
        Done
      </motion.button>
    </div>
  );
};

export default OrderCompleteScreen;
