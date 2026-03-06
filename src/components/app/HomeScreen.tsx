import { motion } from "framer-motion";
import { Search } from "lucide-react";
import skaapIcon from "@/assets/skaap-icon.png";
import storeWalmart from "@/assets/store-walmart.jpg";
import storeFreshco from "@/assets/store-freshco.jpg";
import storeRCS from "@/assets/store-rcs.jpg";

interface HomeScreenProps {
  onSelectStore: () => void;
}

const stores = [
  { id: "1", name: "Publix", address: "1551 3rd Ave, New York, NY 10128", image: storeWalmart },
  { id: "2", name: "Kroger", address: "11 W 42nd St, New York, NY 10036", image: storeFreshco },
  { id: "3", name: "Whole Foods Market", address: "4 Union Square S, New York, NY 10003", image: storeRCS },
];

const HomeScreen = ({ onSelectStore }: HomeScreenProps) => {
  return (
    <div className="px-5 pt-14 pb-24">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-2 mb-6"
      >
        <img src={skaapIcon} alt="SKAAP" className="w-10 h-10 rounded-xl" />
      </motion.div>

      <motion.h1
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="text-2xl font-bold text-foreground"
      >
        Hi there,
      </motion.h1>
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.15 }}
        className="text-muted-foreground text-sm mb-5"
      >
        Where are you buying today?
      </motion.p>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="relative mb-6"
      >
        <input
          type="text"
          placeholder="Search stores..."
          className="w-full bg-muted rounded-xl py-3 pl-4 pr-11 text-sm outline-none focus:ring-2 focus:ring-primary/30 transition-all"
        />
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-primary" size={18} />
      </motion.div>

      <div className="space-y-4">
        {stores.map((store, i) => (
          <motion.button
            key={store.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 + i * 0.1 }}
            whileTap={{ scale: 0.97 }}
            onClick={onSelectStore}
            className="w-full rounded-2xl overflow-hidden shadow-card bg-card"
          >
            <div className="relative h-36">
              <img src={store.image} alt={store.name} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-secondary/80 to-transparent" />
              <div className="absolute bottom-3 left-4">
                <h3 className="text-primary-foreground font-bold text-base">{store.name}</h3>
                <p className="text-primary-foreground/70 text-xs">{store.address}</p>
              </div>
            </div>
          </motion.button>
        ))}
      </div>
    </div>
  );
};

export default HomeScreen;
