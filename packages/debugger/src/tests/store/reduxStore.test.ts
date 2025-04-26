import { useReduxStore } from '../../store/reduxStore';
import { MessageType, ReduxEventMessage } from '@pulse/shared-types';

// Helper function to create a mock ReduxEventMessage object
const createMockAction = (
  timestamp: string,
  actionType: string,
  overrides: Partial<ReduxEventMessage> = {}
): ReduxEventMessage => ({
  type: MessageType.ReduxEvent,
  timestamp,
  action: {
    type: actionType,
    payload: { data: 'test' },
  },
  stateDiff: {
    before: { count: 0 },
    after: { count: 1 },
  },
  ...overrides,
});

describe('useReduxStore', () => {
  beforeEach(() => {
    // Reset the store state before each test
    useReduxStore.setState({
      state: null,
      actions: [],
    });
    // Suppress console errors
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    // Reset mocks
    jest.restoreAllMocks();
  });

  describe('initial state', () => {
    it('initializes with null state and empty actions', () => {
      const state = useReduxStore.getState();
      expect(state.state).toBeNull();
      expect(state.actions).toEqual([]);
    });
  });

  describe('setState', () => {
    it('sets state to a new value', () => {
      const newState = { count: 42 };
      useReduxStore.getState().setState(newState);
      expect(useReduxStore.getState().state).toEqual(newState);
    });

    it('sets state to null', () => {
      const initialState = { count: 42 };
      useReduxStore.getState().setState(initialState);
      useReduxStore.getState().setState(null);
      expect(useReduxStore.getState().state).toBeNull();
    });

    it('sets state to undefined', () => {
      const initialState = { count: 42 };
      useReduxStore.getState().setState(initialState);
      useReduxStore.getState().setState(undefined);
      expect(useReduxStore.getState().state).toBeUndefined();
    });
  });

  describe('addAction', () => {
    it('adds an action with provided stateDiff', () => {
      const action = createMockAction('2025-04-23T12:00:00.000Z', 'TEST_ACTION', {
        stateDiff: { before: { count: 10 }, after: { count: 11 } },
      });
      useReduxStore.getState().addAction(action);
      expect(useReduxStore.getState().actions).toEqual([action]);
      expect(useReduxStore.getState().state).toEqual({ count: 11 }); // State updated to stateDiff.after
    });

    it('adds an action without stateDiff, calculating it from store.state', () => {
      const initialState = { count: 5 };
      useReduxStore.getState().setState(initialState);
      const action = createMockAction('2025-04-23T12:00:00.000Z', 'TEST_ACTION', {
        stateDiff: undefined,
        action: { type: 'TEST_ACTION', payload: { count: 6 } },
      });
      useReduxStore.getState().addAction(action);
      const expectedAction = {
        ...action,
        stateDiff: { before: initialState, after: { count: 6 } },
      };
      expect(useReduxStore.getState().actions).toEqual([expectedAction]);
      expect(useReduxStore.getState().state).toEqual({ count: 6 }); // State updated to action.payload
    });

    it('adds an action without stateDiff, falling back to current state if no payload', () => {
      const initialState = { count: 5 };
      useReduxStore.getState().setState(initialState);
      const action = createMockAction('2025-04-23T12:00:00.000Z', 'TEST_ACTION', {
        stateDiff: undefined,
        action: { type: 'TEST_ACTION' }, // No payload
      });
      useReduxStore.getState().addAction(action);
      const expectedAction = {
        ...action,
        stateDiff: { before: initialState, after: initialState },
      };
      expect(useReduxStore.getState().actions).toEqual([expectedAction]);
      expect(useReduxStore.getState().state).toEqual(initialState); // State unchanged
    });

    it('adds an action without stateDiff when store.state is null', () => {
      const action = createMockAction('2025-04-23T12:00:00.000Z', 'TEST_ACTION', {
        stateDiff: undefined,
      });
      useReduxStore.getState().addAction(action);
      const expectedAction = {
        ...action,
        stateDiff: undefined,
      };
      expect(useReduxStore.getState().actions).toEqual([expectedAction]);
      expect(useReduxStore.getState().state).toBeNull(); // State unchanged
    });

    it('limits actions to the last 100', () => {
      // Add 101 actions
      for (let i = 0; i < 101; i++) {
        const action = createMockAction(`2025-04-23T12:00:0${i}.000Z`, `ACTION_${i}`);
        useReduxStore.getState().addAction(action);
      }
      expect(useReduxStore.getState().actions).toHaveLength(100);
      // The first action (ACTION_0) should be removed, keeping the last 100 (ACTION_1 to ACTION_100)
      expect(useReduxStore.getState().actions[0].action.type).toBe('ACTION_1'); // Oldest retained action
      expect(useReduxStore.getState().actions[99].action.type).toBe('ACTION_100'); // Newest action
    });

    it('rejects invalid input (null)', () => {
      const consoleErrorSpy = jest.spyOn(console, 'error');
      const invalidAction = null as any;
      useReduxStore.getState().addAction(invalidAction);
      expect(consoleErrorSpy).toHaveBeenCalledWith('[Pulse Debugger] Invalid Redux event:', null);
      expect(useReduxStore.getState().actions).toEqual([]);
    });

    it('rejects invalid input (undefined)', () => {
      const consoleErrorSpy = jest.spyOn(console, 'error');
      const invalidAction = undefined as any;
      useReduxStore.getState().addAction(invalidAction);
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        '[Pulse Debugger] Invalid Redux event:',
        undefined
      );
      expect(useReduxStore.getState().actions).toEqual([]);
    });

    it('rejects invalid input (non-object)', () => {
      const consoleErrorSpy = jest.spyOn(console, 'error');
      const invalidAction = 42 as any;
      useReduxStore.getState().addAction(invalidAction);
      expect(consoleErrorSpy).toHaveBeenCalledWith('[Pulse Debugger] Invalid Redux event:', 42);
      expect(useReduxStore.getState().actions).toEqual([]);
    });

    it('rejects invalid input (missing action)', () => {
      const consoleErrorSpy = jest.spyOn(console, 'error');
      const invalidAction: Partial<ReduxEventMessage> = {
        type: MessageType.ReduxEvent,
        timestamp: '2025-04-23T12:00:00.000Z',
        // Missing action
      };
      useReduxStore.getState().addAction(invalidAction as ReduxEventMessage);
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        '[Pulse Debugger] Invalid Redux event: missing action field',
        invalidAction
      );
      expect(useReduxStore.getState().actions).toEqual([]);
    });

    it('rejects invalid input (missing action.type)', () => {
      const consoleErrorSpy = jest.spyOn(console, 'error');
      const invalidAction: ReduxEventMessage = {
        type: MessageType.ReduxEvent,
        timestamp: '2025-04-23T12:00:00.000Z',
        //@ts-ignore
        action: {
          // Missing type
          payload: { data: 'test' },
        },
      };
      useReduxStore.getState().addAction(invalidAction);
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        '[Pulse Debugger] Invalid Redux event: missing action.type',
        invalidAction
      );
      expect(useReduxStore.getState().actions).toEqual([]);
    });
  });

  describe('clearActions', () => {
    it('resets actions and state', () => {
      const initialState = { count: 5 };
      const action1 = createMockAction('2025-04-23T12:00:00.000Z', 'TEST_ACTION_1');
      const action2 = createMockAction('2025-04-23T12:00:01.000Z', 'TEST_ACTION_2');
      useReduxStore.getState().setState(initialState);
      useReduxStore.getState().addAction(action1);
      useReduxStore.getState().addAction(action2);
      expect(useReduxStore.getState().actions).toHaveLength(2);
      expect(useReduxStore.getState().state).toBeDefined();

      useReduxStore.getState().clearActions();
      expect(useReduxStore.getState().actions).toEqual([]);
      expect(useReduxStore.getState().state).toBeNull();
    });
  });
});
