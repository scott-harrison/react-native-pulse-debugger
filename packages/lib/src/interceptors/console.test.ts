import { consoleMiddleware } from './console';
import { WebSocketClient } from '../client/WebSocketClient';
import { generateUuid } from '../utils/generateUUID';

// Mock dependencies
jest.mock('../client/WebSocketClient');
jest.mock('../utils/generateUUID');

describe('Console Middleware', () => {
  // Mock client
  let mockClient: jest.Mocked<WebSocketClient>;

  // Mock date
  const mockDate = '2023-01-01T00:00:00.000Z';

  // Intercepted console
  let interceptedConsole: Console;

  // Keep track of the original console methods
  const originalConsoleMethods = {
    log: console.log,
    info: console.info,
    warn: console.warn,
    error: console.error,
    debug: console.debug,
    assert: console.assert,
  };

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    // Mock generateUuid
    (generateUuid as jest.Mock).mockReturnValue('test-uuid');

    // Mock date
    jest.spyOn(Date.prototype, 'toISOString').mockReturnValue(mockDate);

    // Set up mock console methods to avoid actual console output during tests
    console.log = jest.fn();
    console.info = jest.fn();
    console.warn = jest.fn();
    console.error = jest.fn();
    console.debug = jest.fn();
    console.assert = jest.fn();

    // Setup client mock
    mockClient = {
      sendMessage: jest.fn(),
    } as unknown as jest.Mocked<WebSocketClient>;

    // Create middleware
    interceptedConsole = consoleMiddleware(mockClient);
  });

  afterEach(() => {
    // Restore console methods
    console.log = originalConsoleMethods.log;
    console.info = originalConsoleMethods.info;
    console.warn = originalConsoleMethods.warn;
    console.error = originalConsoleMethods.error;
    console.debug = originalConsoleMethods.debug;
    console.assert = originalConsoleMethods.assert;
  });

  describe('console.log', () => {
    it('should send string message to client', () => {
      interceptedConsole.log('Test message');

      // Should call send message to client
      expect(mockClient.sendMessage).toHaveBeenCalledWith({
        type: 'console_event',
        id: 'test-uuid',
        timestamp: mockDate,
        payload: {
          level: 'log',
          message: 'Test message',
          data: [],
        },
      });
    });

    it('should handle multiple arguments', () => {
      interceptedConsole.log('Hello', 'world');

      expect(mockClient.sendMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          payload: {
            level: 'log',
            message: 'Hello world',
            data: [],
          },
        })
      );
    });

    it('should extract objects into data field', () => {
      const testObj = { name: 'test' };
      interceptedConsole.log('Object:', testObj);

      expect(mockClient.sendMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          payload: {
            level: 'log',
            message: 'Object:',
            data: [testObj],
          },
        })
      );
    });

    it('should handle primitive types', () => {
      interceptedConsole.log(123, true, null, undefined);

      expect(mockClient.sendMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          payload: {
            level: 'log',
            message: '123 true null undefined',
            data: [],
          },
        })
      );
    });

    it('should handle error when client throws', () => {
      // Setup a fresh debug spy
      console.debug = jest.fn();

      // Make client throw
      const testError = new Error('Client error');
      mockClient.sendMessage.mockImplementation(() => {
        throw testError;
      });

      // Should not throw
      expect(() => interceptedConsole.log('test')).not.toThrow();

      // Should log debug error
      expect(console.debug).toHaveBeenCalled();
    });
  });

  describe('console.info', () => {
    it('should send info level messages', () => {
      interceptedConsole.info('Info message');

      expect(mockClient.sendMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          payload: {
            level: 'info',
            message: 'Info message',
            data: [],
          },
        })
      );
    });
  });

  describe('console.warn', () => {
    it('should send warn level messages', () => {
      interceptedConsole.warn('Warning message');

      expect(mockClient.sendMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          payload: {
            level: 'warn',
            message: 'Warning message',
            data: [],
          },
        })
      );
    });
  });

  describe('console.error', () => {
    it('should send error level messages', () => {
      interceptedConsole.error('Error message');

      expect(mockClient.sendMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          payload: {
            level: 'error',
            message: 'Error message',
            data: [],
          },
        })
      );
    });

    it('should include stack trace for Error objects', () => {
      const testError = new Error('Test error');
      interceptedConsole.error('Error occurred:', testError);

      expect(mockClient.sendMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          payload: expect.objectContaining({
            level: 'error',
            message: 'Error occurred:',
            data: [testError],
            stack: expect.any(String),
          }),
        })
      );
    });
  });

  describe('console.debug', () => {
    it('should send debug level messages', () => {
      interceptedConsole.debug('Debug message');

      expect(mockClient.sendMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          payload: {
            level: 'debug',
            message: 'Debug message',
            data: [],
          },
        })
      );
    });
  });

  describe('console.assert', () => {
    it('should not send message when condition is true', () => {
      interceptedConsole.assert(true, 'This should not be sent');

      expect(mockClient.sendMessage).not.toHaveBeenCalled();
    });

    it('should send message when condition is false', () => {
      interceptedConsole.assert(false, 'Assertion failed message');

      expect(mockClient.sendMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          payload: expect.objectContaining({
            level: 'assert',
            message: 'Assertion failed message',
          }),
        })
      );
    });

    it('should use default message when no message provided', () => {
      interceptedConsole.assert(false);

      expect(mockClient.sendMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          payload: expect.objectContaining({
            level: 'assert',
            message: 'Assertion failed',
          }),
        })
      );
    });
  });

  describe('processArgs', () => {
    it('should correctly process mixed argument types', () => {
      const obj = { id: 1 };
      const arr = [1, 2, 3];

      interceptedConsole.log('String', 123, true, null, undefined, obj, arr);

      expect(mockClient.sendMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          payload: {
            level: 'log',
            message: 'String 123 true null undefined',
            data: [obj, arr],
          },
        })
      );
    });
  });
});
