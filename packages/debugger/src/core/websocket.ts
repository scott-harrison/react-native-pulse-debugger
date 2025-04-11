export class WebSocketManager {
  private ws: WebSocket | null = null;
  private reconnectTimeout: NodeJS.Timeout | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;

  constructor(private url: string) {
    this.connect();
    this.setupEventListeners();
  }

  private connect() {
    try {
      this.ws = new WebSocket(this.url);
      this.ws.onopen = this.handleOpen.bind(this);
      this.ws.onclose = this.handleClose.bind(this);
      this.ws.onmessage = this.handleMessage.bind(this);
      this.ws.onerror = this.handleError.bind(this);
    } catch (error) {
      console.error('Failed to connect to WebSocket:', error);
      this.handleClose();
    }
  }

  private setupEventListeners() {
    window.addEventListener('send_message', ((e: CustomEvent) => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify(e.detail));
      }
    }) as EventListener);
  }

  private handleOpen() {
    this.reconnectAttempts = 0;
    this.dispatchConnectionState('connected');
  }

  private handleClose() {
    this.dispatchConnectionState('disconnected');
    this.attemptReconnect();
  }

  private handleError(error: Event) {
    console.error('WebSocket error:', error);
    this.dispatchConnectionState('disconnected');
  }

  private dispatchEvent(type: string, payload: any) {
    console.log('[Pulse Debugger] WebSocketManager dispatching event:', { type, payload });
    window.dispatchEvent(new CustomEvent(type, { detail: payload }));
  }

  private handleMessage(event: MessageEvent) {
    try {
      const data = JSON.parse(event.data);
      console.log('[Pulse Debugger] WebSocketManager received message:', data);

      switch (data.type) {
        case 'network_request':
          this.dispatchEvent('network_request', data.payload);
          console.log('[Pulse Debugger] Dispatched network_request event');
          break;
        case 'network_response':
          this.dispatchEvent('network_response', data.payload);
          console.log('[Pulse Debugger] Dispatched network_response event');
          break;
        case 'network_error':
          this.dispatchEvent('network_error', data.payload);
          console.log('[Pulse Debugger] Dispatched network_error event');
          break;
        case 'console_log':
          // The payload is the entire log object
          console.log('[Pulse Debugger] Processing console_log event:', {
            id: data.payload.id,
            level: data.payload.level,
            message: data.payload.message,
            hasData: !!data.payload.data,
            hasStack: !!data.payload.stack,
            timestamp: data.payload.timestamp,
          });

          // Validate the payload
          if (!data.payload.id || !data.payload.level || !data.payload.message) {
            console.error('[Pulse Debugger] Invalid console log payload:', data.payload);
            break;
          }

          this.dispatchEvent('console_log', data.payload);
          console.log('[Pulse Debugger] Dispatched console_log event:', data.payload);
          break;
        default:
          console.warn('[Pulse Debugger] Unknown message type:', data.type);
      }
    } catch (error) {
      console.error('[Pulse Debugger] Error handling message:', error);
    }
  }

  private attemptReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Max reconnection attempts reached');
      return;
    }

    this.dispatchConnectionState('connecting');
    this.reconnectAttempts++;

    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
    }

    this.reconnectTimeout = setTimeout(() => {
      this.connect();
    }, this.reconnectDelay * this.reconnectAttempts);
  }

  private dispatchConnectionState(state: 'connected' | 'disconnected' | 'connecting') {
    window.dispatchEvent(new CustomEvent('connection_state_change', { detail: state }));
  }

  public disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
  }
}

// Create and export a singleton instance
const wsManager = new WebSocketManager('ws://localhost:8973');
export default wsManager;
