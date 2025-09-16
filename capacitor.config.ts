import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.tapdano.app',
  appName: 'TapDano',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  }
};

export default config;
