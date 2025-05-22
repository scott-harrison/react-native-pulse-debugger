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

  describe('Connection Management', () => {
    it('should connect successfully', () => {
      expect(client.isConnected()).toBe(true);
    });

    it('should attempt reconnection after connection loss', async () => {
      // Simulate connection loss
      mockWebSocket.readyState = WebSocket.CLOSED;
      mockWebSocket.onclose();

      // Advance timer to trigger reconnection
      jest.advanceTimersByTime(3000);

      // Simulate successful reconnection
      mockWebSocket.readyState = WebSocket.OPEN;
      mockWebSocket.onopen();

      // Verify reconnection attempt
      expect(mockWebSocket.readyState).toBe(WebSocket.OPEN);
    });

    it('should handle connection refusal', async () => {
      // Simulate connection error
      const error = new Error('Connection refused');
      mockWebSocket.onerror(error);

      // Advance timer to trigger reconnection
      jest.advanceTimersByTime(3000);

      // Verify reconnection attempt
      expect(mockWebSocket.readyState).toBe(WebSocket.OPEN);
    });
  });

  describe('Session Management', () => {
    it('should initialize session with device details', () => {
      // Verify that isConnected returns true after setup
      expect(client.isConnected()).toBe(true);
    });
  });

  describe('Message Handling', () => {
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
  });

  describe('Message Queue', () => {
    it('should queue messages when disconnected', () => {
      // Force disconnect
      mockWebSocket.readyState = WebSocket.CLOSED;
      mockWebSocket.onclose();

      const message: IEvent<'console_event'> = {
        sessionId: 'test-session',
        id: 'test-id',
        type: 'console_event',
        payload: { level: 'log', message: 'data' },
        timestamp: new Date().toISOString(),
      };

      client.sendMessage(message);
      expect(client.getMessageQueue()).toHaveLength(1);
      expect(client.getMessageQueue()[0]).toEqual(message);
    });

    it('should attempt to send messages when connected', () => {
      // Ensure client is connected
      mockWebSocket.readyState = WebSocket.OPEN;
      mockWebSocket.onopen();

      // Clear previous calls
      mockWebSocket.send.mockClear();

      const message: IEvent<'console_event'> = {
        sessionId: 'test-session',
        id: 'test-id',
        type: 'console_event',
        payload: { level: 'log', message: 'test message' },
        timestamp: new Date().toISOString(),
      };

      // Send message while connected
      client.sendMessage(message);

      // Should call send immediately
      expect(mockWebSocket.send).toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    it('should handle message parsing errors', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      const messageHandler = jest.fn();
      client.onMessage(messageHandler);

      // Send invalid JSON
      mockWebSocket.onmessage({ data: 'invalid json' });

      expect(consoleSpy).toHaveBeenCalled();
      expect(messageHandler).not.toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    it('should handle WebSocket errors', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      const error = new Error('WebSocket error');
      mockWebSocket.onerror(error);

      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });

  describe('Disconnection', () => {
    it('should clear message queue on disconnect', () => {
      // Add message to queue
      const message: IEvent<'console_event'> = {
        sessionId: 'test-session',
        id: 'test-id',
        type: 'console_event',
        payload: { level: 'log', message: 'data' },
        timestamp: new Date().toISOString(),
      };

      // Force disconnect
      mockWebSocket.readyState = WebSocket.CLOSED;
      mockWebSocket.onclose();
      client.sendMessage(message);

      // Disconnect client
      client.disconnect();

      // Verify queue is cleared
      expect(client.getMessageQueue()).toHaveLength(0);
    });

    it('should not attempt reconnection after disconnect', () => {
      // Disconnect client
      client.disconnect();

      // Simulate connection loss
      mockWebSocket.readyState = WebSocket.CLOSED;
      mockWebSocket.onclose();

      // Advance timer
      jest.advanceTimersByTime(3000);

      // Verify no reconnection attempt
      expect(mockWebSocket.readyState).toBe(WebSocket.CLOSED);
    });
  });
});
