import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface Particle {
  id: number;
  x: number;
  y: number;
  color: string;
  size: number;
  rotation: number;
  vx: number;
  vy: number;
  shape: "circle" | "rect" | "star";
}

const COLORS = ["#EF4444", "#F59E0B", "#10B981", "#3B82F6", "#8B5CF6", "#EC4899", "#06B6D4", "#F97316"];
const PARTICLE_COUNT = 80;

function createParticles(): Particle[] {
  return Array.from({ length: PARTICLE_COUNT }, (_, i) => ({
    id: i,
    x: 50 + (Math.random() - 0.5) * 20,
    y: 40,
    color: COLORS[Math.floor(Math.random() * COLORS.length)],
    size: 4 + Math.random() * 6,
    rotation: Math.random() * 360,
    vx: (Math.random() - 0.5) * 12,
    vy: -8 - Math.random() * 8,
    shape: (["circle", "rect", "star"] as const)[Math.floor(Math.random() * 3)],
  }));
}

export function FirstScanCelebration({ onDone }: { onDone: () => void }) {
  const [particles] = useState(createParticles);
  const [visible, setVisible] = useState(true);
  const timerRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    timerRef.current = setTimeout(() => {
      setVisible(false);
      setTimeout(onDone, 500);
    }, 3500);
    return () => clearTimeout(timerRef.current);
  }, [onDone]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="fixed inset-0 z-[200] pointer-events-none flex items-center justify-center"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4 }}
        >
          {/* Confetti particles */}
          {particles.map((p) => (
            <motion.div
              key={p.id}
              className="absolute"
              initial={{
                left: `${p.x}%`,
                top: `${p.y}%`,
                rotate: 0,
                opacity: 1,
                scale: 0,
              }}
              animate={{
                left: `${p.x + p.vx * 8}%`,
                top: `${p.y + p.vy * -6 + 80}%`,
                rotate: p.rotation + Math.random() * 720,
                opacity: [1, 1, 0.8, 0],
                scale: [0, 1.2, 1, 0.6],
              }}
              transition={{
                duration: 2.5 + Math.random() * 1,
                ease: [0.25, 0.46, 0.45, 0.94],
                delay: Math.random() * 0.3,
              }}
              style={{
                width: p.size,
                height: p.shape === "rect" ? p.size * 0.5 : p.size,
                backgroundColor: p.color,
                borderRadius: p.shape === "circle" ? "50%" : p.shape === "star" ? "2px" : "1px",
              }}
            />
          ))}

          {/* Center celebration message */}
          <motion.div
            className="pointer-events-auto text-center"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ type: "spring", stiffness: 200, damping: 12, delay: 0.3 }}
          >
            <motion.div
              className="text-5xl mb-2"
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 0.6, delay: 0.5 }}
            >
              🎉
            </motion.div>
            <motion.p
              className="text-lg font-bold text-foreground"
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.6 }}
            >
              First Scan Complete!
            </motion.p>
            <motion.p
              className="text-xs text-muted-foreground mt-1"
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.8 }}
            >
              You're on your way to healthier choices 🌿
            </motion.p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
