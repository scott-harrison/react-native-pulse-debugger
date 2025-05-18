// Mock implementations for device info related functions
export const getAndroidId = () => 'mock-android-id';
export const getIosIdForVendorAsync = async () => 'mock-ios-id';

// Mock for expo-constants
export default {
  manifest: {
    name: 'mock-app-name',
    version: '1.0.0',
    revisionId: '1',
  },
  manifest2: {
    extra: {
      expoClient: {
        name: 'mock-app-name',
        version: '1.0.0',
        buildNumber: '1',
      },
    },
  },
};

// Mock for expo-device
export const modelName = 'mock-model';
export const brand = 'mock-brand';
export const osName = 'mock-os';
export const osVersion = 'mock-version';

// Mock for react-native-device-info
export const getUniqueId = async () => 'mock-device-id';
export const getModel = () => 'mock-model';
export const getBrand = () => 'mock-brand';
export const getSystemName = () => 'mock-system';
export const getSystemVersion = () => 'mock-version';
export const getApplicationName = () => 'mock-app-name';
export const getVersion = () => '1.0.0';
export const getBuildNumber = () => '1';
