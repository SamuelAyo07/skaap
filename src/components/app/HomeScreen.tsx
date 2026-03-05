import { Search } from "lucide-react";
import skaapIcon from "@/assets/skaap-icon.png";
import storeRCS from "@/assets/store-rcs.jpg";
import storeFreshco from "@/assets/store-freshco.jpg";
import storeWalmart from "@/assets/store-walmart.jpg";

interface HomeScreenProps {
  onSelectStore: () => void;
}

const stores = [
  { id: "1", name: "Real Canadian Superstore", address: "3806 Albert St – Regina", image: storeRCS },
  { id: "2", name: "FreshCo", address: "489 Broad St – Regina", image: storeFreshco },
  { id: "3", name: "Walmart Supercentre", address: "2150 Prince of Wales Dr", image: storeWalmart },
];

const HomeScreen = ({ onSelectStore }: HomeScreenProps) => {
  return (
    <div className="px-5 pt-14 pb-24">
      {/* Logo */}
      <div className="flex items-center gap-2 mb-6">
        <img src={skaapIcon} alt="SKAAP" className="w-10 h-10 rounded-xl" />
      </div>

      {/* Greeting */}
      <h1 className="text-2xl font-bold text-foreground">Hi there,</h1>
      <p className="text-muted-foreground text-sm mb-5">Where are you buying today?</p>

      {/* Search */}
      <div className="relative mb-6">
        <input
          type="text"
          placeholder="Search stores..."
          className="w-full bg-muted rounded-xl py-3 pl-4 pr-11 text-sm outline-none focus:ring-2 focus:ring-primary/30 transition-all"
        />
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-primary" size={18} />
      </div>

      {/* Store list */}
      <div className="space-y-4">
        {stores.map((store, i) => (
          <button
            key={store.id}
            onClick={onSelectStore}
            className="w-full rounded-2xl overflow-hidden shadow-card bg-card transition-transform active:scale-[0.98] fade-in"
            style={{ animationDelay: `${i * 0.1}s` }}
          >
            <div className="relative h-36">
              <img src={store.image} alt={store.name} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-secondary/80 to-transparent" />
              <div className="absolute bottom-3 left-4">
                <h3 className="text-primary-foreground font-bold text-base">{store.name}</h3>
                <p className="text-primary-foreground/70 text-xs">{store.address}</p>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

export default HomeScreen;
