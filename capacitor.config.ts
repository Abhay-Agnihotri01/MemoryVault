import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.memoryvault.app',
  appName: 'MemoryVault',
  webDir: 'out', // We don't actually build it, but it's required
  bundledWebRuntime: false,
  server: {
    url: 'https://memory-vault-5ii2.vercel.app',
    cleartext: true
  }
};

export default config;
