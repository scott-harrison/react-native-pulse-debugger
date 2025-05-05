import { Platform } from 'react-native';
import * as Application from 'expo-application';

let isExpo = false;
try {
  // Dynamically check if the app is running in Expo
  isExpo = !!require('expo-constants').default;
} catch (e) {
  isExpo = false;
}

async function getDeviceId() {
  try {
    if (Platform.OS === 'android') {
      return Application.getAndroidId(); // e.g., "dd96dec43fb81c97"
    } else if (Platform.OS === 'ios') {
      return await Application.getIosIdForVendorAsync(); // e.g., "FCDBD8EF-62FC-4ECB-B2F5-92C9E79AC7F9"
    }
    return null; // Web or other platforms
  } catch (error) {
    console.error('Error getting device ID:', error);
    return null;
  }
}

export const getDeviceInfo = async (): Promise<Record<string, string>> => {
  if (isExpo) {
    // Expo environment
    const Constants = require('expo-constants').default;
    const Device = require('expo-device');

    // Device id
    const deviceId = await getDeviceId();

    // Check for the app name in the manifest
    const appName =
      Constants.manifest?.name || // For older Expo SDKs
      Constants.manifest2?.extra?.expoClient?.name || // For newer Expo SDKs
      'unknown';

    return {
      deviceId: deviceId || 'unknown',
      model: Device.modelName || 'unknown',
      brand: Device.brand || 'unknown',
      systemName: Device.osName || Platform.OS,
      systemVersion: Device.osVersion || 'unknown',
      appName, // Use the app name from the manifest
      appVersion:
        Constants.manifest?.version ||
        Constants.manifest2?.extra?.expoClient?.version ||
        'unknown',
      buildNumber:
        Constants.manifest?.revisionId ||
        Constants.manifest2?.extra?.expoClient?.buildNumber ||
        'unknown',
    };
  } else {
    // Non-Expo environment
    const DeviceInfo = require('react-native-device-info');

    return {
      deviceId: await DeviceInfo.getUniqueId(),
      model: DeviceInfo.getModel(),
      brand: DeviceInfo.getBrand(),
      systemName: DeviceInfo.getSystemName(),
      systemVersion: DeviceInfo.getSystemVersion(),
      appName: DeviceInfo.getApplicationName(),
      appVersion: DeviceInfo.getVersion(),
      buildNumber: DeviceInfo.getBuildNumber(),
    };
  }
};
