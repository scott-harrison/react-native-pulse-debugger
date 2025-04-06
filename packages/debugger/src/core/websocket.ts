class WebSocketManager {
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

  private handleMessage(event: MessageEvent) {
    try {
      const data = JSON.parse(event.data);

      // Dispatch appropriate event based on message type
      switch (data.type) {
        case 'network_request':
          window.dispatchEvent(new CustomEvent('network_request', { detail: data }));
          break;
        case 'network_response':
          window.dispatchEvent(new CustomEvent('network_response', { detail: data }));
          break;
        case 'network_error':
          window.dispatchEvent(new CustomEvent('network_error', { detail: data }));
          break;
        // Add more event types as needed
      }
    } catch (error) {
      console.error('Failed to parse WebSocket message:', error);
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
const wsManager = new WebSocketManager('ws://localhost:8080');
export default wsManager;
