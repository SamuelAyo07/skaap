import { CheckCircle, Clock, DollarSign } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { motion } from "framer-motion";

interface OrderCompleteScreenProps {
  onDone: () => void;
}

const OrderCompleteScreen = ({ onDone }: OrderCompleteScreenProps) => {
  const { total, clearCart } = useCart();
  const orderId = `#${Math.floor(100000 + Math.random() * 900000)}`;
  const today = new Date();
  const dateStr = today.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  const timeStr = today.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
  const savedMinutes = Math.floor(12 + Math.random() * 15);
  const savedMoney = (total * 0.08).toFixed(2);

  const handleDone = () => {
    clearCart();
    onDone();
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-5 pb-20 pt-12 bg-background">
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 200, damping: 14, delay: 0.2 }}
        className="w-16 h-16 rounded-full bg-foreground flex items-center justify-center mb-5"
      >
        <CheckCircle size={30} className="text-background" strokeWidth={2} />
      </motion.div>

      <motion.h1
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.45 }}
        className="text-2xl font-black text-foreground tracking-tight mb-1"
      >
        You're all set
      </motion.h1>
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.55 }}
        className="text-muted-foreground text-xs mb-6"
      >
        Order {orderId} · {dateStr}, {timeStr}
      </motion.p>

      {/* QR Code */}
      <motion.div
        initial={{ opacity: 0, scale: 0.85 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.65, type: "spring", stiffness: 200, damping: 20 }}
        className="w-36 h-36 bg-foreground rounded-2xl flex items-center justify-center mb-2.5 shadow-hero"
      >
        <div className="grid grid-cols-7 gap-[2.5px] p-3">
          {Array.from({ length: 49 }).map((_, i) => (
            <div
              key={i}
              className={`w-3 h-3 rounded-[2px] ${
                Math.random() > 0.35 ? "bg-background" : "bg-transparent"
              }`}
            />
          ))}
        </div>
      </motion.div>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.85 }}
        className="font-semibold text-[10px] text-muted-foreground mb-6 uppercase tracking-widest"
      >
        Show at exit
      </motion.p>

      {/* Stats */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.95 }}
        className="flex gap-2.5 mb-8 w-full max-w-[260px]"
      >
        <div className="flex-1 bg-muted/50 rounded-xl p-3 text-center">
          <div className="flex items-center justify-center gap-1 mb-0.5">
            <Clock size={11} className="text-muted-foreground" />
          </div>
          <p className="text-base font-black text-foreground tabular-nums">{savedMinutes} min</p>
          <p className="text-[9px] text-muted-foreground font-medium">Time saved</p>
        </div>
        <div className="flex-1 bg-muted/50 rounded-xl p-3 text-center">
          <div className="flex items-center justify-center gap-1 mb-0.5">
            <DollarSign size={11} className="text-muted-foreground" />
          </div>
          <p className="text-base font-black text-foreground tabular-nums">${savedMoney}</p>
          <p className="text-[9px] text-muted-foreground font-medium">Money saved</p>
        </div>
      </motion.div>

      {/* Done button */}
      <motion.button
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.05 }}
        whileTap={{ scale: 0.97 }}
        onClick={handleDone}
        className="w-full max-w-[260px] bg-foreground text-background rounded-full py-3.5 font-bold text-[15px] tracking-tight"
      >
        Done
      </motion.button>
    </div>
  );
};

export default OrderCompleteScreen;
