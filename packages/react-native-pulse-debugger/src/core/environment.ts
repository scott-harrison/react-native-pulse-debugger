import { Platform, NativeModules } from 'react-native';

export const isDevelopment = __DEV__;

export const getDefaultHost = (): string => {
  // Android emulator runs on a different host
  if (Platform.OS === 'android') {
    return '10.0.2.2'; // Special Android emulator localhost
  }
  return 'localhost';
};

export const DEFAULT_PORT = 8973; // We'll use a specific port for our tool

// Define a type for ExpoConstants to fix TypeScript errors
interface ExpoConstants {
  expoConfig?: {
    name?: string;
    [key: string]: any;
  };
  [key: string]: any;
}

/**
 * Attempts to extract the app name from the React Native app.
 * This uses multiple methods to get the app name in order of preference:
 * 1. Expo app name (if running in Expo)
 * 2. iOS app name from SettingsManager
 * 3. Android app name from AppInfo
 * 4. Package name/bundle identifier as fallback
 *
 * @returns The app name or 'React Native App' if it can't be determined
 */
export const getAppName = (): string => {
  try {
    // 1. Try to get app name from Expo
    if (typeof global !== 'undefined' && 'ExpoConstants' in global) {
      try {
        // @ts-ignore - ExpoConstants is not in the type definitions
        const expoConstants = global.ExpoConstants as ExpoConstants;
        if (
          expoConstants &&
          expoConstants.expoConfig &&
          expoConstants.expoConfig.name
        ) {
          return expoConstants.expoConfig.name;
        }
      } catch (expoError) {
        console.warn(
          '[react-native-pulse] Failed to get Expo app name:',
          expoError
        );
      }
    }

    // 2. For iOS
    if (Platform.OS === 'ios') {
      // Try SettingsManager first (most reliable for iOS)
      if (NativeModules.SettingsManager) {
        const settings = NativeModules.SettingsManager.settings;
        if (settings.AppDisplayName) {
          return settings.AppDisplayName;
        }
        if (settings.AppName) {
          return settings.AppName;
        }
      }

      // Try to get from bundle identifier as fallback
      if (
        NativeModules.PlatformConstants &&
        NativeModules.PlatformConstants.bundleIdentifier
      ) {
        const bundleId = NativeModules.PlatformConstants.bundleIdentifier;
        // Extract app name from bundle ID (e.g., com.company.appname -> appname)
        const parts = bundleId.split('.');
        if (parts.length > 0) {
          const lastPart = parts[parts.length - 1];
          // Convert to title case
          return lastPart.charAt(0).toUpperCase() + lastPart.slice(1);
        }
      }
    }

    // 3. For Android
    if (Platform.OS === 'android') {
      // Try AppInfo first
      if (NativeModules.AppInfo) {
        if (NativeModules.AppInfo.appName) {
          return NativeModules.AppInfo.appName;
        }
      }

      // Try to get from package name as fallback
      if (
        NativeModules.PlatformConstants &&
        NativeModules.PlatformConstants.Package
      ) {
        const packageName = NativeModules.PlatformConstants.Package;
        // Extract app name from package name (e.g., com.company.appname -> appname)
        const parts = packageName.split('.');
        if (parts.length > 0) {
          const lastPart = parts[parts.length - 1];
          // Convert to title case
          return lastPart.charAt(0).toUpperCase() + lastPart.slice(1);
        }
      }
    }

    // 4. Fallback
    return 'React Native App';
  } catch (error) {
    console.warn('[react-native-pulse] Failed to get app name:', error);
    return 'React Native App';
  }
};

export const validateEnvironment = (): boolean => {
  if (!isDevelopment) {
    console.warn(
      '[react-native-pulse] Pulse debugger is disabled in production. Remove it from your production builds.'
    );
    return false;
  }
  return true;
};
