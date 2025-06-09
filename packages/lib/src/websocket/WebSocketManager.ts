import { PulseDebuggerConfig } from '../types';

type Event = {
  type: string;
  payload: any;
  timestamp: number;
};

export class WebSocketManager {
  private ws: WebSocket | null = null;
  private isConnecting: boolean = false;
  private reconnectTimeout: NodeJS.Timeout | null = null;
  private eventQueue: Event[] = [];
  private batchTimeout: NodeJS.Timeout | null = null;
  private lastSentTime: number = 0;
  private readonly BATCH_INTERVAL = 100;
  private readonly THROTTLE_INTERVAL = 100;

  constructor(private config: PulseDebuggerConfig) {
    if (config.autoConnect) {
      this.connect();
    }
  }

  connect(): void {
    if (this.isConnecting || this.ws?.readyState === WebSocket.OPEN) return;

    this.isConnecting = true;
    const wsUrl = `ws://${this.config.host}:${this.config.port}`;

    this.ws = new WebSocket(wsUrl);

    this.ws.onopen = () => {
      this.isConnecting = false;
      this.processEventQueue();
    };

    this.ws.onclose = () => {
      this.isConnecting = false;
      if (this.config.autoConnect) {
        this.scheduleReconnect();
      }
    };

    this.ws.onerror = event => {
      // Only log non-connection-refused errors
      const error = event as unknown as Error;
      if (!error.message?.toLowerCase().includes('connection refused')) {
        console.error('PulseDebugger WebSocket error:', error);
      }
    };
  }

  private scheduleReconnect(): void {
    if (this.reconnectTimeout) return;

    this.reconnectTimeout = setTimeout(() => {
      this.reconnectTimeout = null;
      this.connect();
    }, this.config.retryInterval);
  }

  sendEvent(type: string, payload: any): void {
    const event: Event = {
      type,
      payload,
      timestamp: Date.now(),
    };

    if (this.config.enableBatching) {
      this.eventQueue.push(event);
      this.scheduleBatchProcessing();
    } else {
      // For non-batching mode, ensure we're connected before sending
      if (this.ws?.readyState === WebSocket.OPEN) {
        this.sendImmediately(event);
      } else {
        // If not connected, queue the event and try to connect
        this.eventQueue.push(event);
        if (!this.isConnecting) {
          this.connect();
        }
      }
    }
  }

  private scheduleBatchProcessing(): void {
    if (this.batchTimeout) return;

    this.batchTimeout = setTimeout(() => {
      this.batchTimeout = null;
      this.processEventQueue();
    }, this.BATCH_INTERVAL);
  }

  private processEventQueue(): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;

    if (this.config.enableThrottling) {
      const now = Date.now();
      if (now - this.lastSentTime < this.THROTTLE_INTERVAL) {
        // If we're throttling, reschedule the processing
        this.scheduleBatchProcessing();
        return;
      }
    }

    if (this.eventQueue.length > 0) {
      const events = this.eventQueue.splice(0, this.eventQueue.length);
      this.sendImmediately(events);
      this.lastSentTime = Date.now();
    }
  }

  private sendImmediately(events: Event | Event[]): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      // If we can't send, put the events back in the queue
      if (Array.isArray(events)) {
        this.eventQueue.unshift(...events);
      } else {
        this.eventQueue.unshift(events);
      }
      return;
    }

    this.ws.send(JSON.stringify(events));
  }

  disconnect(): void {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }

    if (this.batchTimeout) {
      clearTimeout(this.batchTimeout);
      this.batchTimeout = null;
    }

    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }
}
