/**
 * Connection state types
 */
export type ConnectionState = 'connecting' | 'connected' | 'disconnected' | 'error';

/**
 * Connection options
 */
export interface ConnectionOptions {
  /**
   * WebSocket server URL to connect to
   */
  url: string;
}

/**
 * Event handler type
 */
export type EventHandler<T = unknown> = (payload: T) => void;

/**
 * Event message type
 */
export interface EventMessage<T = unknown> {
  type: string;
  payload: T;
}
