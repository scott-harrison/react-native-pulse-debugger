import { create } from 'zustand';
import { ConsoleMessage } from '@pulse/shared-types';

// Keep track of processed logs to prevent duplicates
const processedLogs = new Set<string>();

interface ConsoleState {
  logs: ConsoleMessage[];
  selectedLogId: string | null;
  addLog: (log: ConsoleMessage) => void;
  selectLog: (logId: string | null) => void;
  clear: () => void;
}

export const useConsoleStore = create<ConsoleState>((set, get) => ({
  logs: [],
  selectedLogId: null,

  addLog: log => {
    // Validate the log object
    if (!log || typeof log !== 'object') {
      console.error('[Pulse Debugger] Invalid log object:', log);
      return;
    }

    if (!log.level || !log.message || !log.timestamp) {
      console.error('[Pulse Debugger] Missing required log fields:', log);
      return;
    }

    // Create a unique key for this log (using timestamp since ConsoleLogMessage doesn't have an id)
    const logKey = `${log.timestamp}_${log.level}_${log.message}`;

    // Check if we've already processed this log
    if (processedLogs.has(logKey)) {
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

    set(state => {
      console.log('[Pulse Debugger] Adding log to state, current count:', state.logs.length);
      return {
        logs: [log, ...state.logs],
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
    processedLogs.clear();
  },
}));

// Export processedLogs for testing purposes
export const getProcessedLogs = () => processedLogs;
