import { LibToDebuggerEventType } from '@pulse/shared-types';
import { sendToDebugger, withRecursionProtection } from './utils/debuggerUtils';

interface ConsoleLogPayload {
  level: 'log' | 'info' | 'warn' | 'error' | 'debug' | 'assert';
  message: string;
  data?: unknown[];
  timestamp: number;
  stack?: string;
}

/**
 * Middleware that intercepts console logs and sends them to the Pulse debugger
 * @param originalConsole The original console object to wrap
 * @returns A wrapped console object that sends logs to the debugger
 */
export const pulseConsoleMiddleware = (originalConsole: Console) => {
  const sendLog = withRecursionProtection((payload: ConsoleLogPayload) => {
    sendToDebugger(LibToDebuggerEventType.CONSOLE, payload);
  });

  // Create a new console object that preserves all original methods
  const newConsole = { ...originalConsole };

  // Override only the methods we want to intercept
  const interceptedMethods = {
    log: (...args: unknown[]) => {
      try {
        originalConsole.log(...args);
        const [message, ...data] = args;
        sendLog({
          level: 'log',
          message: String(message),
          data,
          timestamp: Date.now(),
        });
      } catch (error) {
        // Silently handle errors to prevent recursive logging
      }
    },

    info: (...args: unknown[]) => {
      try {
        originalConsole.info(...args);
        const [message, ...data] = args;
        sendLog({
          level: 'info',
          message: String(message),
          data,
          timestamp: Date.now(),
        });
      } catch (error) {
        // Silently handle errors to prevent recursive logging
      }
    },

    warn: (...args: unknown[]) => {
      try {
        originalConsole.warn(...args);
        const [message, ...data] = args;
        sendLog({
          level: 'warn',
          message: String(message),
          data,
          timestamp: Date.now(),
        });
      } catch (error) {
        // Silently handle errors to prevent recursive logging
      }
    },

    error: (...args: unknown[]) => {
      try {
        originalConsole.error(...args);
        const [message, ...data] = args;
        const error = data.find((arg) => arg instanceof Error) as
          | Error
          | undefined;
        sendLog({
          level: 'error',
          message: String(message),
          data,
          timestamp: Date.now(),
          stack: error?.stack,
        });
      } catch (error) {
        // Silently handle errors to prevent recursive logging
      }
    },

    debug: (...args: unknown[]) => {
      try {
        originalConsole.debug(...args);
        const [message, ...data] = args;
        sendLog({
          level: 'debug',
          message: String(message),
          data,
          timestamp: Date.now(),
        });
      } catch (error) {
        // Silently handle errors to prevent recursive logging
      }
    },

    assert: (condition: boolean, ...args: unknown[]) => {
      try {
        // Convert args to strings for assert
        const assertArgs = args.map((arg) => String(arg));
        originalConsole.assert(condition, ...assertArgs);
        if (!condition) {
          const message =
            args.length > 0 ? String(args[0]) : 'Assertion failed';
          const data = args.slice(1);
          sendLog({
            level: 'assert',
            message,
            data,
            timestamp: Date.now(),
          });
        }
      } catch (error) {
        // Silently handle errors to prevent recursive logging
      }
    },
  };

  return Object.assign(newConsole, interceptedMethods);
};
