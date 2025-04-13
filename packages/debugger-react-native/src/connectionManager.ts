import type { ConnectionOptions, ConnectionState } from '@pulse/shared-types';
import {
  LibToDebuggerEventType,
  DebuggerToLibEventType,
} from '@pulse/shared-types';
import { EventManager } from './eventManager';
import { getReduxStore, setReduxStore } from './utils/reduxStore';

// Create a singleton instance
let instance: ConnectionManager | null = null;

export const initializePulse = (
  options: ConnectionOptions
): ConnectionManager => {
  if (!instance) {
    instance = new ConnectionManager(options);
  }
  return instance;
};

export const getPulse = (): ConnectionManager | null => instance;

/**
 * Manages WebSocket connection for the Pulse Debugger using polling.
 * Actively monitors connection health and maintains connectivity.
 *
 * Features:
 * - Active connection monitoring with ping/pong
 * - Continuous polling regardless of connection state
 * - Connection state management
 * - Configurable polling intervals
 * - Event handling for connection lifecycle
 */
export class ConnectionManager {
  private ws: WebSocket | null = null;
  private state: ConnectionState = 'disconnected';
  private pollInterval: NodeJS.Timeout | null = null;
  private options: ConnectionOptions;
  private isPollingEnabled = true;
  private eventListeners: Map<string, Set<(data: unknown) => void>> = new Map();
  private eventManager: EventManager;

  // Polling configuration
  private readonly POLL_INTERVAL = 1000; // Check connection every second
  private readonly PING_TIMEOUT = 2000; // Wait 2s for pong before considering connection dead

  // Event types
  public static readonly EVENTS = {
    CONNECT: 'connect',
    DISCONNECT: 'disconnect',
    ERROR: 'error',
    MESSAGE: 'message',
    STATE_CHANGE: 'stateChange',
  } as const;

  /**
   * Creates a new ConnectionManager instance.
   * @param options - Configuration options for the WebSocket connection
   * @param options.url - WebSocket server URL to connect to
   */
  constructor(options: ConnectionOptions) {
    this.options = options;
    this.eventManager = new EventManager(this);
    this.setupMessageListener();
  }

  /**
   * Emits an event to all registered listeners
   * @param event - The event name
   * @param data - The data to pass to listeners
   */
  private emit(event: string, data: unknown): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.forEach((listener) => listener(data));
    }
  }

  /**
   * Registers an event listener for WebSocket events.
   * @param event - The event name to listen for
   * @param callback - Function to call when the event occurs
   *
   * Available events:
   * - connect: When connection is established
   * - disconnect: When connection is closed
   * - error: When an error occurs
   * - message: When a message is received
   * - stateChange: When connection state changes
   */
  public on(event: string, callback: (data: unknown) => void): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, new Set());
    }
    this.eventListeners.get(event)!.add(callback);
  }

  /**
   * Removes an event listener for WebSocket events.
   * @param event - The event name to stop listening for
   * @param callback - The callback function to remove
   */
  public off(event: string, callback: (data: unknown) => void): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.delete(callback);
    }
  }

  /**
   * Starts the connection polling mechanism.
   * Polls every POLL_INTERVAL milliseconds to check connection health.
   * If polling is already active, this method does nothing.
   */
  private startPolling(): void {
    if (this.pollInterval || !this.isPollingEnabled) return;

    this.pollInterval = setInterval(() => {
      this.checkConnection();
    }, this.POLL_INTERVAL);
  }

  /**
   * Checks the health of the current WebSocket connection.
   * If the connection is not open, attempts to reconnect.
   * If the connection is open, sends a ping to verify it's truly alive.
   * If ping fails or times out, forces a reconnection.
   */
  private checkConnection(): void {
    if (!this.isPollingEnabled) return;

    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      this.connect();
      return;
    }

    // Send ping to verify connection is truly alive
    try {
      const pingTimeout = setTimeout(() => {
        // Connection is dead if we don't receive pong in time
        if (this.ws?.readyState === WebSocket.OPEN) {
          this.ws.close();
          this.connect();
        }
      }, this.PING_TIMEOUT);

      this.ws.send('ping');

      this.ws.onmessage = (event) => {
        if (event.data === 'pong') {
          clearTimeout(pingTimeout);
        }
      };
    } catch (error) {
      console.error('Ping failed:', error);
      this.connect();
    }
  }

  /**
   * Establishes a WebSocket connection to the debug server.
   * Sets up event handlers for connection lifecycle events.
   * Starts polling if not already active.
   *
   * Connection States:
   * - connecting: Initial connection attempt
   * - connected: Successfully connected
   * - disconnected: Connection closed, but still polling for reconnection
   */
  public connect(): void {
    if (!this.isPollingEnabled) return;
    if (this.ws?.readyState === WebSocket.OPEN) return;

    this.state = 'connecting';
    this.emit(ConnectionManager.EVENTS.STATE_CHANGE, this.state);

    this.ws = new WebSocket(this.options.url);

    this.ws.onopen = () => {
      this.state = 'connected';
      this.emit(ConnectionManager.EVENTS.CONNECT, null);
      this.emit(ConnectionManager.EVENTS.STATE_CHANGE, this.state);
      this.startPolling();
    };

    this.ws.onclose = () => {
      this.state = 'disconnected';
      this.emit(ConnectionManager.EVENTS.DISCONNECT, null);
      this.emit(ConnectionManager.EVENTS.STATE_CHANGE, this.state);
      // Continue polling for reconnection unless explicitly disabled
      if (this.isPollingEnabled) {
        this.connect();
      }
    };

    this.ws.onerror = (error: Event) => {
      console.error('WebSocket error:', error);
      this.emit(ConnectionManager.EVENTS.ERROR, error);
      if (this.isPollingEnabled) {
        this.connect();
      }
    };

    this.ws.onmessage = (event: WebSocketMessageEvent) => {
      this.emit(ConnectionManager.EVENTS.MESSAGE, event.data);
      this.handleIncomingMessage(event.data);
    };
  }

  /**
   * Handles incoming messages from the debugger
   * @param data - The message data
   */
  private handleIncomingMessage(data: string): void {
    try {
      const message = JSON.parse(data);

      if (message.type === DebuggerToLibEventType.REDUX_STATE_REQUEST) {
        this.sendReduxState();
      }
    } catch (error) {
      console.error('Error handling message:', error);
    }
  }

  /**
   * Sends the current Redux state to the debugger
   */
  private sendReduxState(): void {
    if (!this.eventManager) return;

    try {
      const store = getReduxStore();
      if (!store) return;

      const state = store.getState();
      this.eventManager.emit(LibToDebuggerEventType.REDUX_STATE_UPDATE, {
        state,
        timestamp: Date.now(),
      });
    } catch (error) {
      console.error('Error sending Redux state:', error);
    }
  }

  /**
   * Closes the current WebSocket connection but maintains polling for reconnection.
   * This allows the connection to be automatically restored.
   */
  public disconnect(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.state = 'disconnected';
  }

  /**
   * Completely stops polling and closes the WebSocket connection.
   * Cleans up all timers and event listeners.
   * Sets state to disconnected.
   *
   * This is a complete shutdown - no automatic reconnection will occur
   * after stop() is called until connect() is called again.
   */
  public stop(): void {
    this.isPollingEnabled = false;

    if (this.pollInterval) {
      clearInterval(this.pollInterval);
      this.pollInterval = null;
    }

    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }

    this.state = 'disconnected';
  }

  /**
   * Sends data through the WebSocket connection.
   *
   * @param data - The data to send to the debug server
   * @returns boolean indicating if the send was successful
   *
   * The data is automatically stringified before sending.
   * Returns false if:
   * - Connection is not open
   * - WebSocket is not initialized
   * - Send operation fails
   */
  public send(data: unknown): boolean {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      return false;
    }

    try {
      this.ws.send(JSON.stringify(data));
      return true;
    } catch (error) {
      console.error('Failed to send data:', error);
      return false;
    }
  }

  /**
   * Returns the EventManager instance for this connection
   * @returns The EventManager instance or null if not initialized
   */
  public getEventManager(): EventManager | null {
    return this.eventManager;
  }

  /**
   * Returns the current connection state
   * @returns The current connection state
   */
  public getState(): ConnectionState {
    return this.state;
  }

  private setupMessageListener(): void {
    // Implementation of setupMessageListener method
  }

  public setReduxStore(store: { getState: () => unknown }): void {
    setReduxStore(store);
  }
}
