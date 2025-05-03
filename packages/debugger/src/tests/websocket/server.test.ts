import { DebuggerWebSocketServer } from '../../websocket/server';
import { messageHandler } from '../../websocket/messageHandler';
import { sessionManager } from '../../websocket/sessionManager';
import WebSocketModule from 'ws';

// Mock the ws module
jest.mock('ws', () => {
  const mockWSS = {
    on: jest.fn(),
    close: jest.fn(),
  };
  const mockWS = {
    on: jest.fn(),
    send: jest.fn(),
  };
  const WebSocketServerMock = jest.fn(() => mockWSS);
  const WebSocketMock = jest.fn(() => mockWS);
  return {
    default: WebSocketMock,
    WebSocket: WebSocketMock,
    WebSocketServer: WebSocketServerMock,
  };
});

// Mock messageHandler
jest.mock('../../websocket/messageHandler', () => ({
  messageHandler: {
    handleMessage: jest.fn(),
  },
}));

// Mock sessionManager
jest.mock('../../websocket/sessionManager', () => {
  const mockSessionManager = {
    handleDisconnect: jest.fn((ws: WebSocketModule.WebSocket) => {
      const session = Array.from(mockSessionManager.sessions.values()).find(
        (s: any) => s.ws === ws
      );
      if (!session) {
        console.warn('No session found for WebSocket');
        return;
      }
      // Simulate session cleanup
      session.ws = undefined;
      session.status = 'disconnected';
      session.lastActiveAt = new Date().toISOString();
      console.log(`Client disconnected: ${session.deviceId}`);
    }),
    sessions: {
      get: jest.fn(),
      values: jest.fn(() => ({
        find: jest.fn(() => undefined), // Simulate no session found
      })),
      clear: jest.fn(),
    },
  };
  return {
    sessionManager: mockSessionManager,
  };
});

const WebSocketServer = WebSocketModule.WebSocketServer as jest.MockedClass<
  typeof WebSocketModule.WebSocketServer
>;
const WebSocket = WebSocketModule.WebSocket as jest.MockedClass<typeof WebSocketModule.WebSocket>;

describe('DebuggerWebSocketServer', () => {
  let server: DebuggerWebSocketServer;
  let mockWSS: WebSocketModule.WebSocketServer;
  let mockWS: WebSocketModule.WebSocket;
  let mockWSSListeners: { [event: string]: Function[] };
  let mockWSListeners: { [event: string]: Function[] };

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    // Spy on messageHandler.handleMessage
    jest.spyOn(messageHandler, 'handleMessage').mockImplementation(() => {});

    // Spy on sessionManager.handleDisconnect without overriding its implementation
    jest.spyOn(sessionManager, 'handleDisconnect');
    (sessionManager as any).sessions.clear = jest.fn();

    // Setup mock WebSocketServer
    mockWSSListeners = {};
    mockWSS = {
      on: jest.fn((event, callback) => {
        if (!mockWSSListeners[event]) {
          mockWSSListeners[event] = [];
        }
        mockWSSListeners[event].push(callback);
      }),
      close: jest.fn(),
    } as any;

    // Setup mock WebSocket client
    mockWSListeners = {};
    mockWS = {
      on: jest.fn((event, callback) => {
        if (!mockWSListeners[event]) {
          mockWSListeners[event] = [];
        }
        mockWSListeners[event].push(callback);
      }),
      send: jest.fn(),
    } as any;

    // Assign mock implementations
    WebSocketServer.mockImplementation(() => mockWSS);
    WebSocket.mockImplementation(() => mockWS);

    // Create server instance
    server = new DebuggerWebSocketServer();
  });

  afterEach(() => {
    // Reset listeners
    mockWSSListeners = {};
    mockWSListeners = {};

    // Reset spies
    jest.restoreAllMocks();
  });

  describe('constructor', () => {
    it('initializes without starting the server', () => {
      expect(server.getServer()).toBeNull();
      expect(WebSocketServer).not.toHaveBeenCalled();
    });
  });

  describe('start', () => {
    it('starts the WebSocket server and logs startup', () => {
      const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
      server.start();
      expect(WebSocketServer).toHaveBeenCalledWith({ port: 8379 }, expect.any(Function));
      // Simulate the listening callback
      const listeningCallback = WebSocketServer.mock.calls[0][1];
      listeningCallback();
      expect(consoleLogSpy).toHaveBeenCalledWith('WebSocket server started on ws://localhost:8379');
      consoleLogSpy.mockRestore();
    });

    it('handles server errors', () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      server.start();
      // Simulate server error
      const errorCallback = mockWSSListeners['error'][0];
      const mockError = new Error('Server error');
      errorCallback(mockError);
      expect(consoleErrorSpy).toHaveBeenCalledWith('WebSocket server error:', mockError);
      consoleErrorSpy.mockRestore();
    });

    it('handles new client connections', () => {
      const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
      server.start();
      // Simulate connection
      const connectionCallback = mockWSSListeners['connection'][0];
      connectionCallback(mockWS);
      expect(consoleLogSpy).toHaveBeenCalledWith('New client connected');
      consoleLogSpy.mockRestore();
    });

    it('processes incoming messages', () => {
      const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
      server.start();
      // Simulate connection
      const connectionCallback = mockWSSListeners['connection'][0];
      connectionCallback(mockWS);
      // Simulate valid message with a recognized type
      const messageCallback = mockWSListeners['message'][0];
      const message = {
        type: 'handshake',
        timestamp: new Date().toISOString(),
        deviceId: 'device-123',
        platform: 'ios',
      };
      messageCallback(JSON.stringify(message));
      expect(messageHandler.handleMessage).toHaveBeenCalledWith(mockWS, message);
      consoleLogSpy.mockRestore();
      consoleWarnSpy.mockRestore();
    });

    it('handles message parsing errors', () => {
      const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      server.start();
      // Simulate connection
      const connectionCallback = mockWSSListeners['connection'][0];
      connectionCallback(mockWS);
      // Simulate invalid message
      const messageCallback = mockWSListeners['message'][0];
      messageCallback('invalid-json');
      expect(consoleErrorSpy).toHaveBeenCalledWith('Error parsing message:', expect.any(Error));
      const sentMessage = JSON.parse(mockWS.send.mock.calls[0][0]);
      expect(sentMessage).toEqual(
        expect.objectContaining({
          type: 'error',
          message: 'Invalid message format',
          timestamp: expect.any(String),
        })
      );
      consoleLogSpy.mockRestore();
      consoleErrorSpy.mockRestore();
    });

    it('handles client disconnection', () => {
      const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
      server.start();
      // Simulate connection
      const connectionCallback = mockWSSListeners['connection'][0];
      connectionCallback(mockWS);
      // Simulate close
      const closeCallback = mockWSListeners['close'][0];
      closeCallback();
      expect(consoleLogSpy).toHaveBeenCalledWith('Client disconnected');
      expect(sessionManager.handleDisconnect).toHaveBeenCalledWith(mockWS);
      expect(consoleWarnSpy).toHaveBeenCalledWith('No session found for WebSocket');
      consoleLogSpy.mockRestore();
      consoleWarnSpy.mockRestore();
    });

    it('handles client WebSocket errors', () => {
      const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      server.start();
      // Simulate connection
      const connectionCallback = mockWSSListeners['connection'][0];
      connectionCallback(mockWS);
      // Simulate error
      const errorCallback = mockWSListeners['error'][0];
      const mockError = new Error('Client error');
      errorCallback(mockError);
      expect(consoleErrorSpy).toHaveBeenCalledWith('WebSocket error:', mockError);
      consoleLogSpy.mockRestore();
      consoleErrorSpy.mockRestore();
    });

    it('handles server close', () => {
      const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
      server.start();
      // Simulate close
      const closeCallback = mockWSSListeners['close'][0];
      closeCallback();
      expect(consoleLogSpy).toHaveBeenCalledWith('WebSocket server closed');
      expect((sessionManager as any).sessions.clear).toHaveBeenCalled();
      consoleLogSpy.mockRestore();
    });
  });

  describe('getServer', () => {
    it('returns null before start', () => {
      expect(server.getServer()).toBeNull();
    });

    it('returns WebSocketServer instance after start', () => {
      server.start();
      expect(server.getServer()).toBe(mockWSS);
    });
  });

  describe('close', () => {
    it('closes the server if started', () => {
      server.start();
      server.close();
      expect(mockWSS.close).toHaveBeenCalled();
    });

    it('does nothing if server is not started', () => {
      server.close();
      expect(mockWSS.close).not.toHaveBeenCalled();
    });
  });

  describe('singleton', () => {
    it('instantiates the singleton', () => {
      const { debuggerWebSocketServer } = require('../../websocket/server');
      expect(debuggerWebSocketServer).toBeInstanceOf(DebuggerWebSocketServer);
    });
  });
});
