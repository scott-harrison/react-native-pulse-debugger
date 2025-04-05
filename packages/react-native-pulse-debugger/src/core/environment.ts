import { Platform } from 'react-native';

export const isDevelopment = __DEV__;

export const getDefaultHost = (): string => {
  // Android emulator runs on a different host
  if (Platform.OS === 'android') {
    return '10.0.2.2'; // Special Android emulator localhost
  }
  return 'localhost';
};

export const DEFAULT_PORT = 8973; // We'll use a specific port for our tool

export const validateEnvironment = (): boolean => {
  if (!isDevelopment) {
    console.warn(
      '[react-native-pulse] Pulse debugger is disabled in production. Remove it from your production builds.'
    );
    return false;
  }
  return true;
};
