import { pulseReduxMiddleware } from '../reduxMiddleware';
import { getPulse } from '../connectionManager';
import { setReduxStore } from '../utils/reduxStore';
import { LibToDebuggerEventType } from '@pulse/shared-types';

jest.mock('../connectionManager', () => ({
  getPulse: jest.fn(),
}));

jest.mock('../utils/reduxStore', () => ({
  setReduxStore: jest.fn(),
}));

describe('pulseReduxMiddleware', () => {
  let mockEventManager: { emit: jest.Mock };
  let mockStore: { getState: jest.Mock; dispatch: jest.Mock };
  let mockNext: jest.Mock;
  let middleware: any;

  beforeEach(() => {
    jest.clearAllMocks();

    mockEventManager = {
      emit: jest.fn(),
    };

    (getPulse as jest.Mock).mockReturnValue({
      getEventManager: () => mockEventManager,
    });

    mockStore = {
      getState: jest.fn(),
      dispatch: jest.fn(),
    };

    mockNext = jest.fn((action) => action);

    middleware = pulseReduxMiddleware(mockStore)(mockNext);
  });

  it('should handle state updates for valid actions', () => {
    const prevState = { count: 0 };
    const nextState = { count: 1 };
    mockStore.getState
      .mockReturnValueOnce(prevState)
      .mockReturnValueOnce(nextState);

    const action = {
      type: 'INCREMENT',
      payload: 1,
    };

    middleware(action);

    expect(mockStore.getState).toHaveBeenCalledTimes(2);

    expect(mockEventManager.emit).toHaveBeenCalledWith(
      LibToDebuggerEventType.REDUX_STATE_UPDATE,
      expect.objectContaining({
        action: {
          type: 'INCREMENT',
          payload: 1,
        },
        prevState,
        nextState,
      })
    );
  });

  it('should handle actions without payload', () => {
    // Setup mock states
    const prevState = { count: 0 };
    const nextState = { count: 0 };
    mockStore.getState
      .mockReturnValueOnce(prevState)
      .mockReturnValueOnce(nextState);

    // Create test action without payload
    const action = {
      type: 'NO_PAYLOAD',
    };

    // Call middleware
    middleware(action);

    // Verify event was emitted with undefined payload
    expect(mockEventManager.emit).toHaveBeenCalledWith(
      LibToDebuggerEventType.REDUX_STATE_UPDATE,
      expect.objectContaining({
        action: {
          type: 'NO_PAYLOAD',
          payload: undefined,
        },
      })
    );
  });

  it('should handle non-object actions', () => {
    // Setup mock states
    const prevState = { count: 0 };
    const nextState = { count: 0 };
    mockStore.getState
      .mockReturnValueOnce(prevState)
      .mockReturnValueOnce(nextState);

    // Call middleware with non-object action
    middleware('STRING_ACTION');

    // Verify event was not emitted
    expect(mockEventManager.emit).not.toHaveBeenCalled();
  });

  it('should handle null actions', () => {
    // Setup mock states
    const prevState = { count: 0 };
    const nextState = { count: 0 };
    mockStore.getState
      .mockReturnValueOnce(prevState)
      .mockReturnValueOnce(nextState);

    // Call middleware with null action
    middleware(null);

    // Verify event was not emitted
    expect(mockEventManager.emit).not.toHaveBeenCalled();
  });

  it('should work without Pulse debugger', () => {
    // Setup mock states
    const prevState = { count: 0 };
    const nextState = { count: 1 };
    mockStore.getState
      .mockReturnValueOnce(prevState)
      .mockReturnValueOnce(nextState);

    // Setup getPulse to return null
    (getPulse as jest.Mock).mockReturnValue(null);

    // Create test action
    const action = {
      type: 'INCREMENT',
      payload: 1,
    };

    // Call middleware
    const result = middleware(action);

    // Verify action was passed through
    expect(result).toBe(action);
    expect(mockNext).toHaveBeenCalledWith(action);
  });

  it('should preserve action return value', () => {
    // Setup mock states
    const prevState = { count: 0 };
    const nextState = { count: 1 };
    mockStore.getState
      .mockReturnValueOnce(prevState)
      .mockReturnValueOnce(nextState);

    // Create test action with return value
    const action = {
      type: 'INCREMENT',
      payload: 1,
    };
    const expectedResult = { success: true };
    mockNext.mockReturnValue(expectedResult);

    // Call middleware
    const result = middleware(action);

    // Verify result was preserved
    expect(result).toBe(expectedResult);
  });

  it('should register the store with setReduxStore', () => {
    const action = { type: 'TEST' };
    middleware(action);
    expect(setReduxStore).toHaveBeenCalledWith(mockStore);
  });
});
