import { useConnectionStore } from '../../store/connectionStore';
import { SessionData } from '@pulse/shared-types';

const createMockSession = (
  deviceId: string,
  overrides: Partial<SessionData> = {}
): SessionData => ({
  deviceId,
  metadata: {
    appName: 'TestApp',
    appVersion: '1.0.0',
    buildNumber: '100',
    platform: 'ios',
    isExpo: false,
    deviceInfo: {
      model: 'iPhone',
      osVersion: '14.0',
    },
  },
  connectedAt: '2025-04-23T12:00:00.000Z',
  lastActiveAt: '2025-04-23T12:00:00.000Z',
  status: 'connected',
  ...overrides,
});

describe('useConnectionStore', () => {
  beforeEach(() => {
    // Reset the store state before each test
    useConnectionStore.setState({
      sessions: [],
    });
  });

  describe('initial state', () => {
    it('initializes with empty sessions', () => {
      const state = useConnectionStore.getState();
      expect(state.sessions).toEqual([]);
    });
  });

  describe('updateSessions', () => {
    it('updates sessions with a new array', () => {
      const session1 = createMockSession('device-1');
      const session2 = createMockSession('device-2', { status: 'disconnected' });
      const newSessions = [session1, session2];
      useConnectionStore.getState().updateSessions(newSessions);
      expect(useConnectionStore.getState().sessions).toEqual(newSessions);
    });

    it('updates sessions with an empty array', () => {
      const session = createMockSession('device-1');
      useConnectionStore.getState().updateSessions([session]);
      expect(useConnectionStore.getState().sessions).toHaveLength(1);

      useConnectionStore.getState().updateSessions([]);
      expect(useConnectionStore.getState().sessions).toEqual([]);
    });

    it('handles invalid input by updating with the provided value', () => {
      // Zustand doesn't validate the input; it just sets the state
      const invalidSessions = null as any;
      useConnectionStore.getState().updateSessions(invalidSessions);
      expect(useConnectionStore.getState().sessions).toBeNull();

      // Reset to a valid state
      useConnectionStore.getState().updateSessions([]);
      expect(useConnectionStore.getState().sessions).toEqual([]);
    });
  });

  describe('clearSessions', () => {
    it('resets sessions to an empty array', () => {
      const session1 = createMockSession('device-1');
      const session2 = createMockSession('device-2');
      useConnectionStore.getState().updateSessions([session1, session2]);
      expect(useConnectionStore.getState().sessions).toHaveLength(2);

      useConnectionStore.getState().clearSessions();
      expect(useConnectionStore.getState().sessions).toEqual([]);
    });
  });
});
