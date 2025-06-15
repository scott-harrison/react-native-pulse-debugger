import { DeviceInfo } from './device';

export type SessionId = string;

export interface MonitoringConfig {
    redux: boolean;
    network: boolean;
    console: boolean;
}

export interface Session {
    id: SessionId;
    deviceInfo: DeviceInfo;
    monitoring: MonitoringConfig;
}
