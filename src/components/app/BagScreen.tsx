import { Trash2, ShoppingBag } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

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
      <div className="px-4 pt-12 pb-2">
        <motion.h1
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-2xl font-bold text-foreground tracking-tight"
        >
          My Bag
        </motion.h1>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-32">
        {items.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center pt-20"
          >
            <div className="w-14 h-14 rounded-full bg-muted/60 flex items-center justify-center mb-3">
              <ShoppingBag size={22} className="text-muted-foreground/50" />
            </div>
            <p className="text-sm font-medium text-foreground">Your bag is empty</p>
            <p className="text-xs text-muted-foreground mt-1">Scan items to add them here</p>
          </motion.div>
        ) : (
          <div className="space-y-1.5">
            <AnimatePresence>
              {items.map((item, i) => (
                <motion.div
                  key={item.product.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 100, height: 0 }}
                  transition={{ delay: i * 0.04, type: "spring", stiffness: 200, damping: 24 }}
                  className="relative overflow-hidden rounded-xl"
                >
                  <div className="absolute right-0 top-0 bottom-0 w-20 bg-destructive flex items-center justify-center rounded-r-xl">
                    <Trash2 size={15} className="text-destructive-foreground" />
                  </div>

                  <motion.div
                    animate={{ x: swipedId === item.product.id ? -80 : 0 }}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    className="relative bg-muted/50 flex items-center gap-3 p-3"
                    onClick={() => setSwipedId(swipedId === item.product.id ? null : item.product.id)}
                  >
                    <img src={item.product.image} alt={item.product.name} className="w-11 h-11 rounded-lg object-cover bg-muted" />
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-[13px] text-foreground truncate tracking-tight">{item.product.name}</h3>
                      <p className="text-[11px] text-muted-foreground">{item.product.weight}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[13px] font-bold text-foreground tabular-nums">${item.product.price.toFixed(2)}</p>
                      {item.quantity > 1 && (
                        <p className="text-[10px] text-muted-foreground font-medium">×{item.quantity}</p>
                      )}
                    </div>
                  </motion.div>

                  {swipedId === item.product.id && (
                    <button
                      onClick={() => { removeItem(item.product.id); setSwipedId(null); }}
                      className="absolute right-0 top-0 bottom-0 w-20 flex items-center justify-center z-10"
                    >
                      <Trash2 size={15} className="text-destructive-foreground" />
                    </button>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}

        {items.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, type: "spring", stiffness: 200, damping: 24 }}
            className="mt-4 p-4 bg-muted/50 rounded-xl"
          >
            <h3 className="font-bold text-[10px] text-muted-foreground uppercase tracking-widest mb-3">Summary</h3>
            <div className="flex justify-between text-[13px] mb-1.5">
              <span className="text-muted-foreground">Subtotal</span>
              <span className="font-medium text-foreground tabular-nums">${total.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-[13px] mb-2.5">
              <span className="text-muted-foreground">Tax</span>
              <span className="font-medium text-foreground tabular-nums">${tax.toFixed(2)}</span>
            </div>
            <div className="border-t border-border pt-2.5 flex justify-between items-baseline">
              <span className="text-[13px] font-bold text-foreground">Total</span>
              <span className="text-lg font-black text-foreground tabular-nums">${grandTotal.toFixed(2)}</span>
            </div>
          </motion.div>
        )}
      </div>

      {items.length > 0 && (
        <div className="absolute bottom-16 left-0 right-0 px-4 pb-3 pt-2.5 glass border-t border-border/50">
          <motion.button
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            whileTap={{ scale: 0.97 }}
            onClick={onPayNow}
            className="w-full bg-foreground text-background rounded-full py-3.5 font-bold text-[15px] tracking-tight"
          >
            Pay Now · ${grandTotal.toFixed(2)}
          </motion.button>
        </div>
      )}
    </div>
  );
};

export default BagScreen;
