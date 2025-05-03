import { WebSocketClient } from '../client/WebSocketClient';
import { generateUuid } from '../utils/generateUUID';
import { MessageType } from '@pulse/shared-types';
/**
 * Middleware that intercepts console logs and sends them to the Pulse debugger.
 * Ignores network middleware debug logs to reduce noise.
 * @param client The WebSocketClient instance to send messages.
 * @returns A wrapped console object that sends logs to the debugger.
 */
export function consoleMiddleware(client: WebSocketClient): Console {
  const originalConsole = { ...console };
  const newConsole = { ...originalConsole };

  const interceptedMethods = {
    log: (...args: unknown[]) => {
      try {
        const [message, ...data] = args;
        const messageStr = String(message);
        // Ignore network middleware debug logs
        if (
          messageStr.includes('[DEBUG]') ||
          messageStr.includes('Network request started') ||
          messageStr.includes('Sending pending network request') ||
          messageStr.includes('Sending fulfilled network request') ||
          messageStr.includes('Sending rejected network request')
        ) {
          originalConsole.log(...args);
          return;
        }
        originalConsole.log(...args);
        client.sendMessage({
          type: MessageType.Console,
          payload: {
            id: generateUuid(),
            level: 'log',
            message: messageStr,
            data,
            timestamp: Date.now(),
          },
        });
      } catch (error) {
        console.debug(error);
        // Silently handle errors
      }
    },

    info: (...args: unknown[]) => {
      try {
        originalConsole.info(...args);
        const [message, ...data] = args;
        client.sendMessage({
          type: MessageType.Console,
          payload: {
            id: generateUuid(),
            level: 'info',
            message: String(message),
            data,
            timestamp: Date.now(),
          },
        });
      } catch (error) {
        // Silently handle errors
      }
    },

    warn: (...args: unknown[]) => {
      try {
        originalConsole.warn(...args);
        const [message, ...data] = args;
        client.sendMessage({
          type: MessageType.Console,
          payload: {
            id: generateUuid(),
            level: 'warn',
            message: String(message),
            data,
            timestamp: Date.now(),
          },
        });
      } catch (error) {
        // Silently handle errors
      }
    },

    error: (...args: unknown[]) => {
      try {
        originalConsole.error(...args);
        const [message, ...data] = args;
        const error = data.find((arg) => arg instanceof Error) as
          | Error
          | undefined;
        client.sendMessage({
          type: MessageType.Console,
          payload: {
            id: generateUuid(),
            level: 'error',
            message: String(message),
            data,
            timestamp: Date.now(),
            stack: error?.stack,
          },
        });
      } catch (error) {
        // Silently handle errors
      }
    },

    debug: (...args: unknown[]) => {
      try {
        originalConsole.debug(...args);
        const [message, ...data] = args;
        client.sendMessage({
          type: MessageType.Console,
          payload: {
            id: generateUuid(),
            level: 'debug',
            message: String(message),
            data,
            timestamp: Date.now(),
          },
        });
      } catch (error) {
        // Silently handle errors
      }
    },

    assert: (condition: boolean, ...args: unknown[]) => {
      try {
        const assertArgs = args.map((arg) => String(arg));
        originalConsole.assert(condition, ...assertArgs);
        if (!condition) {
          const message =
            args.length > 0 ? String(args[0]) : 'Assertion failed';
          const data = args.slice(1);
          client.sendMessage({
            type: MessageType.Console,
            payload: {
              id: generateUuid(),
              level: 'assert',
              message,
              data,
              timestamp: Date.now(),
            },
          });
        }
      } catch (error) {
        // Silently handle errors
      }
    },
  };

  return Object.assign(newConsole, interceptedMethods);
}
