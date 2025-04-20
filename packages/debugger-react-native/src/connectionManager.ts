import type { ConnectionOptions, ConnectionState } from '@pulse/shared-types';
import {
  LibToDebuggerEventType,
  DebuggerToLibEventType,
  CONNECTION_STATUS,
} from '@pulse/shared-types';
import { EventManager } from './eventManager';
import { getReduxStore, setReduxStore } from './utils/reduxStore';
import { getAppMetadata } from './utils/appMetadata';

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
 * Manages WebSocket connection for the Pulse Debugger.
 * Handles connection lifecycle, message routing, and state management.
 */
export class ConnectionManager {
  private ws: WebSocket | null = null;
  private state: ConnectionState = 'disconnected';
  private pollInterval: NodeJS.Timeout | null = null;
  private options: ConnectionOptions;
  private isPollingEnabled = true;
  private eventListeners: Map<string, Set<(data: unknown) => void>> = new Map();
  private eventManager: EventManager;

  // Configuration
  private readonly POLL_INTERVAL = 5000;

  // Event types
  public static readonly EVENTS = {
    CONNECT: 'connect',
    DISCONNECT: 'disconnect',
    ERROR: 'error',
    MESSAGE: 'message',
    STATE_CHANGE: 'stateChange',
  } as const;

  /**
   * Creates a new ConnectionManager instance
   */
  constructor(options: ConnectionOptions) {
    this.options = options;
    this.eventManager = new EventManager(this);
    this.setupReduxStateRequestHandler();
  }

  /**
   * Registers a handler for Redux state requests
   */
  private setupReduxStateRequestHandler(): void {
    this.eventManager.onIncoming(
      DebuggerToLibEventType.REDUX_STATE_REQUEST,
      () => {
        this.sendReduxState();
      }
    );
  }

  /**
   * Emits an event to all registered listeners
   */
  public emit(event: string, data: unknown): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.forEach((listener) => listener(data));
    }
  }

  /**
   * Registers an event listener
   */
  public on(event: string, callback: (data: unknown) => void): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, new Set());
    }
    this.eventListeners.get(event)!.add(callback);
  }

  /**
   * Removes an event listener
   */
  public off(event: string, callback: (data: unknown) => void): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.delete(callback);
    }
  }

  /**
   * Starts the connection polling mechanism
   */
  private startPolling(): void {
    if (this.pollInterval || !this.isPollingEnabled) return;
    this.pollInterval = setInterval(
      () => this.checkConnection(),
      this.POLL_INTERVAL
    );
  }

  /**
   * Checks the health of the current WebSocket connection
   */
  private checkConnection(): void {
    if (!this.isPollingEnabled) return;
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      this.connect();
    }
  }

  /**
   * Establishes a WebSocket connection to the debug server
   */
  public connect(): void {
    if (!this.isPollingEnabled) return;
    if (this.ws?.readyState === WebSocket.OPEN) return;

    // Clean up any existing connection
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }

    this.state = 'connecting';
    this.emit(ConnectionManager.EVENTS.STATE_CHANGE, this.state);

    try {
      this.ws = new WebSocket(this.options.url);
      this.setupWebSocketHandlers();
    } catch (error) {
      console.error('Error creating WebSocket:', error);
      this.state = 'error';
      this.emit(ConnectionManager.EVENTS.ERROR, error);
      this.emit(ConnectionManager.EVENTS.STATE_CHANGE, this.state);
    }
  }

  /**
   * Sets up WebSocket event handlers
   */
  private setupWebSocketHandlers(): void {
    if (!this.ws) return;

    this.ws.onopen = async () => {
      const metadata = await getAppMetadata();
      // Send handshake message immediately
      console.log('[Pulse Debugger] Sending handshake message');
      this.send({
        type: 'handshake',
        payload: {
          ...metadata,
          timestamp: Date.now(),
        },
      });

      // Start polling after successful connection
      this.startPolling();
    };

    this.ws.onclose = () => {
      this.state = 'disconnected';
      this.emit(ConnectionManager.EVENTS.DISCONNECT, null);
      this.emit(ConnectionManager.EVENTS.STATE_CHANGE, this.state);

      // Schedule a single reconnection attempt
      if (this.isPollingEnabled) {
        setTimeout(() => {
          if (this.state === 'disconnected') {
            this.connect();
          }
        }, this.POLL_INTERVAL);
      }
    };

    this.ws.onerror = (error: Event) => {
      this.handleWebSocketError(error);
    };

    this.ws.onmessage = (event: any) => {
      this.handleWebSocketMessage(event);
    };
  }

  /**
   * Handles WebSocket errors
   */
  private handleWebSocketError(error: Event): void {
    // Check if this is a connection refused error
    const errorObj = error as any;
    const errorMessage = errorObj.message || '';
    const isConnectionRefused =
      typeof errorMessage === 'string' &&
      (errorMessage.includes('Connection refused') ||
        errorMessage.includes('ECONNREFUSED') ||
        errorMessage.includes(
          "The operation couldn't be completed. Connection refused"
        ));

    if (isConnectionRefused) {
      // Silently handle connection refused - debugger is likely not running
      this.state = 'disconnected';
      this.emit(ConnectionManager.EVENTS.STATE_CHANGE, this.state);
    } else {
      // For other types of errors, log them as usual
      console.error('WebSocket error:', error);
      this.emit(ConnectionManager.EVENTS.ERROR, error);
    }
  }

  /**
   * Handles WebSocket messages
   */
  private handleWebSocketMessage(event: any): void {
    try {
      // Parse the message once
      const message = JSON.parse(event.data);
      console.log('[Pulse Debugger] Received message:', message);

      // Handle connection status messages
      if (message.type === CONNECTION_STATUS) {
        console.log('[Pulse Debugger] Connection status:', message.status);
        this.state = message.status;
        this.emit(ConnectionManager.EVENTS.STATE_CHANGE, this.state);
        if (message.status === 'connected') {
          this.emit(ConnectionManager.EVENTS.CONNECT, null);
        }
      } else {
        // Pass the parsed message to handlers
        this.emit(ConnectionManager.EVENTS.MESSAGE, message);
      }
    } catch (error) {
      console.error('Error parsing message:', error);
    }
  }

  /**
   * Formats a log message to ensure it's properly structured
   */
  private formatLogMessage(
    level: string,
    message: unknown,
    data: unknown[] = []
  ): unknown {
    // If message is an object, stringify it properly
    const formattedMessage =
      typeof message === 'object'
        ? JSON.stringify(message, null, 2)
        : String(message);

    return {
      type: 'log',
      level,
      message: formattedMessage,
      data: Array.isArray(data) ? data : [data],
      timestamp: Date.now(),
    };
  }

  /**
   * Sends a log message to the debugger
   */
  public log(level: string, message: unknown, ...data: unknown[]): void {
    const formattedMessage = this.formatLogMessage(level, message, data);
    this.send(formattedMessage);
  }

  /**
   * Sends the current Redux state to the debugger
   */
  public sendReduxState(): void {
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
   * Closes the current WebSocket connection but maintains polling for reconnection
   */
  public disconnect(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.state = 'disconnected';
  }

  /**
   * Completely stops polling and closes the WebSocket connection
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
   * Sends data through the WebSocket connection
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
   */
  public getEventManager(): EventManager | null {
    return this.eventManager;
  }

  /**
   * Returns the current connection state
   */
  public getState(): ConnectionState {
    return this.state;
  }

  /**
   * Sets the Redux store for state access
   */
  public setReduxStore(store: { getState: () => unknown }): void {
    setReduxStore(store);
  }
}
