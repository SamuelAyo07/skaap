import { Trash2 } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { useState } from "react";

interface BagScreenProps {
  onPayNow: () => void;
}

const BagScreen = ({ onPayNow }: BagScreenProps) => {
  const { items, removeItem, total } = useCart();
  const [swipedId, setSwipedId] = useState<string | null>(null);

  const tax = total * 0.11;
  const grandTotal = total + tax;

  return (
    <div className="flex flex-col h-full">
      <div className="px-5 pt-14 pb-3">
        <h1 className="text-2xl font-bold text-foreground">My bag</h1>
      </div>

      <div className="flex-1 overflow-y-auto px-5 pb-36">
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center pt-20 text-muted-foreground">
            <p className="text-sm">Your bag is empty</p>
            <p className="text-xs mt-1">Scan items to add them here</p>
          </div>
        ) : (
          <div className="space-y-1">
            {items.map((item) => (
              <div
                key={item.product.id}
                className="relative overflow-hidden rounded-xl"
                onTouchStart={() => setSwipedId(null)}
              >
                {/* Delete background */}
                <div className="absolute right-0 top-0 bottom-0 w-20 bg-destructive flex items-center justify-center rounded-r-xl">
                  <Trash2 size={18} className="text-destructive-foreground" />
                </div>

                <div
                  className={`relative bg-card flex items-center gap-3 p-3 transition-transform ${
                    swipedId === item.product.id ? "-translate-x-20" : "translate-x-0"
                  }`}
                  onClick={() =>
                    setSwipedId(swipedId === item.product.id ? null : item.product.id)
                  }
                >
                  <img
                    src={item.product.image}
                    alt={item.product.name}
                    className="w-12 h-12 rounded-xl object-cover bg-muted"
                  />
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-sm text-foreground truncate">
                      {item.product.name}
                    </h3>
                    <p className="text-xs text-muted-foreground">{item.product.weight}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-primary">
                      ${item.product.price.toFixed(2)}ea
                    </p>
                    {item.quantity > 1 && (
                      <p className="text-xs text-muted-foreground">×{item.quantity}</p>
                    )}
                  </div>
                </div>

                {swipedId === item.product.id && (
                  <button
                    onClick={() => {
                      removeItem(item.product.id);
                      setSwipedId(null);
                    }}
                    className="absolute right-0 top-0 bottom-0 w-20 flex items-center justify-center"
                  >
                    <Trash2 size={18} className="text-destructive-foreground" />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        {items.length > 0 && (
          <div className="mt-6 p-4 bg-muted rounded-2xl">
            <h3 className="font-semibold text-sm mb-3">Summary</h3>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-muted-foreground">Order</span>
              <span className="font-medium">${total.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm mb-2">
              <span className="text-muted-foreground">Taxes</span>
              <span className="font-medium">${tax.toFixed(2)}</span>
            </div>
            <div className="border-t border-border pt-2 flex justify-between text-base font-bold">
              <span>Total</span>
              <span className="text-primary">${grandTotal.toFixed(2)}</span>
            </div>
          </div>
        )}
      </div>

      {/* Sticky bottom bar */}
      {items.length > 0 && (
        <div className="fixed bottom-16 left-1/2 -translate-x-1/2 w-full max-w-[390px] px-5 pb-3 pt-2 bg-background/95 backdrop-blur-sm border-t border-border">
          <button
            onClick={onPayNow}
            className="w-full bg-primary text-primary-foreground rounded-2xl py-4 font-bold text-base active:scale-[0.98] transition-transform"
          >
            Pay Now · ${(total + tax).toFixed(2)}
          </button>
        </div>
      )}
    </div>
  );
};

export default BagScreen;
