import { create, StoreApi } from 'zustand';
import { ConsoleLogPayload, MessageType } from '@pulse/shared-types';

export interface ConsoleState {
  logs: ConsoleLog[];
  selectedLogId: string | null;
  addLog: (log: ConsoleLog) => void;
  clear: () => void;
  selectLog: (id: string) => void;
}

// Create a single store instance
export const consoleStore = create<ConsoleState>(set => ({
  logs: [],
  selectedLogId: null,
  addLog: log => {
    set(state => ({
      logs: [...state.logs, log],
      selectedLogId: state.selectedLogId || log.id,
    }));
  },
  clear: () => {
    set({ logs: [], selectedLogId: null });
  },
  selectLog: id => {
    set({ selectedLogId: id });
  },
}));

export const registerConsoleDispatch = (set: StoreApi<ConsoleState>['setState']) => {
  return (action: { type: string; payload: ConsoleLogPayload }) => {
    if (action.type === MessageType.Console) {
      const payload = action.payload;
      set(state => ({
        logs: [
          ...state.logs,
          {
            id: payload.id,
            level: payload.level || 'log',
            message: payload.message || '',
            data: Array.isArray(payload.data) ? payload.data : payload.data ? [payload.data] : [],
            stack: payload.stack,
            timestamp: payload.timestamp || Date.now(),
          },
        ],
        selectedLogId: state.selectedLogId || payload.id,
      }));
    } else {
      console.log('Ignoring action with type:', action.type);
    }
  };
};

// Export the store instance for use in components
export const useConsoleStore = consoleStore;
