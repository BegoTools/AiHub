import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.aihub.tools',
  appName: 'AI Hub',
  webDir: 'dist',
  server: {
    url: 'https://ai-hub-liart.vercel.app',
    cleartext: true
  }
};

export default config;