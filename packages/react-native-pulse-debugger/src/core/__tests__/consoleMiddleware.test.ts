import { pulseConsoleMiddleware } from '../consoleMiddleware';
import { OutgoingEventType } from '../enums/events';
import { initializePulse } from '../connectionManager';
import { MockWebSocket } from './mocks/MockWebSocket';

(global as any).WebSocket = MockWebSocket;

type PartialConsole = Pick<
  typeof console,
  'log' | 'info' | 'warn' | 'error' | 'debug'
>;

describe('Console Middleware', () => {
  const TEST_URL = 'ws://localhost:8080';
  let originalConsole: PartialConsole;
  let mockConsole: PartialConsole;
  let sendSpy: jest.SpyInstance;
  let pulse: ReturnType<typeof initializePulse>;

  beforeEach(() => {
    MockWebSocket.instances = [];
    jest.useFakeTimers();

    originalConsole = {
      log: jest.fn(),
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      debug: jest.fn(),
    };

    initializePulse({ url: TEST_URL });
    pulse = initializePulse({ url: TEST_URL });
    pulse.connect();
    MockWebSocket.instances[0]?.simulateOpen();

    mockConsole = pulseConsoleMiddleware(originalConsole);

    sendSpy = jest.spyOn(MockWebSocket.instances[0]!, 'send');
  });

  afterEach(() => {
    pulse?.disconnect();
    MockWebSocket.instances.forEach((ws) => {
      ws.close();
      ws.onclose?.();
    });
    MockWebSocket.instances = [];
    jest.clearAllMocks();
    jest.clearAllTimers();
    jest.useRealTimers();
  });

  const expectMessageToBeSent = (
    actualMessage: string,
    expectedPayload: any
  ) => {
    const message = JSON.parse(actualMessage);
    expect(message.type).toBe(OutgoingEventType.CONSOLE);
    expect(message.payload).toEqual({
      ...expectedPayload,
      timestamp: expect.any(Number),
    });
  };

  describe('log method', () => {
    test('should call original console.log and send to debugger', () => {
      const message = 'Test log message';
      const data = { key: 'value' };

      mockConsole.log(message, data);

      expect(originalConsole.log).toHaveBeenCalledWith(message, data);

      expect(sendSpy).toHaveBeenCalledTimes(1);
      expectMessageToBeSent(sendSpy.mock.calls[0][0], {
        level: 'log',
        message,
        data: [data],
      });
    });

    test('should handle multiple arguments', () => {
      mockConsole.log('Message 1', 'Message 2', { data: 123 });

      expect(originalConsole.log).toHaveBeenCalledWith(
        'Message 1',
        'Message 2',
        { data: 123 }
      );
      expect(sendSpy).toHaveBeenCalledTimes(1);
      expectMessageToBeSent(sendSpy.mock.calls[0][0], {
        level: 'log',
        message: 'Message 1',
        data: ['Message 2', { data: 123 }],
      });
    });
  });

  describe('error method', () => {
    test('should handle Error objects and include stack trace', () => {
      const error = new Error('Test error');
      mockConsole.error('Error occurred:', error);

      expect(originalConsole.error).toHaveBeenCalledWith(
        'Error occurred:',
        error
      );
      expect(sendSpy).toHaveBeenCalledTimes(1);

      const message = JSON.parse(sendSpy.mock.calls[0][0]);
      expect(message.type).toBe(OutgoingEventType.CONSOLE);
      expect(message.payload).toMatchObject({
        level: 'error',
        message: 'Error occurred:',
        data: [{}], // Error objects are serialized to empty objects
        timestamp: expect.any(Number),
      });
      expect(message.payload.stack).toMatch(/^Error: Test error\n/);
    });
  });

  describe('all console methods', () => {
    test('should handle all console methods correctly', () => {
      const methods = ['log', 'info', 'warn', 'error', 'debug'] as const;
      const message = 'Test message';

      methods.forEach((method) => {
        mockConsole[method](message);

        // Check original console was called
        expect(originalConsole[method]).toHaveBeenCalledWith(message);

        // Check message was sent to debugger
        expect(sendSpy).toHaveBeenCalledTimes(methods.indexOf(method) + 1);
        expectMessageToBeSent(sendSpy.mock.calls[methods.indexOf(method)][0], {
          level: method,
          message,
          data: [],
        });
      });
    });

    test('should handle non-string messages', () => {
      const methods = ['log', 'info', 'warn', 'error', 'debug'] as const;
      const nonStringMessages = [
        123,
        true,
        { obj: 'value' },
        [1, 2, 3],
        null,
        undefined,
      ];

      methods.forEach((method) => {
        nonStringMessages.forEach((msg, index) => {
          mockConsole[method](msg);

          // Check original console was called
          expect(originalConsole[method]).toHaveBeenCalledWith(msg);

          // Check message was sent to debugger with stringified message
          const callIndex =
            methods.indexOf(method) * nonStringMessages.length + index;
          expect(sendSpy).toHaveBeenCalledTimes(callIndex + 1);
          expectMessageToBeSent(sendSpy.mock.calls[callIndex][0], {
            level: method,
            message: String(msg),
            data: [],
          });
        });
      });
    });
  });
});
