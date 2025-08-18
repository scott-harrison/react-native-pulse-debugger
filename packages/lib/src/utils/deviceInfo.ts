import { Platform } from 'react-native';

// Define interfaces for type safety
interface DeviceInfoModule {
    getApplicationName: () => string;
    getVersion: () => string;
    getBrand: () => string;
    getBuildNumber: () => string;
    getModel: () => string;
    getSystemName: () => string;
    getSystemVersion: () => string;
    getUniqueId: () => Promise<string>;
}

interface ConstantsModule {
    expoConfig?: {
        name?: string;
        version?: string;
        ios?: { buildNumber?: string };
        android?: { versionCode?: string };
    };
    manifest2?: { id?: string };
    deviceName?: string;
    platform?: {
        ios?: { buildNumber?: string | null };
    };
}

interface DeviceModule {
    brand: string;
    deviceName: string;
    osName: string;
    osVersion: string;
}

// Try to load modules dynamically
const loadModules = () => {
    let DeviceInfo: DeviceInfoModule | null = null;
    let Constants: ConstantsModule | null = null;
    let Device: DeviceModule | null = null;

    // Try to load react-native-device-info (for native React Native)
    try {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        DeviceInfo = require('react-native-device-info');
    } catch {
        // Swallow error and continue
    }

    // Try to load expo modules (for Expo)
    try {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const expoConstants = require('expo-constants');
        Constants = expoConstants.default;
    } catch {
        // Swallow error and continue
    }

    try {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const expoDevice = require('expo-device');
        Device = expoDevice.default;
    } catch {
        // Swallow error and continue
    }

    return { DeviceInfo, Constants, Device };
};

export const getDeviceInfo = async () => {
    try {
        const { DeviceInfo, Constants, Device } = loadModules();

        let appName: string | undefined,
            appVersion: string | undefined,
            brand: string | undefined,
            buildNumber: string | undefined,
            model: string | undefined,
            systemName: string | undefined,
            systemVersion: string | undefined,
            deviceId: string | undefined;

        if (DeviceInfo) {
            appName = DeviceInfo.getApplicationName();
            appVersion = DeviceInfo.getVersion();
            brand = DeviceInfo.getBrand();
            buildNumber = DeviceInfo.getBuildNumber();
            model = DeviceInfo.getModel();
            systemName = DeviceInfo.getSystemName();
            systemVersion = DeviceInfo.getSystemVersion();
            deviceId = await DeviceInfo.getUniqueId();
        } else if (Constants) {
            appName = Constants.expoConfig?.name;
            appVersion = Constants.expoConfig?.version;

            if (Device) {
                brand = Device.brand;
                model = Device.deviceName;
                systemVersion = Device.osVersion;
            } else {
                // Fallback using Constants data
                brand = Platform.OS === 'ios' ? 'Apple' : 'Android';
                model = Constants.deviceName || 'Unknown Device';
                systemVersion = 'Unknown';
            }

            buildNumber =
                Constants.expoConfig?.ios?.buildNumber ||
                Constants.expoConfig?.android?.versionCode ||
                Constants.platform?.ios?.buildNumber ||
                undefined;
            systemName = Platform.OS;
            deviceId = Constants.manifest2?.id;
        } else {
            appName = 'Unknown App';
            appVersion = '1.0.0';
            brand = Platform.OS === 'ios' ? 'Apple' : 'Android';
            buildNumber = '1';
            model = 'Unknown Device';
            systemName = Platform.OS;
            systemVersion = 'Unknown';
            deviceId = `device-${Date.now()}`;
        }

        if (
            !appName ||
            !appVersion ||
            !brand ||
            !model ||
            !systemName ||
            !systemVersion ||
            !deviceId
        ) {
            console.warn('[PulseDebugger] Missing required device info fields:', {
                appName,
                appVersion,
                brand,
                model,
                systemName,
                systemVersion,
                deviceId,
                buildNumber,
            });
            return null;
        }

        return {
            appName,
            appVersion,
            brand,
            buildNumber,
            model,
            systemName,
            systemVersion,
            deviceId,
        };
    } catch (error) {
        console.error('[PulseDebugger] Error getting device info:', error);
        return null;
    }
};
