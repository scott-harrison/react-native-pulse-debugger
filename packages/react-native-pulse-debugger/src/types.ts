export type ConnectionState =
  | 'connecting'
  | 'connected'
  | 'disconnected'
  | 'error';

export interface ConnectionOptions {
  url: string;
  reconnectAttempts?: number;
  initialReconnectDelay?: number;
  maxReconnectDelay?: number;
  reconnectBackoffMultiplier?: number;
}

export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

export type EventHandler<T = unknown> = (payload: T) => void;

export interface EventMessage<T = unknown> {
  type: string;
  payload: T;
}
