import { MessageHandler } from '../../websocket/messageHandler';
import { sessionManager } from '../../websocket/sessionManager';
import {
  HandshakeMessage,
  AppInfoMessage,
  ConsoleMessage,
  NetworkEventMessage,
  ReduxEventMessage,
  MessageType,
} from '@pulse/shared-types';
import WebSocket from 'ws';

// Mock WebSocket
const mockWsSend = jest.fn();
const mockWs = { send: mockWsSend } as unknown as WebSocket;

// Mock sessionManager
jest.mock('../../websocket/sessionManager', () => ({
  sessionManager: {
    handleConnect: jest.fn(),
    updateAppMetadata: jest.fn(),
    handleDisconnect: jest.fn(),
  },
}));

// Mock dispatch function from store
jest.mock('../../store', () => ({
  dispatch: jest.fn(),
  useConsoleStore: jest.fn(),
  useNetworkStore: jest.fn(),
  useReduxStore: jest.fn(),
  useConnectionStore: jest.fn(),
}));

const messageHandler = new MessageHandler();

describe('MessageHandler', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Message Parsing and Validation', () => {
    it('rejects malformed messages without type or timestamp', () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      const malformedMessage = { foo: 'bar' };
      messageHandler.handleMessage(mockWs, malformedMessage);
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Error processing message:',
        new Error('Invalid message: missing type or timestamp')
      );
      consoleErrorSpy.mockRestore();
    });

    it('logs and ignores unknown message types', () => {
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
      const unknownMessage = { type: 'unknown', timestamp: new Date().toISOString() };
      messageHandler.handleMessage(mockWs, unknownMessage);
      expect(consoleWarnSpy).toHaveBeenCalledWith('Unknown message type:', unknownMessage.type);
      consoleWarnSpy.mockRestore();
    });
  });

  describe('Handshake Handling', () => {
    it('processes a valid HandshakeMessage and sends HandshakeAcknowledgeMessage', () => {
      const handshakeMessage: HandshakeMessage = {
        type: 'handshake',
        timestamp: new Date().toISOString(),
        deviceId: 'device-123',
        platform: 'ios',
      };
      messageHandler.handleMessage(mockWs, handshakeMessage);
      expect(sessionManager.handleConnect).toHaveBeenCalledWith(mockWs, 'device-123', 'ios');
      const sentMessage = JSON.parse(mockWsSend.mock.calls[0][0]);
      expect(sentMessage).toEqual(
        expect.objectContaining({
          type: 'handshake_acknowledge',
          status: 'connected',
          timestamp: expect.any(String),
        })
      );
    });

    it('rejects an invalid HandshakeMessage missing deviceId', () => {
      const invalidHandshake: Partial<HandshakeMessage> = {
        type: 'handshake',
        timestamp: new Date().toISOString(),
        platform: 'ios',
      };
      messageHandler.handleMessage(mockWs, invalidHandshake);
      expect(sessionManager.handleConnect).not.toHaveBeenCalled();
      const sentMessage = JSON.parse(mockWsSend.mock.calls[0][0]);
      expect(sentMessage).toEqual(
        expect.objectContaining({
          type: 'handshake_acknowledge',
          status: 'rejected',
          reason: 'Missing deviceId or platform',
          timestamp: expect.any(String),
        })
      );
    });
  });

  describe('AppInfoMessage Handling', () => {
    it('processes a valid AppInfoMessage and updates session and store', () => {
      const appInfoMessage: AppInfoMessage = {
        type: 'app_info',
        timestamp: new Date().toISOString(),
        data: {
          appName: 'TestApp',
          appVersion: '1.0.0',
          buildNumber: '100',
          platform: 'ios',
          isExpo: true,
          deviceInfo: {
            model: 'iPhone',
            osVersion: '14.0',
          },
        },
      };
      messageHandler.handleMessage(mockWs, appInfoMessage);
      expect(sessionManager.updateAppMetadata).toHaveBeenCalledWith(mockWs, appInfoMessage.data);
      expect(require('../../store').dispatch).toHaveBeenCalledWith({
        type: 'UPDATE_APP_INFO',
        payload: appInfoMessage.data,
      });
    });

    it('logs and ignores an invalid AppInfoMessage', () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      const invalidAppInfo: Partial<AppInfoMessage> = {
        type: 'app_info',
        timestamp: new Date().toISOString(),
        data: {
          appVersion: '1.0.0',
        },
      };
      messageHandler.handleMessage(mockWs, invalidAppInfo);
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Invalid AppInfoMessage: missing required fields'
      );
      expect(sessionManager.updateAppMetadata).not.toHaveBeenCalled();
      expect(require('../../store').dispatch).not.toHaveBeenCalled();
      consoleErrorSpy.mockRestore();
    });
  });

  describe('Event Message Handling', () => {
    it('processes a valid ConsoleMessage and updates store', () => {
      const consoleMessage: ConsoleMessage = {
        type: 'console',
        timestamp: new Date().toISOString(),
        level: 'log',
        message: 'Test log message',
      };
      messageHandler.handleMessage(mockWs, consoleMessage);
      expect(require('../../store').dispatch).toHaveBeenCalledWith({
        type: 'ADD_CONSOLE',
        payload: consoleMessage,
      });
    });

    it('logs and ignores an invalid ConsoleMessage', () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      const invalidConsoleMessage: Partial<ConsoleMessage> = {
        type: 'console',
        timestamp: new Date().toISOString(),
        message: 'Test log message',
      };
      messageHandler.handleMessage(mockWs, invalidConsoleMessage);
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Invalid ConsoleMessage: missing required fields'
      );
      expect(require('../../store').dispatch).not.toHaveBeenCalled();
      consoleErrorSpy.mockRestore();
    });

    it('processes a valid NetworkEventMessage and updates store', () => {
      const networkEventMessage: NetworkEventMessage = {
        type: 'network_event',
        timestamp: new Date().toISOString(),
        method: 'GET',
        url: 'https://example.com/api',
        status: 200,
        duration: 123,
        requestHeaders: { 'Content-Type': 'application/json' },
        responseHeaders: { 'Content-Type': 'application/json' },
        requestBody: JSON.stringify({ id: 1 }),
        responseBody: JSON.stringify({ success: true }),
      };
      messageHandler.handleMessage(mockWs, networkEventMessage);
      expect(require('../../store').dispatch).toHaveBeenCalledWith({
        type: 'ADD_NETWORK_EVENT',
        payload: networkEventMessage,
      });
    });

    it('logs and ignores an invalid NetworkEventMessage', () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      const invalidNetworkEventMessage: Partial<NetworkEventMessage> = {
        type: 'network_event',
        timestamp: new Date().toISOString(),
        url: 'https://example.com/api',
        status: 200,
      };
      messageHandler.handleMessage(mockWs, invalidNetworkEventMessage);
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Invalid NetworkEventMessage: missing required fields'
      );
      expect(require('../../store').dispatch).not.toHaveBeenCalled();
      consoleErrorSpy.mockRestore();
    });

    it('processes a valid ReduxEventMessage and updates store', () => {
      const reduxEventMessage: ReduxEventMessage = {
        type: MessageType.ReduxEvent,
        timestamp: new Date().toISOString(),
        action: {
          type: 'TEST_ACTION',
          payload: { test: 'data' },
        },
        stateDiff: {
          before: { test: 'before' },
          after: { test: 'data' },
        },
      };
      messageHandler.handleMessage(mockWs, reduxEventMessage);
      expect(require('../../store').dispatch).toHaveBeenCalledWith({
        type: 'ADD_REDUX_EVENT',
        payload: reduxEventMessage,
      });
    });

    it('logs and ignores an invalid ReduxEventMessage', () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      const invalidReduxEventMessage: Partial<ReduxEventMessage> = {
        type: MessageType.ReduxEvent,
        timestamp: new Date().toISOString(),
        stateDiff: {
          before: { test: 'before' },
          after: { test: 'data' },
        },
      };
      messageHandler.handleMessage(mockWs, invalidReduxEventMessage);
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Invalid ReduxEventMessage: missing required fields'
      );
      expect(require('../../store').dispatch).not.toHaveBeenCalled();
      consoleErrorSpy.mockRestore();
    });
  });

  describe('Error Handling', () => {
    it('catches and logs parsing errors', () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      const invalidMessage = 'not-a-json-string';
      messageHandler.handleMessage(mockWs, invalidMessage);
      expect(consoleErrorSpy).toHaveBeenCalledWith('Error processing message:', expect.any(Error));
      consoleErrorSpy.mockRestore();
    });
  });
});
