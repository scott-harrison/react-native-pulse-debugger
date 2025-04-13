import { getPulse } from './connectionManager';
import { LibToDebuggerEventType } from '@pulse/shared-types';

interface ConsoleLogPayload {
  level: 'log' | 'info' | 'warn' | 'error' | 'debug';
  message: string;
  data?: unknown[];
  timestamp: number;
  stack?: string;
}

// Define a partial console type
type PartialConsole = Pick<
  typeof console,
  'log' | 'info' | 'warn' | 'error' | 'debug'
>;

/**
 * Middleware that intercepts console logs and sends them to the Pulse debugger
 * @param originalConsole The original console object to wrap
 * @returns A wrapped console object that sends logs to the debugger
 */
export const pulseConsoleMiddleware = (originalConsole: PartialConsole) => {
  const sendToDebugger = (payload: ConsoleLogPayload) => {
    const pulse = getPulse();
    if (pulse) {
      const eventManager = pulse.getEventManager();
      if (eventManager) {
        eventManager.emit(LibToDebuggerEventType.CONSOLE, payload);
      }
    }
  };

  return {
    log: (...args: unknown[]) => {
      originalConsole.log(...args);
      const [message, ...data] = args;
      sendToDebugger({
        level: 'log',
        message: String(message),
        data,
        timestamp: Date.now(),
      });
    },

    info: (...args: unknown[]) => {
      originalConsole.info(...args);
      const [message, ...data] = args;
      sendToDebugger({
        level: 'info',
        message: String(message),
        data,
        timestamp: Date.now(),
      });
    },

    warn: (...args: unknown[]) => {
      originalConsole.warn(...args);
      const [message, ...data] = args;
      sendToDebugger({
        level: 'warn',
        message: String(message),
        data,
        timestamp: Date.now(),
      });
    },

    error: (...args: unknown[]) => {
      originalConsole.error(...args);
      const [message, ...data] = args;
      const error = data.find((arg) => arg instanceof Error) as
        | Error
        | undefined;
      sendToDebugger({
        level: 'error',
        message: String(message),
        data,
        timestamp: Date.now(),
        stack: error?.stack,
      });
    },

    debug: (...args: unknown[]) => {
      originalConsole.debug(...args);
      const [message, ...data] = args;
      sendToDebugger({
        level: 'debug',
        message: String(message),
        data,
        timestamp: Date.now(),
      });
    },
  };
};
