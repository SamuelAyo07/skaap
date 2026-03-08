import { useState } from "react";
import { CreditCard, Apple, ArrowLeft, Lock, Shield } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { motion } from "framer-motion";

interface PaymentScreenProps {
  onComplete: () => void;
  onBack: () => void;
}

const PaymentScreen = ({ onComplete, onBack }: PaymentScreenProps) => {
  const { items, total } = useCart();
  const tax = total * 0.11;
  const grandTotal = total + tax;
  const [processing, setProcessing] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState<"apple" | "google" | "card">("apple");

  const handlePay = () => {
    setProcessing(true);
    setTimeout(() => {
      setProcessing(false);
      onComplete();
    }, 1800);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-col min-h-screen bg-background pt-10"
    >
      <div className="px-4 pt-12 pb-4">
        <button onClick={onBack} className="flex items-center gap-1 text-accent font-medium mb-4">
          <ArrowLeft size={15} />
          <span className="text-[13px]">Back</span>
        </button>
        <h1 className="text-2xl font-bold text-foreground tracking-tight">Checkout</h1>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-32">
        {/* Items summary */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.04 }}
          className="mb-4"
        >
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest mb-2">
            {items.length} item{items.length !== 1 ? "s" : ""}
          </p>
          <div className="space-y-1.5">
            {items.map((item) => (
              <div key={item.product.id} className="flex items-center gap-3 bg-muted/50 rounded-xl p-2.5">
                <img
                  src={item.product.image}
                  alt={item.product.name}
                  className="w-10 h-10 rounded-lg object-contain bg-muted/40 p-0.5"
                  onError={(e) => { (e.target as HTMLImageElement).src = '/placeholder.svg'; }}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-semibold text-foreground truncate">{item.product.name}</p>
                  <p className="text-[11px] text-muted-foreground">
                    {item.quantity > 1 ? `${item.quantity} × ` : ""}${item.product.price.toFixed(2)}
                  </p>
                </div>
                <p className="text-[13px] font-bold text-foreground tabular-nums">
                  ${(item.product.price * item.quantity).toFixed(2)}
                </p>
              </div>
            ))}
          </div>

          {/* Totals */}
          <div className="mt-3 p-3 bg-foreground/[0.02] rounded-xl space-y-1.5">
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Subtotal</span>
              <span className="font-medium text-foreground tabular-nums">${total.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Tax</span>
              <span className="font-medium text-foreground tabular-nums">${tax.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm font-bold pt-2 border-t border-border/50">
              <span className="text-foreground">Total</span>
              <span className="text-foreground tabular-nums">${grandTotal.toFixed(2)}</span>
            </div>
          </div>
        </motion.div>

        {/* Payment method selection */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest mb-2">
            Pay with
          </p>
          <div className="space-y-1.5 mb-5">
            <button
              onClick={() => setSelectedMethod("apple")}
              className={`w-full flex items-center gap-3 rounded-xl p-3.5 text-left transition-all border ${
                selectedMethod === "apple"
                  ? "border-foreground bg-foreground/[0.03]"
                  : "border-border/50 bg-muted/30"
              }`}
            >
              <div className="w-10 h-10 rounded-lg bg-foreground flex items-center justify-center flex-shrink-0">
                <Apple size={20} className="text-background" />
              </div>
              <div className="flex-1">
                <p className="text-[13px] font-semibold text-foreground">Apple Pay</p>
                <p className="text-[11px] text-muted-foreground">Instant checkout</p>
              </div>
              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                selectedMethod === "apple" ? "border-foreground" : "border-border"
              }`}>
                {selectedMethod === "apple" && <div className="w-2.5 h-2.5 rounded-full bg-foreground" />}
              </div>
            </button>

            <button
              onClick={() => setSelectedMethod("google")}
              className={`w-full flex items-center gap-3 rounded-xl p-3.5 text-left transition-all border ${
                selectedMethod === "google"
                  ? "border-foreground bg-foreground/[0.03]"
                  : "border-border/50 bg-muted/30"
              }`}
            >
              <div className="w-10 h-10 rounded-lg bg-foreground flex items-center justify-center flex-shrink-0">
                <span className="text-background font-bold text-sm">G</span>
              </div>
              <div className="flex-1">
                <p className="text-[13px] font-semibold text-foreground">Google Pay</p>
                <p className="text-[11px] text-muted-foreground">Quick & secure</p>
              </div>
              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                selectedMethod === "google" ? "border-foreground" : "border-border"
              }`}>
                {selectedMethod === "google" && <div className="w-2.5 h-2.5 rounded-full bg-foreground" />}
              </div>
            </button>

            <button
              onClick={() => setSelectedMethod("card")}
              className={`w-full flex items-center gap-3 rounded-xl p-3.5 text-left transition-all border ${
                selectedMethod === "card"
                  ? "border-foreground bg-foreground/[0.03]"
                  : "border-border/50 bg-muted/30"
              }`}
            >
              <div className="w-10 h-10 rounded-lg bg-foreground flex items-center justify-center flex-shrink-0">
                <CreditCard size={18} className="text-background" />
              </div>
              <div className="flex-1">
                <p className="text-[13px] font-semibold text-foreground">Credit / Debit Card</p>
                <p className="text-[11px] text-muted-foreground">Visa, Mastercard, Amex</p>
              </div>
              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                selectedMethod === "card" ? "border-foreground" : "border-border"
              }`}>
                {selectedMethod === "card" && <div className="w-2.5 h-2.5 rounded-full bg-foreground" />}
              </div>
            </button>
          </div>

          {/* Card form (only if card selected) */}
          {selectedMethod === "card" && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              className="overflow-hidden space-y-2.5 mb-5"
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
          )}
        </motion.div>
      </div>

      {/* Fixed bottom pay button */}
      <div className="fixed bottom-0 left-0 right-0 px-4 pb-6 pt-3 bg-background/80 backdrop-blur-xl border-t border-border/30">
        <div className="max-w-[390px] mx-auto">
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={handlePay}
            disabled={processing}
            className="w-full bg-foreground text-background rounded-full py-4 font-bold text-[15px] disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {processing ? (
              <motion.span
                animate={{ opacity: [1, 0.4, 1] }}
                transition={{ duration: 1, repeat: Infinity }}
                className="tracking-tight"
              >
                Processing payment…
              </motion.span>
            ) : (
              <>
                <Lock size={13} />
                <span className="tracking-tight">Pay ${grandTotal.toFixed(2)}</span>
              </>
            )}
          </motion.button>
          <p className="text-[9px] text-muted-foreground text-center mt-2 flex items-center justify-center gap-1">
            <Shield size={8} /> Demo mode · No real charges
          </p>
        </div>
      </div>
    </motion.div>
  );
};

export default PaymentScreen;
