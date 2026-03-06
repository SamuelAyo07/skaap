import { Trash2 } from "lucide-react";
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
      <div className="px-5 pt-14 pb-3">
        <motion.h1
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-2xl font-bold text-foreground"
        >
          My bag
        </motion.h1>
      </div>

      <div className="flex-1 overflow-y-auto px-5 pb-36">
        {items.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center pt-20 text-muted-foreground"
          >
            <p className="text-sm">Your bag is empty</p>
            <p className="text-xs mt-1">Scan items to add them here</p>
          </motion.div>
        ) : (
          <div className="space-y-1">
            <AnimatePresence>
              {items.map((item, i) => (
                <motion.div
                  key={item.product.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 100, height: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="relative overflow-hidden rounded-xl"
                >
                  <div className="absolute right-0 top-0 bottom-0 w-20 bg-destructive flex items-center justify-center rounded-r-xl">
                    <Trash2 size={18} className="text-destructive-foreground" />
                  </div>

                  <motion.div
                    animate={{ x: swipedId === item.product.id ? -80 : 0 }}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    className="relative bg-card flex items-center gap-3 p-3"
                    onClick={() => setSwipedId(swipedId === item.product.id ? null : item.product.id)}
                  >
                    <img src={item.product.image} alt={item.product.name} className="w-12 h-12 rounded-xl object-cover bg-muted" />
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-sm text-foreground truncate">{item.product.name}</h3>
                      <p className="text-xs text-muted-foreground">{item.product.weight}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-primary">${item.product.price.toFixed(2)}ea</p>
                      {item.quantity > 1 && <p className="text-xs text-muted-foreground">×{item.quantity}</p>}
                    </div>
                  </motion.div>

                  {swipedId === item.product.id && (
                    <button
                      onClick={() => { removeItem(item.product.id); setSwipedId(null); }}
                      className="absolute right-0 top-0 bottom-0 w-20 flex items-center justify-center z-10"
                    >
                      <Trash2 size={18} className="text-destructive-foreground" />
                    </button>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}

        {items.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mt-6 p-4 bg-muted rounded-2xl"
          >
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
          </motion.div>
        )}
      </div>

      {items.length > 0 && (
        <div className="absolute bottom-16 left-0 right-0 px-5 pb-4 pt-3 bg-background/95 backdrop-blur-sm border-t border-border">
          <motion.button
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            whileTap={{ scale: 0.97 }}
            onClick={onPayNow}
            className="w-full bg-primary text-primary-foreground rounded-2xl py-4 font-bold text-base"
          >
            Pay Now · ${(total + tax).toFixed(2)}
          </motion.button>
        </div>
      )}
    </div>
  );
};

export default BagScreen;
