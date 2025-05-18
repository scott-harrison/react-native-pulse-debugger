import type { IEvent } from '@pulse/shared-types';
import { WebSocketClient } from './WebSocketClient';

describe('WebSocketClient', () => {
  let client: WebSocketClient;
  let mockWebSocket: {
    readyState: number;
    send: jest.Mock;
    close: jest.Mock;
    onopen: jest.Mock;
    onmessage: jest.Mock;
    onerror: jest.Mock;
    onclose: jest.Mock;
  };

  beforeEach(() => {
    jest.useFakeTimers();
    // Create a new mock WebSocket instance
    mockWebSocket = {
      readyState: WebSocket.CONNECTING,
      send: jest.fn(),
      close: jest.fn(),
      onopen: jest.fn(),
      onmessage: jest.fn(),
      onerror: jest.fn(),
      onclose: jest.fn(),
    };
    // Inject mock via factory
    client = new WebSocketClient(
      'ws://localhost:8379',
      () => mockWebSocket as any
    );
    // Simulate async connection
    setTimeout(() => {
      mockWebSocket.readyState = WebSocket.OPEN;
      mockWebSocket.onopen();
    }, 10);
    jest.advanceTimersByTime(10);
  });

  afterEach(() => {
    jest.useRealTimers();
    client.disconnect();
  });

  it('should connect successfully', () => {
    expect(client.isConnected()).toBe(true);
  });

  it('should send a message when connected', () => {
    const message: IEvent<'console_event'> = {
      sessionId: 'mock-ios-id-mock-app-name',
      id: 'test-id',
      type: 'console_event',
      payload: {
        level: 'log',
        message: 'data',
      },
      timestamp: new Date().toISOString(),
    };
    client.sendMessage(message);
    expect(mockWebSocket.send).toHaveBeenCalledWith(JSON.stringify(message));
  });

  it('should handle incoming messages', () => {
    const messageHandler = jest.fn();
    client.onMessage(messageHandler);
    const testMessage = {
      data: JSON.stringify({ type: 'RESPONSE', payload: 'data' }),
    };
    mockWebSocket.onmessage(testMessage);
    expect(messageHandler).toHaveBeenCalledWith({
      type: 'RESPONSE',
      payload: 'data',
    });
  });

  it('should attempt to reconnect after unexpected disconnection', () => {
    const createWebSocketSpy = jest.fn(() => mockWebSocket);
    client = new WebSocketClient(
      'ws://localhost:8379',
      createWebSocketSpy as unknown as () => WebSocket
    );
    setTimeout(() => {
      mockWebSocket.readyState = WebSocket.OPEN;
      mockWebSocket.onopen();
    }, 10);
    jest.advanceTimersByTime(10); // Initial connection
    mockWebSocket.readyState = WebSocket.CLOSED;
    mockWebSocket.onclose();
    jest.advanceTimersByTime(3000); // Reconnect interval
    expect(createWebSocketSpy).toHaveBeenCalledTimes(2); // Initial + reconnect
  });

  it('should queue messages when disconnected and send them on reconnection', () => {
    mockWebSocket.readyState = WebSocket.CLOSED; // Simulate disconnected
    const message: Message = { type: 'QUEUED', payload: 'data' };
    client.sendMessage(message);
    expect(client.getMessageQueue()).toContainEqual(message);
    // Simulate reconnection
    mockWebSocket.readyState = WebSocket.OPEN;
    mockWebSocket.onopen();
    expect(mockWebSocket.send).toHaveBeenCalledWith(JSON.stringify(message));
  });

  it('should not attempt to reconnect after manual disconnection', () => {
    const createWebSocketSpy = jest.fn(() => mockWebSocket);
    client = new WebSocketClient(
      'ws://localhost:8379',
      createWebSocketSpy as unknown as () => WebSocket
    );
    setTimeout(() => {
      mockWebSocket.readyState = WebSocket.OPEN;
      mockWebSocket.onopen();
    }, 10);
    jest.advanceTimersByTime(10); // Initial connection
    client.disconnect();
    mockWebSocket.readyState = WebSocket.CLOSED;
    mockWebSocket.onclose();
    jest.advanceTimersByTime(3000); // Reconnect interval
    expect(createWebSocketSpy).toHaveBeenCalledTimes(1); // No reconnect
    expect(mockWebSocket.close).toHaveBeenCalled();
  });

  it('should handle errors and attempt to reconnect', () => {
    const createWebSocketSpy = jest.fn(() => mockWebSocket);
    client = new WebSocketClient(
      'ws://localhost:8379',
      createWebSocketSpy as unknown as () => WebSocket
    );
    setTimeout(() => {
      mockWebSocket.readyState = WebSocket.OPEN;
      mockWebSocket.onopen();
    }, 10);
    jest.advanceTimersByTime(10); // Initial connection
    mockWebSocket.onerror(new Error('Connection failed'));
    jest.advanceTimersByTime(3000); // Reconnect interval
    expect(createWebSocketSpy).toHaveBeenCalledTimes(2); // Initial + reconnect
  });
});
