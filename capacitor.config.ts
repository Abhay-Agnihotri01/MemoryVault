import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.memoryvault.app',
  appName: 'MemoryVault',
  webDir: 'out', // We don't actually build it, but it's required
  server: {
    url: 'https://memory-vault-5ii2.vercel.app',
    cleartext: true,
    allowNavigation: [
      '*.facebook.com',
      '*.instagram.com',
      'facebook.com',
      'instagram.com'
    ]
  }
};

export default config;
