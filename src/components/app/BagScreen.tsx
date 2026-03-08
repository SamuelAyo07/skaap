import { useState } from "react";
import { Minus, Plus, ShoppingBag } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { motion, AnimatePresence } from "framer-motion";
import { Product } from "@/data/products";
import ProductInfoSheet, { ProductInfoButton } from "@/components/app/ProductInfoSheet";
interface BagScreenProps {
  onPayNow: () => void;
}

const BagScreen = ({ onPayNow }: BagScreenProps) => {
  const { items, updateQuantity, total } = useCart();
  const [infoProduct, setInfoProduct] = useState<Product | null>(null);

  const tax = total * 0.11;
  const grandTotal = total + tax;

  return (
    <div className="flex flex-col h-full bg-background">
      <div className="px-5 pt-10 pb-3">
        <motion.h1
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-[28px] font-black text-foreground tracking-tight"
        >
          My bag
        </motion.h1>
      </div>

      <div className="flex-1 overflow-y-auto px-5 pb-48">
        {items.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center pt-24"
          >
            <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mb-4">
              <ShoppingBag size={24} className="text-muted-foreground/40" />
            </div>
            <p className="text-base font-semibold text-foreground">Your bag is empty</p>
            <p className="text-sm text-muted-foreground mt-1">Scan items to add them here</p>
          </motion.div>
        ) : (
          <div className="space-y-3">
            <AnimatePresence>
              {items.map((item, i) => (
                <motion.div
                  key={item.product.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ delay: i * 0.04, type: "spring", stiffness: 200, damping: 24 }}
                  className="bg-card rounded-2xl p-4 border border-border/40 flex items-center gap-4"
                >
                  <div className="w-[72px] h-[72px] rounded-xl overflow-hidden bg-muted/20 flex-shrink-0">
                    <img
                      src={item.product.image}
                      alt={item.product.name}
                      className="w-full h-full object-contain p-2"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-[16px] text-foreground leading-snug line-clamp-2">
                      {item.product.name}
                    </h3>
                    <p className="text-xs text-muted-foreground mt-0.5">{item.product.weight}</p>
                    <p className="text-[16px] font-bold text-scanner-accent mt-1">
                      ${item.product.price.toFixed(2)}ea
                    </p>
                  </div>
                  <div className="flex flex-col items-center gap-1 flex-shrink-0">
                    <motion.button
                      whileTap={{ scale: 0.85 }}
                      onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                      className="w-8 h-8 rounded-full bg-foreground/[0.06] flex items-center justify-center"
                    >
                      <Plus size={14} className="text-foreground" />
                    </motion.button>
                    <span className="text-sm font-bold text-foreground w-6 text-center">
                      {item.quantity}
                    </span>
                    <motion.button
                      whileTap={{ scale: 0.85 }}
                      onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                      className="w-8 h-8 rounded-full bg-foreground/[0.06] flex items-center justify-center"
                    >
                      <Minus size={14} className="text-foreground" />
                    </motion.button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {items.length > 0 && (
        <div className="absolute bottom-16 left-0 right-0 bg-gradient-to-t from-background via-background to-transparent pt-6 pb-3 px-5">
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
