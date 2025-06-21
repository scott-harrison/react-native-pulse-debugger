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
}

interface DeviceModule {
    brand: string;
    deviceName: string;
    osName: string;
    osVersion: string;
}

// Conditional imports with typed variables
let DeviceInfo: DeviceInfoModule | null;
try {
    DeviceInfo = require('react-native-device-info');
} catch (e) {
    DeviceInfo = null;
}

let Constants: ConstantsModule | null;
let Device: DeviceModule | null;
try {
    Constants = require('expo-constants').default;
    Device = require('expo-device');
} catch (e) {
    Constants = null;
    Device = null;
}

export const getDeviceInfo = async () => {
    try {
        let appName: string | undefined,
            appVersion: string | undefined,
            brand: string | undefined,
            buildNumber: string | undefined,
            model: string | undefined,
            systemName: string | undefined,
            systemVersion: string | undefined,
            deviceId: string | undefined;

        if (Constants && Device) {
            appName = Constants.expoConfig?.name;
            appVersion = Constants.expoConfig?.version;
            brand = Device.brand;
            buildNumber =
                Constants.expoConfig?.ios?.buildNumber ||
                Constants.expoConfig?.android?.versionCode;
            model = Device.deviceName;
            systemName = Platform.OS;
            systemVersion = Device.osVersion;
            deviceId = Constants.manifest2?.id;
        } else if (DeviceInfo) {
            appName = DeviceInfo.getApplicationName();
            appVersion = DeviceInfo.getVersion();
            brand = DeviceInfo.getBrand();
            buildNumber = DeviceInfo.getBuildNumber();
            model = DeviceInfo.getModel();
            systemName = DeviceInfo.getSystemName();
            systemVersion = DeviceInfo.getSystemVersion();
            deviceId = await DeviceInfo.getUniqueId();
        } else {
            return null;
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
        return null;
    }
};
