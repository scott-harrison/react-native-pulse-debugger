type Platform = 'ios' | 'android';

interface DeviceInfo {
  model: string;
  osVersion: string;
}

interface AppMetadata {
  appName: string;
  appVersion: string;
  buildNumber: string;
  platform: Platform;
  isExpo: boolean;
  deviceInfo: DeviceInfo;
}

interface SessionData {
  deviceId: string;
  metadata: AppMetadata;
  connectedAt: string; // ISO 8601 format, e.g., "2025-04-23T12:00:00Z"
  lastActiveAt: string; // ISO 8601 format, e.g., "2025-04-23T12:00:00Z"
  status: 'connected' | 'disconnected';
}

export { Platform, DeviceInfo, AppMetadata, SessionData };
