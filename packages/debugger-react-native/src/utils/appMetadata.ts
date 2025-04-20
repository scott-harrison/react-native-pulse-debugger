import { Platform } from 'react-native';

// Interface for app metadata
export interface AppMetadata {
  appName: string;
  platform: string;
  version: string;
  buildNumber: string | undefined;
  bundleId: string;
  timestamp: number;
}

// Type for expo-constants (simplified for this use case)
interface ExpoConstants {
  expoConfig?: {
    name?: string;
    version?: string;
    ios?: { bundleIdentifier?: string; buildNumber?: string };
    android?: { package?: string; versionCode?: string | number };
  };
}

// Type for react-native-device-info (simplified for this use case)
interface DeviceInfo {
  getApplicationName: () => Promise<string>;
  getBundleId: () => Promise<string>;
  getVersion: () => Promise<string>;
  getBuildNumber: () => Promise<string>;
}

/**
 * Gets application metadata by attempting multiple methods based on environment
 * Works in both Expo and React Native environments
 */
export const getAppMetadata = async (): Promise<AppMetadata> => {
  try {
    // Try to use Expo Constants first
    const Constants = (await import('expo-constants').then(
      (module) => module.default
    )) as ExpoConstants;

    const appName = Constants.expoConfig?.name ?? 'Unknown App';
    const bundleId =
      Constants.expoConfig?.ios?.bundleIdentifier ??
      Constants.expoConfig?.android?.package ??
      'Unknown Bundle ID';
    const version = Constants.expoConfig?.version ?? 'Unknown Version';
    const buildNumber =
      Constants.expoConfig?.ios?.buildNumber?.toString() ??
      Constants.expoConfig?.android?.versionCode?.toString() ??
      undefined;

    return {
      appName,
      bundleId,
      version,
      buildNumber,
      platform: Platform.OS,
      timestamp: Date.now(),
    };
  } catch (expoError) {
    console.error('Error fetching app metadata:', expoError);
    // If Expo Constants isn't available, fall back to react-native-device-info
    try {
      const DeviceInfo = (await import('react-native-device-info').then(
        (module) => module.default
      )) as DeviceInfo;

      const [appName, bundleId, version, buildNumber] = await Promise.all([
        DeviceInfo.getApplicationName(),
        DeviceInfo.getBundleId(),
        DeviceInfo.getVersion(),
        DeviceInfo.getBuildNumber(),
      ]);

      return {
        appName,
        bundleId,
        version,
        buildNumber,
        platform: Platform.OS,
        timestamp: Date.now(),
      };
    } catch (deviceInfoError) {
      console.error('Error fetching app metadata:', deviceInfoError);
      throw new Error(
        'Failed to retrieve app metadata: Neither Expo Constants nor react-native-device-info is available'
      );
    }
  }
};
