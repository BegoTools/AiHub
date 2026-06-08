import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.aihub.tools',
  appName: 'AI Hub',
  webDir: 'dist',
  server: {
    url: 'https://ai-hub-liart.vercel.app',
    cleartext: true,
    allowNavigation: ['ai-hub-liart.vercel.app', '*.supabase.co', 'graph.facebook.com', '*.facebook.com', '*.google.com']
  },
  android: {
    allowMixedContent: true
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 0,
      backgroundColor: '#2563eb'
    }
  }
};

export default config;
