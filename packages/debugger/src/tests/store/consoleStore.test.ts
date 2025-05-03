import { useConsoleStore, getProcessedLogs } from '../../store/consoleStore';
import { ConsoleMessage } from '@pulse/shared-types';

describe('useConsoleStore', () => {
  beforeEach(() => {
    // Reset the store state before each test
    useConsoleStore.setState({
      logs: [],
      selectedLogId: null,
    });
    // Clear processedLogs by calling clear
    useConsoleStore.getState().clear();
    // Suppress console logs and errors
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    // Reset mocks
    jest.restoreAllMocks();
  });

  describe('initial state', () => {
    it('initializes with empty logs and null selectedLogId', () => {
      const state = useConsoleStore.getState();
      expect(state.logs).toEqual([]);
      expect(state.selectedLogId).toBeNull();
    });
  });

  describe('addLog', () => {
    it('rejects invalid log objects (null)', () => {
      const consoleErrorSpy = jest.spyOn(console, 'error');
      useConsoleStore.getState().addLog(null as any);
      expect(consoleErrorSpy).toHaveBeenCalledWith('[Pulse Debugger] Invalid log object:', null);
      expect(useConsoleStore.getState().logs).toEqual([]);
    });

    it('rejects invalid log objects (undefined)', () => {
      const consoleErrorSpy = jest.spyOn(console, 'error');
      useConsoleStore.getState().addLog(undefined as any);
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        '[Pulse Debugger] Invalid log object:',
        undefined
      );
      expect(useConsoleStore.getState().logs).toEqual([]);
    });

    it('rejects invalid log objects (non-object)', () => {
      const consoleErrorSpy = jest.spyOn(console, 'error');
      useConsoleStore.getState().addLog(42 as any);
      expect(consoleErrorSpy).toHaveBeenCalledWith('[Pulse Debugger] Invalid log object:', 42);
      expect(useConsoleStore.getState().logs).toEqual([]);
    });

    it('rejects logs with missing required fields', () => {
      const consoleErrorSpy = jest.spyOn(console, 'error');
      const invalidLog: Partial<ConsoleMessage> = {
        message: 'Test message',
        // Missing level and timestamp
      };
      useConsoleStore.getState().addLog(invalidLog as ConsoleMessage);
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        '[Pulse Debugger] Missing required log fields:',
        invalidLog
      );
      expect(useConsoleStore.getState().logs).toEqual([]);
    });

    it('rejects duplicate logs based on logKey', () => {
      const consoleLogSpy = jest.spyOn(console, 'log');
      const log: ConsoleMessage = {
        type: 'console',
        level: 'log',
        message: 'Test message',
        timestamp: '2025-04-23T12:00:00.000Z',
      };
      // Add the log once
      useConsoleStore.getState().addLog(log);
      expect(useConsoleStore.getState().logs).toEqual([log]);
      expect(consoleLogSpy).toHaveBeenCalledWith(
        '[Pulse Debugger] Adding log to state, current count:',
        0
      );

      // Reset spy for second call
      consoleLogSpy.mockClear();

      // Add the same log again
      useConsoleStore.getState().addLog(log);
      // Logs should not change (duplicate)
      expect(useConsoleStore.getState().logs).toEqual([log]);
      expect(consoleLogSpy).not.toHaveBeenCalled();
    });

    it('cleans up processedLogs when size exceeds 1000', () => {
      // Add 1001 logs to trigger cleanup
      for (let i = 0; i < 1001; i++) {
        const log: ConsoleMessage = {
          type: 'console',
          level: 'log',
          message: `Test message ${i}`,
          timestamp: `2025-04-23T12:00:0${i}.000Z`,
        };
        useConsoleStore.getState().addLog(log);
      }
      expect(useConsoleStore.getState().logs).toHaveLength(1001);
      // processedLogs should have been cleaned up to 1000 entries
      const processedLogsSize = getProcessedLogs().size;
      expect(processedLogsSize).toBe(1000);
    });

    it('successfully adds a valid log', () => {
      const consoleLogSpy = jest.spyOn(console, 'log');
      const log1: ConsoleMessage = {
        type: 'console',
        level: 'log',
        message: 'First message',
        timestamp: '2025-04-23T12:00:00.000Z',
      };
      const log2: ConsoleMessage = {
        type: 'console',
        level: 'error',
        message: 'Second message',
        timestamp: '2025-04-23T12:00:01.000Z',
      };
      useConsoleStore.getState().addLog(log1);
      expect(useConsoleStore.getState().logs).toEqual([log1]);
      expect(consoleLogSpy).toHaveBeenCalledWith(
        '[Pulse Debugger] Adding log to state, current count:',
        0
      );

      consoleLogSpy.mockClear();

      useConsoleStore.getState().addLog(log2);
      expect(useConsoleStore.getState().logs).toEqual([log2, log1]);
      expect(consoleLogSpy).toHaveBeenCalledWith(
        '[Pulse Debugger] Adding log to state, current count:',
        1
      );
    });
  });

  describe('selectLog', () => {
    it('sets selectedLogId to the provided logId', () => {
      useConsoleStore.getState().selectLog('log-123');
      expect(useConsoleStore.getState().selectedLogId).toBe('log-123');
    });

    it('sets selectedLogId to null', () => {
      useConsoleStore.getState().selectLog('log-123');
      useConsoleStore.getState().selectLog(null);
      expect(useConsoleStore.getState().selectedLogId).toBeNull();
    });
  });

  describe('clear', () => {
    it('resets logs, selectedLogId, and processedLogs', () => {
      // Add a log and select a logId
      const log: ConsoleMessage = {
        type: 'console',
        level: 'log',
        message: 'Test message',
        timestamp: '2025-04-23T12:00:00.000Z',
      };
      useConsoleStore.getState().addLog(log);
      useConsoleStore.getState().selectLog('log-123');
      expect(useConsoleStore.getState().logs).toHaveLength(1);
      expect(useConsoleStore.getState().selectedLogId).toBe('log-123');
      const processedLogsSize = getProcessedLogs().size;
      expect(processedLogsSize).toBe(1);

      // Clear the store
      useConsoleStore.getState().clear();
      expect(useConsoleStore.getState().logs).toEqual([]);
      expect(useConsoleStore.getState().selectedLogId).toBeNull();
      const newProcessedLogsSize = getProcessedLogs().size;
      expect(newProcessedLogsSize).toBe(0);
    });
  });
});
