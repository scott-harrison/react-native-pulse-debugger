import type { IEvent } from '@pulse/shared-types';

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

  constructor(
    url: string = 'ws://localhost:8379',
    createWebSocket: WebSocketFactory = (wsUrl) => new WebSocket(wsUrl)
  ) {
    this.url = url;
    this.createWebSocket = createWebSocket;
    this.connect();
  }

  public isConnected(): boolean {
    return this.ws !== null && this.ws.readyState === WebSocket.OPEN;
  }

  public sendMessage(message: IEvent): void {
    if (this.isConnected()) {
      this.ws!.send(JSON.stringify(message));
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

  private connect(): void {
    if (this.isConnecting || !this.shouldReconnect) return;
    this.isConnecting = true;

    this.ws = this.createWebSocket(this.url);

    this.ws.onopen = () => {
      this.isConnecting = false;
      this.flushQueue();
    };

    this.ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (this.messageHandler) {
          this.messageHandler(data);
        }
      } catch (error) {
        console.error('[WebSocketClient] Error parsing message:', error);
      }
    };

    this.ws.onerror = (error: any) => {
      this.isConnecting = false;
      if (error.message.includes('Connection refused')) {
        this.scheduleReconnect();
        return;
      }

      console.error('[WebSocketClient] Error:', error);
    };

    this.ws.onclose = () => {
      this.isConnecting = false;
      this.ws = null;
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
