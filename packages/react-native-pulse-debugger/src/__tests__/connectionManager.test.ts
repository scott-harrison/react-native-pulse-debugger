import { ConnectionManager } from '../connectionManager';
import { MockWebSocket } from './mocks/MockWebSocket';

// Mock global WebSocket
(global as any).WebSocket = MockWebSocket;

describe('ConnectionManager', () => {
  let connectionManager: ConnectionManager;
  const TEST_URL = 'ws://localhost:8080';

  beforeEach(() => {
    // Clear mock instances
    MockWebSocket.instances = [];

    // Create new connection manager
    connectionManager = new ConnectionManager({ url: TEST_URL });

    // Mock timers
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
    // Stop the connection manager without creating new instances
    connectionManager.stop();
    MockWebSocket.instances = [];
  });

  test('should initialize with disconnected state', () => {
    // Access private state for testing
    const state = (connectionManager as any).state;
    expect(state).toBe('disconnected');
  });

  test('should connect to WebSocket server', () => {
    connectionManager.connect();

    expect(MockWebSocket.instances.length).toBe(1);
    expect(MockWebSocket.instances[0]?.url).toBe(TEST_URL);
  });

  test('should emit connect event when connection is established', () => {
    const connectHandler = jest.fn();
    connectionManager.on(ConnectionManager.EVENTS.CONNECT, connectHandler);

    connectionManager.connect();
    MockWebSocket.instances[0]?.simulateOpen();

    expect(connectHandler).toHaveBeenCalled();
  });

  test('should emit disconnect event when connection is closed', () => {
    const disconnectHandler = jest.fn();
    connectionManager.on(
      ConnectionManager.EVENTS.DISCONNECT,
      disconnectHandler
    );

    connectionManager.connect();
    MockWebSocket.instances[0]?.simulateOpen();
    MockWebSocket.instances[0]?.simulateClose();

    expect(disconnectHandler).toHaveBeenCalled();
  });

  test('should emit error event when WebSocket error occurs', () => {
    const errorHandler = jest.fn();
    connectionManager.on(ConnectionManager.EVENTS.ERROR, errorHandler);

    connectionManager.connect();
    const testError = new Event('error');
    MockWebSocket.instances[0]?.simulateError(testError);

    expect(errorHandler).toHaveBeenCalledWith(testError);
  });

  test('should emit message event when data is received', () => {
    const messageHandler = jest.fn();
    connectionManager.on(ConnectionManager.EVENTS.MESSAGE, messageHandler);

    connectionManager.connect();
    MockWebSocket.instances[0]?.simulateOpen();
    MockWebSocket.instances[0]?.simulateMessage('test message');

    expect(messageHandler).toHaveBeenCalledWith('test message');
  });

  test('should emit state change events when connection state changes', () => {
    const stateChangeHandler = jest.fn();
    connectionManager.on(
      ConnectionManager.EVENTS.STATE_CHANGE,
      stateChangeHandler
    );

    connectionManager.connect();
    expect(stateChangeHandler).toHaveBeenCalledWith('connecting');

    MockWebSocket.instances[0]?.simulateOpen();
    expect(stateChangeHandler).toHaveBeenCalledWith('connected');

    MockWebSocket.instances[0]?.simulateClose();
    expect(stateChangeHandler).toHaveBeenCalledWith('disconnected');
  });

  test('should attempt to reconnect when connection is lost', () => {
    // Initial connection
    connectionManager.connect();
    const initialInstanceCount = MockWebSocket.instances.length;
    MockWebSocket.instances[0]?.simulateOpen();

    // Simulate connection loss
    MockWebSocket.instances[0]?.simulateClose();

    // The connection manager will attempt to reconnect immediately
    // and then again after the polling interval
    expect(MockWebSocket.instances.length).toBe(initialInstanceCount + 1);

    // Fast-forward timers to trigger another reconnection
    jest.advanceTimersByTime(1000);

    // Should have created another WebSocket connection
    expect(MockWebSocket.instances.length).toBe(initialInstanceCount + 2);
  });

  test('should stop polling and close connection when stop is called', () => {
    connectionManager.connect();
    MockWebSocket.instances[0]?.simulateOpen();

    const initialInstanceCount = MockWebSocket.instances.length;

    // Stop the connection manager
    connectionManager.stop();

    // Fast-forward timers
    jest.advanceTimersByTime(1000);

    // Should not create new connections after stop
    expect(MockWebSocket.instances.length).toBe(initialInstanceCount);
  });

  test('should send data successfully when connected', () => {
    connectionManager.connect();
    MockWebSocket.instances[0]?.simulateOpen();

    const sendSpy = jest.spyOn(MockWebSocket.instances[0]!, 'send');

    const result = connectionManager.send({ type: 'test', data: 'message' });

    expect(result).toBe(true);
    expect(sendSpy).toHaveBeenCalledWith(
      JSON.stringify({ type: 'test', data: 'message' })
    );
  });

  test('should return false when sending data while disconnected', () => {
    const result = connectionManager.send({ type: 'test', data: 'message' });

    expect(result).toBe(false);
  });
});
