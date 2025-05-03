import {
  dispatch,
  useConsoleStore,
  useNetworkStore,
  useReduxStore,
  useConnectionStore,
} from '../../store';
import {
  AppInfoMessage,
  ConsoleMessage,
  MessageType,
  NetworkEventMessage,
  ReduxEventMessage,
} from '@pulse/shared-types';

// Create mock methods outside the getState mock to ensure consistency
const mockUpdateSessions = jest.fn();
const mockAddLog = jest.fn();
const mockAddRequest = jest.fn();
const mockAddAction = jest.fn();

// Mock the Zustand stores
jest.mock('../../store/consoleStore', () => ({
  useConsoleStore: {
    getState: jest.fn(() => ({
      addLog: mockAddLog,
    })),
  },
}));

jest.mock('../../store/networkStore', () => ({
  useNetworkStore: {
    getState: jest.fn(() => ({
      addRequest: mockAddRequest,
    })),
  },
}));

jest.mock('../../store/reduxStore', () => ({
  useReduxStore: {
    getState: jest.fn(() => ({
      addAction: mockAddAction,
    })),
  },
}));

jest.mock('../../store/connectionStore', () => ({
  useConnectionStore: {
    getState: jest.fn(() => ({
      sessions: [], // Mock sessions to match expected behavior
      updateSessions: mockUpdateSessions,
    })),
  },
}));

// Helper functions to create mock payloads
const createMockAppInfoMessage = (): AppInfoMessage => ({
  type: MessageType.AppInfo,
  timestamp: '2025-04-23T12:00:00.000Z',
  data: {
    appName: 'TestApp',
    appVersion: '1.0.0',
    buildNumber: '100',
    platform: 'ios',
    isExpo: false,
    deviceInfo: { model: 'iPhone', osVersion: '14.0' },
  },
});

const createMockConsoleMessage = (): ConsoleMessage => ({
  type: MessageType.Console,
  timestamp: '2025-04-23T12:00:00.000Z',
  level: 'log',
  message: 'Test message',
});

const createMockNetworkEventMessage = (): NetworkEventMessage => ({
  type: MessageType.NetworkEvent,
  timestamp: '2025-04-23T12:00:00.000Z',
  method: 'GET',
  url: 'https://example.com/api',
  status: 200,
  duration: 123,
  requestHeaders: { 'Content-Type': 'application/json' },
  responseHeaders: { 'Content-Type': 'application/json' },
  requestBody: JSON.stringify({ id: 1 }),
  responseBody: JSON.stringify({ success: true }),
});

const createMockReduxEventMessage = (): ReduxEventMessage => ({
  type: MessageType.ReduxEvent,
  timestamp: '2025-04-23T12:00:00.000Z',
  action: { type: 'TEST_ACTION', payload: { data: 'test' } },
  stateDiff: { before: { count: 0 }, after: { count: 1 } },
});

describe('store/index', () => {
  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    // Suppress console warnings
    jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    // Reset mocks
    jest.restoreAllMocks();
  });

  describe('dispatch', () => {
    it('dispatches UPDATE_APP_INFO action to useConnectionStore', () => {
      const payload = createMockAppInfoMessage();
      dispatch({ type: 'UPDATE_APP_INFO', payload });

      expect(mockUpdateSessions).toHaveBeenCalledWith([
        {
          metadata: payload.data,
          deviceId: '',
          connectedAt: '',
          lastActiveAt: '',
          status: 'connected',
        },
      ]);
    });

    it('dispatches ADD_CONSOLE action to useConsoleStore', () => {
      const payload = createMockConsoleMessage();
      dispatch({ type: 'ADD_CONSOLE', payload });

      expect(mockAddLog).toHaveBeenCalledWith(payload);
    });

    it('dispatches ADD_NETWORK_EVENT action to useNetworkStore', () => {
      const payload = createMockNetworkEventMessage();
      dispatch({ type: 'ADD_NETWORK_EVENT', payload });

      expect(mockAddRequest).toHaveBeenCalledWith(payload);
    });

    it('dispatches ADD_REDUX_EVENT action to useReduxStore', () => {
      const payload = createMockReduxEventMessage();
      dispatch({ type: 'ADD_REDUX_EVENT', payload });

      expect(mockAddAction).toHaveBeenCalledWith(payload);
    });

    it('logs a warning for unknown action types', () => {
      const consoleWarnSpy = jest.spyOn(console, 'warn');
      //@ts-ignore
      dispatch({ type: 'UNKNOWN_ACTION', payload: {} });

      expect(consoleWarnSpy).toHaveBeenCalledWith('Unknown action type:', 'UNKNOWN_ACTION');
      expect(mockUpdateSessions).not.toHaveBeenCalled();
      expect(mockAddLog).not.toHaveBeenCalled();
      expect(mockAddRequest).not.toHaveBeenCalled();
      expect(mockAddAction).not.toHaveBeenCalled();
    });
  });

  describe('exports', () => {
    it('exports the Zustand stores', () => {
      expect(useConsoleStore).toBeDefined();
      expect(useNetworkStore).toBeDefined();
      expect(useReduxStore).toBeDefined();
      expect(useConnectionStore).toBeDefined();
    });
  });
});
