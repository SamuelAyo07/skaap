import { motion } from "framer-motion";
import skaapIcon from "@/assets/skaap-icon.png";

const SplashScreen = ({ onComplete }: { onComplete: () => void }) => {
  return (
    <motion.div
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-center"
      style={{ background: "#0A0E17" }}
      initial={{ opacity: 1 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      onAnimationComplete={(def: any) => {
        // Only trigger on exit
      }}
    >
      {/* Icon */}
      <motion.img
        src={skaapIcon}
        alt="SKAAP"
        className="w-20 h-20 rounded-2xl"
        initial={{ scale: 0.7, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      />

      {/* Brand */}
      <motion.h1
        className="mt-5 text-2xl font-black tracking-tight text-white"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25, duration: 0.4, ease: "easeOut" }}
      >
        SKAAP
      </motion.h1>

      {/* Tagline */}
      <motion.p
        className="mt-1.5 text-xs font-medium tracking-wide"
        style={{ color: "rgba(255,255,255,0.45)" }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.45, duration: 0.4 }}
      >
        Food Intelligence
      </motion.p>

      {/* Subtle loading indicator */}
      <motion.div
        className="mt-10 h-0.5 rounded-full overflow-hidden"
        style={{ width: 48, background: "rgba(255,255,255,0.08)" }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
      >
        <motion.div
          className="h-full rounded-full"
          style={{ background: "#E8314A" }}
          initial={{ width: "0%" }}
          animate={{ width: "100%" }}
          transition={{ delay: 0.7, duration: 1, ease: "easeInOut" }}
          onAnimationComplete={() => onComplete()}
        />
      </motion.div>
    </motion.div>
  );
};

export default SplashScreen;
