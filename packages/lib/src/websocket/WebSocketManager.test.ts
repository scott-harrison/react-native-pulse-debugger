import { WebSocket, Server } from 'mock-socket';
import { WebSocketManager } from './WebSocketManager';

describe('WebSocketManager', () => {
  let wsManager: WebSocketManager;
  let mockServer: Server;
  const wsUrl = 'ws://localhost:8973';
  let mockWebSocket: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    mockServer = new Server(wsUrl);

    // Create a mock WebSocket constructor with synchronous onopen
    mockWebSocket = jest.fn().mockImplementation(url => {
      const ws = new WebSocket(url);
      // Synchronously trigger onopen
      if (ws.onopen) {
        ws.onopen(new Event('open'));
      }
      return ws;
    });

    // Add required static properties
    Object.defineProperties(mockWebSocket, {
      CONNECTING: { value: 0, configurable: true },
      OPEN: { value: 1, configurable: true },
      CLOSING: { value: 2, configurable: true },
      CLOSED: { value: 3, configurable: true },
    });

    global.WebSocket = mockWebSocket as unknown as typeof WebSocket;
  });

  afterEach(() => {
    mockServer.stop();
    jest.useRealTimers();
  });

  it('should connect to WebSocket server', () => {
    wsManager = new WebSocketManager({
      host: 'localhost',
      port: 8973,
      autoConnect: false,
      retryInterval: 1000,
      enableBatching: true,
      enableThrottling: true,
      monitoring: {
        network: true,
        console: true,
        redux: true,
      },
    });
    wsManager.connect();
    expect(mockWebSocket).toHaveBeenCalledWith(wsUrl);
  });

  it('should send events immediately when batching is disabled', async () => {
    wsManager = new WebSocketManager({
      host: 'localhost',
      port: 8973,
      autoConnect: false,
      retryInterval: 1000,
      enableBatching: false,
      enableThrottling: true,
      monitoring: {
        network: true,
        console: true,
        redux: true,
      },
    });

    const messages: string[] = [];
    mockServer.on('connection', socket => {
      socket.on('message', data => {
        messages.push(data as string);
      });
    });

    wsManager.connect();
    jest.advanceTimersByTime(100);

    // Send events
    wsManager.sendEvent('test1', { data: 'test1' });
    jest.advanceTimersByTime(100);

    wsManager.sendEvent('test2', { data: 'test2' });
    jest.advanceTimersByTime(100);

    wsManager.sendEvent('test3', { data: 'test3' });
    jest.advanceTimersByTime(100);

    // Each event should be sent immediately
    expect(messages.length).toBe(3);

    // Verify each message is a single event, not an array
    messages.forEach(message => {
      const parsed = JSON.parse(message);
      expect(Array.isArray(parsed)).toBe(false);
      expect(parsed).toHaveProperty('type');
      expect(parsed).toHaveProperty('payload');
      expect(parsed).toHaveProperty('timestamp');
    });

    // Verify the content of the messages
    expect(JSON.parse(messages[0])).toEqual({
      type: 'test1',
      payload: { data: 'test1' },
      timestamp: expect.any(Number),
    });
    expect(JSON.parse(messages[1])).toEqual({
      type: 'test2',
      payload: { data: 'test2' },
      timestamp: expect.any(Number),
    });
    expect(JSON.parse(messages[2])).toEqual({
      type: 'test3',
      payload: { data: 'test3' },
      timestamp: expect.any(Number),
    });
  });

  it('should batch events when batching is enabled', () => {
    jest.useFakeTimers();
    wsManager = new WebSocketManager({
      host: 'localhost',
      port: 8973,
      autoConnect: false,
      retryInterval: 1000,
      enableBatching: true,
      enableThrottling: true,
      monitoring: {
        network: true,
        console: true,
        redux: true,
      },
    });

    let receivedMessage: string | null = null;
    mockServer.on('connection', socket => {
      socket.on('message', data => {
        receivedMessage = data as string;
      });
    });

    wsManager.connect();
    wsManager.sendEvent('test1', { data: 'test1' });
    wsManager.sendEvent('test2', { data: 'test2' });
    wsManager.sendEvent('test3', { data: 'test3' });

    expect(receivedMessage).toBeNull();
    jest.advanceTimersByTime(100);

    // Parse the received message and compare the object structure
    expect(JSON.parse(receivedMessage!)).toEqual([
      {
        type: 'test1',
        payload: { data: 'test1' },
        timestamp: expect.any(Number),
      },
      {
        type: 'test2',
        payload: { data: 'test2' },
        timestamp: expect.any(Number),
      },
      {
        type: 'test3',
        payload: { data: 'test3' },
        timestamp: expect.any(Number),
      },
    ]);
  });

  it('should throttle events when throttling is enabled', () => {
    jest.useFakeTimers();
    wsManager = new WebSocketManager({
      host: 'localhost',
      port: 8973,
      autoConnect: false,
      retryInterval: 1000,
      enableBatching: true,
      enableThrottling: true,
      monitoring: {
        network: true,
        console: true,
        redux: true,
      },
    });

    const messages: string[] = [];
    mockServer.on('connection', socket => {
      socket.on('message', data => {
        messages.push(data as string);
      });
    });

    wsManager.connect();
    wsManager.sendEvent('test1', { data: 'test1' });
    jest.advanceTimersByTime(50);
    wsManager.sendEvent('test2', { data: 'test2' });
    jest.advanceTimersByTime(50);
    wsManager.sendEvent('test3', { data: 'test3' });

    // First batch should be sent immediately
    expect(messages.length).toBe(1);

    // Advance past the throttle interval
    jest.advanceTimersByTime(150);

    // Second batch should be sent after throttle interval
    expect(messages.length).toBe(2);
  });

  it('should queue events when connection is not available', () => {
    jest.useFakeTimers();
    wsManager = new WebSocketManager({
      host: 'localhost',
      port: 8973,
      autoConnect: false,
      retryInterval: 1000,
      enableBatching: true,
      enableThrottling: true,
      monitoring: {
        network: true,
        console: true,
        redux: true,
      },
    });

    const messages: string[] = [];
    mockServer.on('connection', socket => {
      socket.on('message', data => {
        messages.push(data as string);
      });
    });

    wsManager.connect();
    // Simulate connection closed
    mockServer.stop();
    wsManager.sendEvent('test1', { data: 'test1' });
    wsManager.sendEvent('test2', { data: 'test2' });

    expect(messages.length).toBe(0);

    // Restart server to simulate reconnection
    mockServer = new Server(wsUrl);
    mockServer.on('connection', socket => {
      socket.on('message', data => {
        messages.push(data as string);
      });
    });

    // Advance timers to allow reconnection and message processing
    jest.advanceTimersByTime(100);
    expect(messages.length).toBeGreaterThan(0);
  });
});
