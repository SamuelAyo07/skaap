import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.skaap.app',
  appName: 'SKAAP',
  webDir: 'dist',
  server: {
    url: 'https://0fef0f41-45b6-428f-9e1b-f7495cf38b76.lovableproject.com?forceHideBadge=true',
    cleartext: true,
  },
};

export default config;
