import { getPulse } from './connection';

type LogLevel = 'log' | 'info' | 'warn' | 'error' | 'debug';

interface ConsoleLogPayload {
  id: string;
  level: LogLevel;
  message: string;
  data?: any;
  stack?: string;
  timestamp: number;
}

/**
 * Console middleware that intercepts console logs and sends them to the Pulse debugger.
 * This middleware should be used to wrap the global console methods.
 *
 * @example
 * ```ts
 * import { pulseConsoleMiddleware } from 'react-native-pulse-debugger';
 *
 * // Apply the middleware to the global console
 * global.console = pulseConsoleMiddleware(console);
 * ```
 */
export const pulseConsoleMiddleware = (originalConsole: typeof console) => {
  const createLogPayload = (
    level: LogLevel,
    message: string,
    data?: any,
    stack?: string
  ): ConsoleLogPayload => ({
    id: Math.random().toString(36).substring(2, 15),
    level,
    message,
    data,
    stack,
    timestamp: Date.now(),
  });

  const sendToDebugger = (payload: ConsoleLogPayload) => {
    const pulse = getPulse();
    if (pulse) {
      pulse.send('console_log', payload);
    } else {
      originalConsole.error('[Pulse Debugger] No pulse instance available');
    }
  };

  return {
    ...originalConsole,
    log: (...args: any[]) => {
      originalConsole.log(...args);
      const [message, ...data] = args;
      sendToDebugger(
        createLogPayload('log', String(message), data.length ? data : undefined)
      );
    },
    info: (...args: any[]) => {
      originalConsole.info(...args);
      const [message, ...data] = args;
      sendToDebugger(
        createLogPayload(
          'info',
          String(message),
          data.length ? data : undefined
        )
      );
    },
    warn: (...args: any[]) => {
      originalConsole.warn(...args);
      const [message, ...data] = args;
      sendToDebugger(
        createLogPayload(
          'warn',
          String(message),
          data.length ? data : undefined
        )
      );
    },
    error: (...args: any[]) => {
      originalConsole.error(...args);
      const [message, ...data] = args;
      const error = data[0] instanceof Error ? data[0] : null;
      sendToDebugger(
        createLogPayload(
          'error',
          String(message),
          data.length ? data : undefined,
          error?.stack
        )
      );
    },
    debug: (...args: any[]) => {
      originalConsole.debug(...args);
      const [message, ...data] = args;
      sendToDebugger(
        createLogPayload(
          'debug',
          String(message),
          data.length ? data : undefined
        )
      );
    },
  };
};
