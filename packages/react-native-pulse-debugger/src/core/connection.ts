import { Platform } from 'react-native';
import {
  validateEnvironment,
  getDefaultHost,
  DEFAULT_PORT,
} from './environment';
import type { ConnectionConfig, ConnectionStatus, DebugEvent } from './types';

class PulseConnection {
  private ws: WebSocket | null = null;
  private config: Required<ConnectionConfig>;
  private reconnectTimeout: NodeJS.Timeout | null = null;
  private status: ConnectionStatus = 'disconnected';
  private reconnectAttempts = 0;

  constructor(config?: ConnectionConfig) {
    this.config = {
      host: config?.host ?? getDefaultHost(),
      port: config?.port ?? DEFAULT_PORT,
      autoConnect: config?.autoConnect ?? true,
      retryInterval: config?.retryInterval ?? 3000,
    };

    if (validateEnvironment() && this.config.autoConnect) {
      this.connect();
    }
  }

  private getWebSocketUrl(): string {
    return `ws://${this.config.host}:${this.config.port}`;
  }

  private connect = () => {
    if (!validateEnvironment()) return;

    try {
      this.status = 'connecting';
      this.ws = new WebSocket(this.getWebSocketUrl());

      this.ws.onopen = this.handleOpen;
      this.ws.onclose = this.handleClose;
      this.ws.onerror = this.handleError;
      this.ws.onmessage = this.handleMessage;
    } catch (error) {
      this.handleError(error as Event);
    }
  };

  private handleOpen = () => {
    this.status = 'connected';
    this.reconnectAttempts = 0;
    this.send('handshake', {
      platform: Platform.OS,
      version: Platform.Version,
      appName: 'YourAppName', // This should be configurable
    });
  };

  private handleClose = () => {
    this.status = 'disconnected';
    this.scheduleReconnect();
  };

  private handleError = (error: Event) => {
    this.status = 'error';
    console.warn('[react-native-pulse] Connection error:', error);
    this.scheduleReconnect();
  };

  private handleMessage = (event: WebSocketMessageEvent) => {
    try {
      const data = JSON.parse(event.data);
      // Handle incoming messages from the debugger tool
      console.log('[react-native-pulse] Received:', data);
    } catch (error) {
      console.warn('[react-native-pulse] Failed to parse message:', error);
    }
  };

  private scheduleReconnect = () => {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
    }

    this.reconnectTimeout = setTimeout(() => {
      this.reconnectAttempts += 1;
      this.connect();
    }, this.config.retryInterval);
  };

  public send = (type: string, payload: unknown) => {
    if (!validateEnvironment() || !this.ws || this.status !== 'connected') {
      return;
    }

    const event: DebugEvent = {
      type,
      payload,
      timestamp: Date.now(),
    };

    try {
      this.ws.send(JSON.stringify(event));
    } catch (error) {
      console.warn('[react-native-pulse] Failed to send message:', error);
    }
  };

  public disconnect = () => {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
    }
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.status = 'disconnected';
  };

  public getStatus = (): ConnectionStatus => this.status;
}

// Create a singleton instance
let instance: PulseConnection | null = null;

export const initializePulse = (config?: ConnectionConfig): PulseConnection => {
  if (!instance) {
    instance = new PulseConnection(config);
  }
  return instance;
};

export const getPulse = (): PulseConnection | null => instance;
