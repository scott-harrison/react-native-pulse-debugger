import { Platform } from 'react-native';

// Define device info interface for type safety
export interface DeviceInfo {
  deviceId: string;
  model: string;
  brand: string;
  systemName: string;
  systemVersion: string;
  appName: string;
  appVersion: string;
  buildNumber: string;
}

// Default values to use as fallbacks
const DEFAULT_INFO: DeviceInfo = {
  deviceId: 'unknown',
  model: 'unknown',
  brand: 'unknown',
  systemName: Platform.OS || 'unknown',
  systemVersion: 'unknown',
  appName: 'unknown',
  appVersion: '1.0.0',
  buildNumber: '1',
};

/**
 * Checks if the app is running in an Expo environment
 */
export function detectEnvironment(): {
  isExpo: boolean;
  isDeviceInfoAvailable: boolean;
} {
  let isExpo = false;
  let isDeviceInfoAvailable = false;

  // Check for Expo
  try {
    const expoConstants = require('expo-constants');
    isExpo = !!expoConstants.default;
  } catch (e) {
    isExpo = false;
  }

  // Check for react-native-device-info
  try {
    const DeviceInfo = require('react-native-device-info');
    isDeviceInfoAvailable = typeof DeviceInfo.getUniqueId === 'function';
  } catch (e) {
    isDeviceInfoAvailable = false;
  }

  return { isExpo, isDeviceInfoAvailable };
}

/**
 * Gets device ID using available methods
 */
async function getDeviceId(
  isExpo: boolean,
  isDeviceInfoAvailable: boolean
): Promise<string> {
  try {
    // Try Expo Application API first
    if (isExpo) {
      try {
        const Application = require('expo-application');
        if (Platform.OS === 'android') {
          return Application.getAndroidId() || DEFAULT_INFO.deviceId;
        } else if (Platform.OS === 'ios') {
          return (
            (await Application.getIosIdForVendorAsync()) ||
            DEFAULT_INFO.deviceId
          );
        }
      } catch (error) {
        console.warn('[pulse-debugger] Error getting Expo device ID:', error);
      }
    }

    // Try react-native-device-info as fallback
    if (isDeviceInfoAvailable) {
      try {
        const DeviceInfo = require('react-native-device-info');
        return (await DeviceInfo.getUniqueId()) || DEFAULT_INFO.deviceId;
      } catch (error) {
        console.warn(
          '[pulse-debugger] Error getting device ID from device-info:',
          error
        );
      }
    }

    // Generate a pseudo-random ID as last resort
    return `mock-${Platform.OS}-id-${Date.now().toString(36)}`;
  } catch (error) {
    console.error('[pulse-debugger] Error getting device ID:', error);
    return DEFAULT_INFO.deviceId;
  }
}

/**
 * Gets Expo-specific device information
 */
async function getExpoDeviceInfo(deviceId: string): Promise<DeviceInfo> {
  try {
    const Constants = require('expo-constants').default;
    const Device = require('expo-device');

    // Extract app name with fallbacks for different Expo SDK versions
    const appName =
      Constants.manifest?.name ||
      Constants.manifest2?.extra?.expoClient?.name ||
      DEFAULT_INFO.appName;

    // Extract versions with fallbacks
    const appVersion =
      Constants.manifest?.version ||
      Constants.manifest2?.extra?.expoClient?.version ||
      DEFAULT_INFO.appVersion;

    const buildNumber =
      Constants.manifest?.revisionId ||
      Constants.manifest2?.extra?.expoClient?.buildNumber ||
      DEFAULT_INFO.buildNumber;

    return {
      deviceId,
      model: Device.modelName || DEFAULT_INFO.model,
      brand: Device.brand || DEFAULT_INFO.brand,
      systemName: Device.osName || Platform.OS || DEFAULT_INFO.systemName,
      systemVersion: Device.osVersion || DEFAULT_INFO.systemVersion,
      appName,
      appVersion,
      buildNumber,
    };
  } catch (error) {
    console.error('[pulse-debugger] Error getting Expo device info:', error);
    return { ...DEFAULT_INFO, deviceId };
  }
}

/**
 * Gets react-native-device-info specific information
 */
async function getDeviceInfoPackageInfo(deviceId: string): Promise<DeviceInfo> {
  try {
    const DeviceInfo = require('react-native-device-info');

    return {
      deviceId,
      model: DeviceInfo.getModel() || DEFAULT_INFO.model,
      brand: DeviceInfo.getBrand() || DEFAULT_INFO.brand,
      systemName:
        DeviceInfo.getSystemName() || Platform.OS || DEFAULT_INFO.systemName,
      systemVersion:
        DeviceInfo.getSystemVersion() || DEFAULT_INFO.systemVersion,
      appName: DeviceInfo.getApplicationName() || DEFAULT_INFO.appName,
      appVersion: DeviceInfo.getVersion() || DEFAULT_INFO.appVersion,
      buildNumber: DeviceInfo.getBuildNumber() || DEFAULT_INFO.buildNumber,
    };
  } catch (error) {
    console.error(
      '[pulse-debugger] Error getting device-info package data:',
      error
    );
    return { ...DEFAULT_INFO, deviceId };
  }
}

/**
 * Retrieves device information using the best available method
 */
export const getDeviceInfo = async (): Promise<Record<string, string>> => {
  try {
    // Detect environment
    const { isExpo, isDeviceInfoAvailable } = detectEnvironment();

    // Get device ID
    const deviceId = await getDeviceId(isExpo, isDeviceInfoAvailable);

    // Collect device info based on available libraries
    let deviceInfo: DeviceInfo;

    if (isExpo) {
      deviceInfo = await getExpoDeviceInfo(deviceId);
    } else if (isDeviceInfoAvailable) {
      deviceInfo = await getDeviceInfoPackageInfo(deviceId);
    } else {
      // Fallback to basic info if neither library is available
      deviceInfo = {
        ...DEFAULT_INFO,
        deviceId,
        systemName: Platform.OS || DEFAULT_INFO.systemName,
      };
    }

    // Convert DeviceInfo to Record<string, string>
    return { ...deviceInfo };
  } catch (error) {
    console.error('[pulse-debugger] Failed to get device info:', error);
    // Convert DeviceInfo to Record<string, string>
    return { ...DEFAULT_INFO };
  }
};
