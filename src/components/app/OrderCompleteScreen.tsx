import { CheckCircle } from "lucide-react";
import { useCart } from "@/context/CartContext";

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
      {/* Checkmark */}
      <div className="animate-checkmark mb-6">
        <CheckCircle size={80} className="text-success" strokeWidth={1.5} />
      </div>

      <h1 className="text-2xl font-bold text-foreground mb-1 fade-in">Order Complete!</h1>
      <p className="text-muted-foreground text-sm italic mb-6 fade-in" style={{ animationDelay: "0.2s" }}>
        Today you saved {savedMinutes} min in line
      </p>

      <div className="text-center mb-6 fade-in" style={{ animationDelay: "0.3s" }}>
        <p className="font-semibold text-foreground">Order {orderId}</p>
        <p className="text-xs text-muted-foreground">{dateStr}</p>
      </div>

      {/* QR Code placeholder */}
      <div className="w-48 h-48 bg-card border-2 border-border rounded-2xl flex items-center justify-center mb-4 fade-in shadow-card" style={{ animationDelay: "0.4s" }}>
        <div className="grid grid-cols-5 gap-1">
          {Array.from({ length: 25 }).map((_, i) => (
            <div
              key={i}
              className={`w-6 h-6 rounded-sm ${
                Math.random() > 0.4 ? "bg-foreground" : "bg-transparent"
              }`}
            />
          ))}
        </div>
      </div>

      <p className="font-bold text-sm text-foreground mb-6 fade-in" style={{ animationDelay: "0.5s" }}>
        Show this QR at the exit
      </p>

      <p className="text-primary font-bold text-lg mb-8 fade-in" style={{ animationDelay: "0.6s" }}>
        Today you saved ${savedMoney}
      </p>

      <button
        onClick={handleDone}
        className="w-full max-w-[280px] bg-primary text-primary-foreground rounded-2xl py-4 font-bold text-base active:scale-[0.98] transition-transform fade-in"
        style={{ animationDelay: "0.7s" }}
      >
        Done
      </button>
    </div>
  );
};

export default OrderCompleteScreen;
