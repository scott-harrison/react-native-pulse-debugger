import { WebSocketClient } from '../client/WebSocketClient';
import { generateUuid } from '../utils/generateUUID';

/**
 * Middleware that intercepts console logs and sends them to the Pulse debugger.
 * Processes arguments to separate strings into `message` and objects/arrays into `data`.
 * @param client The WebSocketClient instance to send messages.
 * @returns A wrapped console object that sends logs to the debugger.
 */
export function consoleMiddleware(client: WebSocketClient): Console {
  const originalConsole = { ...console };
  const newConsole = { ...originalConsole };

  const processArgs = (args: unknown[]) => {
    const messageParts: string[] = [];
    const data: unknown[] = [];

    args.forEach((arg) => {
      if (typeof arg === 'string') {
        messageParts.push(arg); // Add strings to the message
      } else if (typeof arg === 'object' && arg !== null) {
        data.push(arg); // Add objects/arrays to the data
      } else {
        // Handle other types (e.g., numbers, booleans)
        messageParts.push(String(arg));
      }
    });

    return {
      message: messageParts.join(' '), // Combine all string parts into a single message
      data,
    };
  };

  const interceptedMethods = {
    log: (...args: unknown[]) => {
      try {
        const { message, data } = processArgs(args);
        originalConsole.log(...args);
        client.sendMessage({
          type: 'console_event',
          payload: {
            level: 'log',
            message,
            data,
          },
          id: generateUuid(),
          timestamp: new Date().toISOString(),
        });
      } catch (error) {
        console.debug(error);
      }
    },

    info: (...args: unknown[]) => {
      try {
        const { message, data } = processArgs(args);
        originalConsole.info(...args);
        client.sendMessage({
          type: 'console_event',
          payload: {
            level: 'info',
            message,
            data,
          },
          id: generateUuid(),
          timestamp: new Date().toISOString(),
        });
      } catch (error) {
        console.debug(error);
      }
    },

    warn: (...args: unknown[]) => {
      try {
        const { message, data } = processArgs(args);
        originalConsole.warn(...args);
        client.sendMessage({
          type: 'console_event',
          payload: {
            level: 'warn',
            message,
            data,
          },
          id: generateUuid(),
          timestamp: new Date().toISOString(),
        });
      } catch (error) {
        console.debug(error);
      }
    },

    error: (...args: unknown[]) => {
      try {
        const { message, data } = processArgs(args);
        const error = data.find((arg) => arg instanceof Error) as
          | Error
          | undefined;
        originalConsole.error(...args);
        client.sendMessage({
          type: 'console_event',
          payload: {
            level: 'error',
            message,
            data,
            stack: error?.stack, // Include stack trace if an Error object is present
          },
          id: generateUuid(),
          timestamp: new Date().toISOString(),
        });
      } catch (error) {
        console.debug(error);
      }
    },

    debug: (...args: unknown[]) => {
      try {
        const { message, data } = processArgs(args);
        originalConsole.debug(...args);
        client.sendMessage({
          type: 'console_event',
          payload: {
            level: 'debug',
            message,
            data,
          },
          id: generateUuid(),
          timestamp: new Date().toISOString(),
        });
      } catch (error) {
        console.debug(error);
      }
    },

    assert: (condition: boolean, ...args: unknown[]) => {
      try {
        if (!condition) {
          const { message, data } = processArgs(args);
          originalConsole.assert(condition, ...args);
          client.sendMessage({
            type: 'console_event',
            payload: {
              level: 'assert',
              message: message || 'Assertion failed',
              data,
            },
            id: generateUuid(),
            timestamp: new Date().toISOString(),
          });
        }
      } catch (error) {
        console.debug(error);
      }
    },
  };

  return Object.assign(newConsole, interceptedMethods);
}
