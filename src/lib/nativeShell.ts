/**
 * Initializes Capacitor native plugins on app boot.
 * Safe to call in browser/PWA contexts — every plugin call is guarded by
 * `Capacitor.isNativePlatform()` so this is a no-op on the web.
 */
import { Capacitor } from "@capacitor/core";

export async function initNativeShell(): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;

  try {
    const { StatusBar, Style } = await import("@capacitor/status-bar");
    await StatusBar.setStyle({ style: Style.Dark });
    await StatusBar.setBackgroundColor({ color: "#0A0F1E" }).catch(() => {});
    await StatusBar.setOverlaysWebView({ overlay: true }).catch(() => {});
  } catch {
    /* status bar plugin missing on web */
  }

  try {
    const { SplashScreen } = await import("@capacitor/splash-screen");
    // Auto-hide is configured in capacitor.config.ts; this is a safety net.
    setTimeout(() => SplashScreen.hide().catch(() => {}), 1200);
  } catch {
    /* ignore */
  }

  try {
    const { Keyboard } = await import("@capacitor/keyboard");
    Keyboard.addListener("keyboardWillShow", () => {
      document.documentElement.classList.add("kb-open");
    });
    Keyboard.addListener("keyboardWillHide", () => {
      document.documentElement.classList.remove("kb-open");
    });
  } catch {
    /* ignore */
  }

  // iOS swipe-back / Android hardware-back gesture handler.
  try {
    const { App } = await import("@capacitor/app");
    App.addListener("backButton", ({ canGoBack }) => {
      if (canGoBack) {
        window.history.back();
      } else {
        App.exitApp().catch(() => {});
      }
    });
  } catch {
    /* ignore */
  }
}
