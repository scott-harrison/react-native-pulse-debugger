import type { IEvent } from '@react-native-pulse-debugger/types';
import { getDeviceInfo } from '../utils/deviceInfo';

type WebSocketFactory = (url: string) => WebSocket;

export class WebSocketClient {
  private ws: WebSocket | null = null;
  private url: string;
  private createWebSocket: WebSocketFactory;
  private reconnectInterval: number = 3000;
  private messageQueue: IEvent[] = [];
  private shouldReconnect: boolean = true;
  private messageHandler: ((data: any) => void) | null = null;
  private isConnecting: boolean = false;
  private deviceDetails: Record<string, string> = {};
  private session: { id: string; deviceInfo: Record<string, string> } | null =
    null;

  constructor(
    url: string = 'ws://localhost:8379',
    createWebSocket: WebSocketFactory = (wsUrl) => new WebSocket(wsUrl)
  ) {
    this.url = url;
    this.createWebSocket = createWebSocket;
    this.connect();
  }

  private async initializeSession(): Promise<void> {
    // If session already exists, skip initialization
    if (this.session) {
      return;
    }

    // Fetch device details
    this.deviceDetails = await getDeviceInfo();

    // Create a unique session ID using deviceId and appName
    const { deviceId, appName } = this.deviceDetails;
    const sessionId = `${deviceId}-${appName}`;

    // Create the session object
    this.session = {
      id: sessionId,
      deviceInfo: this.deviceDetails,
    };

    console.log('[WebSocketClient] Session initialized:', this.session);
  }

  public isConnected(): boolean {
    const connected = this.ws !== null && this.ws.readyState === WebSocket.OPEN;
    console.log('[WebSocketClient] isConnected check:', {
      wsExists: this.ws !== null,
      readyState: this.ws?.readyState,
      isConnected: connected,
    });
    return connected;
  }

  public sendMessage(message: IEvent): void {
    if (this.isConnected()) {
      this.ws!.send(
        JSON.stringify({ sessionId: this.session?.id, ...message })
      );
    } else {
      this.messageQueue.push(message);
    }
  }

  public onMessage(handler: (data: any) => void): void {
    this.messageHandler = handler;
  }

  public getMessageQueue(): IEvent[] {
    return [...this.messageQueue];
  }

  public disconnect(): void {
    this.shouldReconnect = false;
    this.isConnecting = false;
    this.messageQueue = [];
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  private async connect(): Promise<void> {
    if (this.isConnecting || !this.shouldReconnect) return;
    this.isConnecting = true;
    console.log('[WebSocketClient] Starting connection...');

    if (!this.session) {
      await this.initializeSession();
    }

    // Add device details as query parameters
    const queryParams = this.session
      ? new URLSearchParams({
          id: this.session.id,
          ...this.session.deviceInfo,
        }).toString()
      : '';
    const wsUrlWithParams = `${this.url}?${queryParams}`;

    this.ws = this.createWebSocket(wsUrlWithParams);

    this.ws.onopen = () => {
      console.log('[WebSocketClient] Connection opened');
      this.isConnecting = false;
      this.flushQueue();
    };

    this.ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log('[WebSocketClient] Message received:', data.type);

        if (data.type === 'reconnect') {
          this.connect();
        }

        if (this.messageHandler) {
          this.messageHandler(data);
        }
      } catch (error) {
        console.error('[WebSocketClient] Error parsing message:', error);
      }
    };

    this.ws.onerror = (error: any) => {
      console.log('[WebSocketClient] Connection error:', error);
      this.isConnecting = false;
      if (error.message.includes('Connection refused')) {
        this.scheduleReconnect();
        return;
      }

      console.error('[WebSocketClient] Error:', error);
    };

    this.ws.onclose = () => {
      console.log('[WebSocketClient] Connection closed');
      this.isConnecting = false;
      this.ws = null;
      this.session = null;
      if (this.shouldReconnect) {
        this.scheduleReconnect();
      }
    };
  }

  private scheduleReconnect(): void {
    if (!this.shouldReconnect || this.isConnecting) return;
    setTimeout(() => {
      this.connect();
    }, this.reconnectInterval);
  }

  private flushQueue(): void {
    while (this.messageQueue.length > 0 && this.isConnected()) {
      const message = this.messageQueue.shift();
      if (message) {
        this.ws!.send(JSON.stringify(message));
      }
    }
  }
}
