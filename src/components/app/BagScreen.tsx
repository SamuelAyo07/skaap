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
      <div className="px-4 pt-10 pb-2">
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
          <div className="space-y-2">
            <AnimatePresence>
              {items.map((item, i) => (
                <motion.div
                  key={item.product.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 100, height: 0 }}
                  transition={{ delay: i * 0.04, type: "spring", stiffness: 200, damping: 24 }}
                  className="relative overflow-hidden rounded-2xl"
                >
                  <div className="absolute right-0 top-0 bottom-0 w-20 bg-destructive flex items-center justify-center rounded-r-2xl">
                    <Trash2 size={15} className="text-destructive-foreground" />
                  </div>

                  <motion.div
                    animate={{ x: swipedId === item.product.id ? -80 : 0 }}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    className="relative bg-card border border-border/50 flex items-center gap-3 p-3 rounded-2xl"
                    onClick={() => setSwipedId(swipedId === item.product.id ? null : item.product.id)}
                  >
                    <div className="w-14 h-14 rounded-xl overflow-hidden bg-muted/40 flex-shrink-0">
                      <img src={item.product.image} alt={item.product.name} className="w-full h-full object-contain p-1" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-sm text-foreground leading-tight line-clamp-2">{item.product.name}</h3>
                      <p className="text-xs text-muted-foreground mt-0.5">{item.product.weight}</p>
                      <p className="text-sm font-bold text-scanner-accent mt-0.5">
                        ${item.product.price.toFixed(2)}ea
                        {item.quantity > 1 && <span className="text-muted-foreground font-medium ml-1">× {item.quantity}</span>}
                      </p>
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
      </div>

      {items.length > 0 && (
        <div className="absolute bottom-16 left-0 right-0 px-4 pb-3 pt-2.5">
          <motion.button
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            whileTap={{ scale: 0.97 }}
            onClick={onPayNow}
            className="w-full bg-scanner-accent text-primary-foreground rounded-2xl py-4 font-bold text-[15px] tracking-tight flex items-center justify-between px-6"
          >
            <span>CHECKOUT</span>
            <span>${grandTotal.toFixed(2)}</span>
          </motion.button>
        </div>
      )}
    </div>
  );
};

export default BagScreen;
