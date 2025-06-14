import { Monitoring } from '@react-native-pulse-debugger/types';

export interface PulseDebuggerConfig {
    host?: string;
    port?: number;
    autoConnect?: boolean;
    retryInterval?: number;
    enableBatching?: boolean;
    enableThrottling?: boolean;
    consoleBlacklist?: string[];
    networkBlacklist?: string[];
    monitoring?: Monitoring;
}
