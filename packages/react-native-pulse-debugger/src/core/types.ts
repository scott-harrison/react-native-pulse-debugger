export type ConnectionStatus =
  | 'connecting'
  | 'connected'
  | 'disconnected'
  | 'error';

export interface ConnectionConfig {
  host?: string;
  port?: number;
  autoConnect?: boolean;
  retryInterval?: number;
  appName?: string;
}

export interface DebugEvent {
  type: string;
  payload: unknown;
  timestamp: number;
}

export interface ConnectionState {
  status: ConnectionStatus;
  lastError?: Error;
  reconnectAttempts: number;
}
