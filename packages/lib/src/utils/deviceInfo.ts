import { Platform } from 'react-native';
import type { DeviceInfo as PulseDeviceInfo } from '@react-native-pulse-debugger/types';

export interface DeviceInfo {
    appName: string;
    appVersion: string;
    brand: string;
    buildNumber: string;
    deviceId: string;
    model: string;
    systemName: string;
    systemVersion: string;
}

export async function getDeviceInfo(): Promise<PulseDeviceInfo | null> {
    try {
        // @ts-ignore
        const expoConstants = await import('expo-constants');
        // @ts-ignore
        const expoApplication = await import('expo-application');
        // @ts-ignore
        const expoDevice = await import('expo-device');

        if (expoConstants.default && expoApplication && expoDevice) {
            const { manifest, manifest2 } = expoConstants.default;

            const deviceId =
                Platform.OS === 'android'
                    ? await expoApplication.getAndroidId()
                    : await expoApplication.getIosIdForVendorAsync();
            const appName = manifest?.name || manifest2?.extra?.expoClient?.name;
            const appVersion = manifest?.version || manifest2?.extra?.expoClient?.version;
            const buildNumber =
                manifest?.revisionId || manifest2?.extra?.expoClient?.buildNumber || '0';

            const model = expoDevice.deviceName;
            const systemName = expoDevice.osName;
            const systemVersion = expoDevice.osVersion;
            const brand = expoDevice.brand;

            if (
                !appName ||
                !appVersion ||
                !buildNumber ||
                !deviceId ||
                !model ||
                !systemName ||
                !systemVersion
            ) {
                return null;
            }

            return {
                appName,
                appVersion,
                brand,
                buildNumber,
                deviceId,
                model,
                systemName,
                systemVersion,
            };
        }
    } catch {
        return null;
    }

    try {
        // @ts-ignore
        const DeviceInfo = await import('react-native-device-info');
        const appName = DeviceInfo.getApplicationName();
        const appVersion = DeviceInfo.getVersion();
        const brand = DeviceInfo.getBrand();
        const buildNumber = DeviceInfo.getBuildNumber();
        const deviceId = DeviceInfo.getDeviceId();
        const model = DeviceInfo.getModel();
        const systemName = DeviceInfo.getSystemName();
        const systemVersion = DeviceInfo.getSystemVersion();

        if (
            !appName ||
            !appVersion ||
            !brand ||
            !buildNumber ||
            !deviceId ||
            !model ||
            !systemName ||
            !systemVersion
        ) {
            return null;
        }

        return {
            appName,
            appVersion,
            brand,
            buildNumber,
            deviceId,
            model,
            systemName,
            systemVersion,
        };
    } catch {
        return null;
    }

    return null;
}
