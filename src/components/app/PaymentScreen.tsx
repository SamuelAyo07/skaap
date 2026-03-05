import { useState } from "react";
import { CreditCard, Apple, ArrowLeft } from "lucide-react";
import { useCart } from "@/context/CartContext";

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
    <div className="px-5 pt-14 pb-24">
      <button onClick={onBack} className="flex items-center gap-1 text-muted-foreground mb-4">
        <ArrowLeft size={18} />
        <span className="text-sm">Back</span>
      </button>

      <h1 className="text-2xl font-bold text-foreground mb-6">Payment</h1>

      <div className="bg-muted rounded-2xl p-5 mb-6 text-center">
        <p className="text-sm text-muted-foreground">Total Amount</p>
        <p className="text-3xl font-bold text-foreground mt-1">${grandTotal.toFixed(2)}</p>
      </div>

      {/* Card form */}
      <div className="space-y-3 mb-6">
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1 block">Card Number</label>
          <div className="relative">
            <input
              type="text"
              placeholder="4242 4242 4242 4242"
              className="w-full bg-card border border-border rounded-xl py-3 pl-4 pr-10 text-sm outline-none focus:ring-2 focus:ring-primary/30"
            />
            <CreditCard size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          </div>
        </div>
        <div className="flex gap-3">
          <div className="flex-1">
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Expiry</label>
            <input
              type="text"
              placeholder="MM/YY"
              className="w-full bg-card border border-border rounded-xl py-3 px-4 text-sm outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
          <div className="flex-1">
            <label className="text-xs font-medium text-muted-foreground mb-1 block">CVV</label>
            <input
              type="text"
              placeholder="123"
              className="w-full bg-card border border-border rounded-xl py-3 px-4 text-sm outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
        </div>
      </div>

      <div className="flex gap-3 mb-6">
        <button className="flex-1 bg-secondary text-secondary-foreground rounded-xl py-3 flex items-center justify-center gap-2 font-medium text-sm active:scale-95 transition-transform">
          <Apple size={18} /> Apple Pay
        </button>
        <button className="flex-1 bg-secondary text-secondary-foreground rounded-xl py-3 flex items-center justify-center gap-2 font-medium text-sm active:scale-95 transition-transform">
          G Pay
        </button>
      </div>

      <button
        onClick={handlePay}
        disabled={processing}
        className="w-full bg-primary text-primary-foreground rounded-2xl py-4 font-bold text-base active:scale-[0.98] transition-transform disabled:opacity-70"
      >
        {processing ? "Processing..." : "Complete Purchase"}
      </button>
    </div>
  );
};

export default PaymentScreen;
