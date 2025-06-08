export interface PulseDebuggerConfig {
  host?: string;
  port?: number;
  autoConnect?: boolean;
  retryInterval?: number;
  enableBatching?: boolean;
  enableThrottling?: boolean;
  monitoring?: {
    network?: boolean;
    console?: boolean;
    redux?: boolean;
  };
}
