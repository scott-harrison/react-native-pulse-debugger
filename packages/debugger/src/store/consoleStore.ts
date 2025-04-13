import { create } from 'zustand';
import { LogLevel, ConsoleLog } from '@pulse/shared-types';

interface ConsoleState {
  logs: ConsoleLog[];
  selectedLogId: string | null;
  addLog: (log: ConsoleLog) => void;
  selectLog: (logId: string | null) => void;
  clear: () => void;
}

// Keep track of processed logs to prevent duplicates
const processedLogs = new Set<string>();

export const useConsoleStore = create<ConsoleState>((set, get) => ({
  logs: [],
  selectedLogId: null,

  addLog: log => {
    // Validate the log object
    if (!log || typeof log !== 'object') {
      console.error('[Pulse Debugger] Invalid log object:', log);
      return;
    }

    if (!log.id || !log.level || !log.message) {
      console.error('[Pulse Debugger] Missing required log fields:', log);
      return;
    }

    // Create a unique key for this log
    const logKey = `${log.id}_${log.timestamp}`;

    console.log('[Pulse Debugger] ConsoleStore processing log:', {
      id: log.id,
      level: log.level,
      message: log.message,
      hasData: !!log.data,
      hasStack: !!log.stack,
      timestamp: log.timestamp,
      logKey,
    });

    // Check if we've already processed this log
    if (processedLogs.has(logKey)) {
      console.log('[Pulse Debugger] Skipping duplicate log:', log.id);
      return;
    }

    // Mark this log as processed
    processedLogs.add(logKey);

    // Clean up old entries to prevent memory leaks (keep last 1000)
    if (processedLogs.size > 1000) {
      const keys = Array.from(processedLogs);
      for (let i = 0; i < keys.length - 1000; i++) {
        processedLogs.delete(keys[i]);
      }
    }

    // Ensure the log object has all required fields and proper types
    const sanitizedLog: ConsoleLog = {
      id: String(log.id),
      level: log.level as LogLevel,
      message: String(log.message),
      data: log.data,
      stack: log.stack ? String(log.stack) : undefined,
      timestamp: typeof log.timestamp === 'number' ? log.timestamp : Date.now(),
    };

    set(state => {
      console.log('[Pulse Debugger] Adding log to state, current count:', state.logs.length);
      return {
        logs: [sanitizedLog, ...state.logs],
      };
    });
  },

  selectLog: logId => {
    set({ selectedLogId: logId });
  },

  clear: () => {
    set({
      logs: [],
      selectedLogId: null,
    });
    // Also clear the processed set
    processedLogs.clear();
  },
}));
