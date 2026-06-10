import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.skaap.app',
  appName: 'SKAAP',
  webDir: 'dist',
  // Release build: load from bundled `webDir` (no remote server).
  // To re-enable live reload during dev, restore a `server` block with your
  // sandbox URL — but it MUST be removed for App Store / TestFlight builds.
  ios: {
    contentInset: 'always',
    backgroundColor: '#0A0F1E',
    // Prefer the system-native scroll bounce and rubber-band
    scrollEnabled: true,
    preferredContentMode: 'mobile',
    // Allow swipe-back gesture out of the WebView root
    limitsNavigationsToAppBoundDomains: false,
  },
  android: {
    backgroundColor: '#0A0F1E',
    allowMixedContent: false,
    captureInput: true,
    webContentsDebuggingEnabled: false,
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 800,
      launchAutoHide: true,
      launchFadeOutDuration: 300,
      backgroundColor: '#0A0F1E',
      androidScaleType: 'CENTER_CROP',
      showSpinner: false,
      splashFullScreen: true,
      splashImmersive: true,
      iosSpinnerStyle: 'small',
      spinnerColor: '#C41E3A',
    },
    StatusBar: {
      // Translucent overlay so our UI controls its own top safe-area background.
      style: 'DARK',
      backgroundColor: '#0A0F1E',
      overlaysWebView: true,
    },
    Keyboard: {
      resize: 'native',
      resizeOnFullScreen: true,
      style: 'DARK',
    },
    Haptics: {},
    App: {},
  },
};

export default config;
