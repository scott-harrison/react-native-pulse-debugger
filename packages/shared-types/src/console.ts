/**
 * Log level type
 */
export type LogLevel = 'log' | 'info' | 'warn' | 'error' | 'debug';

/**
 * Console log interface
 */
export interface ConsoleLog {
  id: string;
  level: LogLevel;
  message: string;
  data?: any;
  stack?: string;
  timestamp: number;
}
