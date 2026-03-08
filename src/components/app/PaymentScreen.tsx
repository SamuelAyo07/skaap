import { useState } from "react";
import { CreditCard, Apple, ArrowLeft, Lock } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { motion } from "framer-motion";

interface PaymentScreenProps {
  onComplete: () => void;
  onBack: () => void;
}

const PaymentScreen = ({ onComplete, onBack }: PaymentScreenProps) => {
  const { total } = useCart();
  const tax = total * 0.11;
  const grandTotal = total + tax;
  const [processing, setProcessing] = useState(false);

  const handlePay = () => {
    setProcessing(true);
    setTimeout(() => {
      setProcessing(false);
      onComplete();
    }, 1500);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="px-4 pt-12 pb-20 min-h-screen bg-background"
    >
      <button onClick={onBack} className="flex items-center gap-1 text-accent font-medium mb-5">
        <ArrowLeft size={15} />
        <span className="text-[13px]">Back</span>
      </button>

      <h1 className="text-2xl font-bold text-foreground tracking-tight mb-6">Payment</h1>

      {/* Total */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.06, type: "spring", stiffness: 200, damping: 24 }}
        className="bg-foreground rounded-2xl p-5 mb-6 text-center"
      >
        <p className="text-[10px] text-background/40 font-medium uppercase tracking-widest mb-1.5">Total</p>
        <p className="text-3xl font-black text-background tabular-nums tracking-tight">${grandTotal.toFixed(2)}</p>
      </motion.div>

      {/* Quick pay */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, type: "spring", stiffness: 200, damping: 24 }}
        className="flex gap-2 mb-6"
      >
        <motion.button
          whileTap={{ scale: 0.95 }}
          className="flex-1 bg-foreground text-background rounded-xl py-3 flex items-center justify-center gap-2 font-semibold text-[13px]"
        >
          <Apple size={16} /> Apple Pay
        </motion.button>
        <motion.button
          whileTap={{ scale: 0.95 }}
          className="flex-1 bg-foreground text-background rounded-xl py-3 flex items-center justify-center gap-2 font-semibold text-[13px]"
        >
          G Pay
        </motion.button>
      </motion.div>

      {/* Divider */}
      <div className="flex items-center gap-3 mb-6">
        <div className="flex-1 h-px bg-border" />
        <span className="text-[11px] text-muted-foreground font-medium">or pay with card</span>
        <div className="flex-1 h-px bg-border" />
      </div>

      {/* Card form */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.16, type: "spring", stiffness: 200, damping: 24 }}
        className="space-y-2.5 mb-6"
      >
        <div>
          <label className="text-[11px] font-medium text-muted-foreground mb-1 block">Card Number</label>
          <div className="relative">
            <input
              type="text"
              placeholder="4242 4242 4242 4242"
              className="w-full bg-muted/50 border border-border rounded-xl py-3 pl-3.5 pr-10 text-[13px] outline-none focus:ring-2 focus:ring-foreground/10 transition-shadow"
            />
            <CreditCard size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          </div>
        </div>
        <div className="flex gap-2">
          <div className="flex-1">
            <label className="text-[11px] font-medium text-muted-foreground mb-1 block">Expiry</label>
            <input
              type="text"
              placeholder="MM/YY"
              className="w-full bg-muted/50 border border-border rounded-xl py-3 px-3.5 text-[13px] outline-none focus:ring-2 focus:ring-foreground/10 transition-shadow"
            />
          </div>
          <div className="flex-1">
            <label className="text-[11px] font-medium text-muted-foreground mb-1 block">CVV</label>
            <input
              type="text"
              placeholder="123"
              className="w-full bg-muted/50 border border-border rounded-xl py-3 px-3.5 text-[13px] outline-none focus:ring-2 focus:ring-foreground/10 transition-shadow"
            />
          </div>
        </div>
      </motion.div>

      {/* Pay button */}
      <motion.button
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.22 }}
        whileTap={{ scale: 0.97 }}
        onClick={handlePay}
        disabled={processing}
        className="w-full bg-foreground text-background rounded-full py-3.5 font-bold text-[15px] disabled:opacity-60 flex items-center justify-center gap-2"
      >
        {processing ? (
          <motion.span
            animate={{ opacity: [1, 0.4, 1] }}
            transition={{ duration: 1, repeat: Infinity }}
            className="tracking-tight"
          >
            Processing…
          </motion.span>
        ) : (
          <>
            <Lock size={13} />
            <span className="tracking-tight">Complete Purchase</span>
          </>
        )}
      </motion.button>

      <p className="text-[9px] text-muted-foreground text-center mt-2.5 flex items-center justify-center gap-1">
        <Lock size={8} /> Secured with 256-bit encryption
      </p>
    </motion.div>
  );
};

export default PaymentScreen;
