// __mocks__/WebSocket.ts
export class WebSocket {
  static CONNECTING = 0;
  static OPEN = 1;
  static CLOSING = 2;
  static CLOSED = 3;

  readyState: number = WebSocket.CONNECTING;
  binaryType: string = 'blob';
  bufferedAmount: number = 0;
  extensions: string = '';
  protocol: string = '';
  url: string;

  onopen: jest.Mock = jest.fn();
  onmessage: jest.Mock = jest.fn();
  onerror: jest.Mock = jest.fn();
  onclose: jest.Mock = jest.fn();
  send: jest.Mock = jest.fn();
  close: jest.Mock = jest.fn(() => {
    this.readyState = WebSocket.CLOSED;
    this.onclose();
  });

  constructor(url: string, _protocols?: string | string[]) {
    this.url = url;
    // Simulate async connection
    setTimeout(() => {
      this.readyState = WebSocket.OPEN;
      this.onopen();
    }, 10);
  }

  addEventListener(type: string, listener: EventListener): void {
    if (type === 'open') this.onopen = listener as any;
    if (type === 'message') this.onmessage = listener as any;
    if (type === 'error') this.onerror = listener as any;
    if (type === 'close') this.onclose = listener as any;
  }

  removeEventListener(type: string, listener: EventListener): void {
    if (type === 'open' && this.onopen === listener) this.onopen = jest.fn();
    if (type === 'message' && this.onmessage === listener)
      this.onmessage = jest.fn();
    if (type === 'error' && this.onerror === listener) this.onerror = jest.fn();
    if (type === 'close' && this.onclose === listener) this.onclose = jest.fn();
  }
}
