import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.kalimcoffee.pos',
  appName: 'Kalim Coffee POS',
  webDir: 'dist',
  server: {
    // When running on iOS simulator, localhost refers to the device itself.
    // To connect to your Mac's local server, you need to use your Mac's IP address.
    // Example: url: 'http://192.168.1.5:3000'
    // cleartext: true
  }
};

export default config;
