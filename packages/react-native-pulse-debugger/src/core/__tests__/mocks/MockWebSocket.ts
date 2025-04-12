/**
 * Mock WebSocket implementation for testing
 * Provides methods to simulate WebSocket events and track instances
 */
export class MockWebSocket {
  // WebSocket constants
  public static readonly CONNECTING = 0;
  public static readonly OPEN = 1;
  public static readonly CLOSING = 2;
  public static readonly CLOSED = 3;

  public static instances: MockWebSocket[] = [];
  public onopen: (() => void) | null = null;
  public onclose: (() => void) | null = null;
  public onerror: ((error: Event) => void) | null = null;
  public onmessage: ((event: WebSocketMessageEvent) => void) | null = null;
  public readyState = MockWebSocket.CONNECTING;

  constructor(public url: string) {
    MockWebSocket.instances.push(this);
  }

  send(_data: string): void {
    // Mock implementation
  }

  close(): void {
    this.readyState = MockWebSocket.CLOSED;
    if (this.onclose) this.onclose();
  }

  // Helper methods for testing
  simulateOpen(): void {
    this.readyState = MockWebSocket.OPEN;
    if (this.onopen) this.onopen();
  }

  simulateClose(): void {
    this.readyState = MockWebSocket.CLOSED;
    if (this.onclose) this.onclose();
  }

  simulateError(error: Event): void {
    if (this.onerror) this.onerror(error);
  }

  simulateMessage(data: string): void {
    if (this.onmessage) {
      this.onmessage({ data } as WebSocketMessageEvent);
    }
  }
}
