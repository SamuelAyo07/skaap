// ─── Haptic Feedback Utility ───
// Uses the Vibration API on supported devices for tactile feedback

type HapticStyle = "light" | "medium" | "heavy" | "success" | "warning" | "error" | "selection";

const patterns: Record<HapticStyle, number | number[]> = {
  light: 10,
  medium: 20,
  heavy: 40,
  success: [10, 30, 10],
  warning: [20, 40, 20],
  error: [30, 20, 30, 20, 30],
  selection: 5,
};

export function haptic(style: HapticStyle = "light") {
  try {
    if ("vibrate" in navigator) {
      navigator.vibrate(patterns[style]);
    }
  } catch {}
}

// Convenience wrappers
export const hapticLight = () => haptic("light");
export const hapticMedium = () => haptic("medium");
export const hapticHeavy = () => haptic("heavy");
export const hapticSuccess = () => haptic("success");
export const hapticSelection = () => haptic("selection");
