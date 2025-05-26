import { reduxMiddleware } from './redux';
import { WebSocketClient } from '../client/WebSocketClient';
import { generateUuid } from '../utils/generateUUID';

// Mock dependencies
jest.mock('../client/WebSocketClient');
jest.mock('../utils/generateUUID');

describe('Redux Middleware', () => {
  let mockClient: jest.Mocked<WebSocketClient>;
  let mockStore: any;
  let mockNext: jest.Mock;
  let middleware: any;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    // Mock generateUuid
    (generateUuid as jest.Mock).mockReturnValue('test-uuid');

    // Setup client mock
    mockClient = {
      sendMessage: jest.fn(),
      isConnected: jest.fn().mockReturnValue(true),
    } as unknown as jest.Mocked<WebSocketClient>;

    // Setup redux store mock
    mockStore = {
      getState: jest.fn(),
    };

    // Mock next middleware
    mockNext = jest.fn((action) => action);

    // Create middleware
    middleware = reduxMiddleware(mockClient)(mockStore)(mockNext);
  });

  it('should pass action to next middleware', () => {
    const action = { type: 'TEST_ACTION' };
    const result = middleware(action);

    // Verify action was passed to next middleware
    expect(mockNext).toHaveBeenCalledWith(action);
    expect(result).toEqual(action);
  });

  it('should send action with state to WebSocketClient', () => {
    // Setup mock states
    const prevState = { count: 0 };
    const nextState = { count: 1 };
    mockStore.getState
      .mockReturnValueOnce(prevState)
      .mockReturnValueOnce(nextState);

    // Mock date
    const mockDate = '2023-01-01T00:00:00.000Z';
    jest.spyOn(Date.prototype, 'toISOString').mockReturnValue(mockDate);

    // Dispatch action
    const action = { type: 'INCREMENT', payload: 1 };
    middleware(action);

    // Verify WebSocketClient was called with the correct message
    expect(mockClient.sendMessage).toHaveBeenCalledWith({
      type: 'redux_action_event',
      id: 'test-uuid',
      timestamp: mockDate,
      payload: {
        action: {
          type: 'INCREMENT',
          payload: 1,
        },
        prevState,
        nextState,
      },
    });
  });

  it('should handle actions without payload', () => {
    // Setup mock states
    const prevState = { count: 0 };
    const nextState = { count: 1 };
    mockStore.getState
      .mockReturnValueOnce(prevState)
      .mockReturnValueOnce(nextState);

    // Dispatch action without payload
    const action = { type: 'INCREMENT' };
    middleware(action);

    // Verify payload is undefined
    expect(mockClient.sendMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        payload: expect.objectContaining({
          action: {
            type: 'INCREMENT',
            payload: undefined,
          },
        }),
      })
    );
  });

  it('should not send message for non-action objects', () => {
    // Dispatch non-action (no type property)
    middleware({ notAnAction: true });

    // Verify no message was sent
    expect(mockClient.sendMessage).not.toHaveBeenCalled();
  });

  it('should handle primitive action values', () => {
    // Dispatch primitive values (not objects)
    middleware('STRING_ACTION');
    middleware(null);
    middleware(undefined);

    // Verify no messages were sent for primitive actions
    expect(mockClient.sendMessage).not.toHaveBeenCalled();
  });

  it('should catch and handle errors during sendMessage', () => {
    // Setup mock to throw
    mockClient.sendMessage.mockImplementation(() => {
      throw new Error('Test error');
    });

    // Spy on console.error
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

    // Setup test data
    const action = { type: 'TEST_ACTION' };

    // Should not throw error
    expect(() => middleware(action)).not.toThrow();

    // Should log error
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      'Failed to send WebSocket message:',
      expect.any(Error)
    );

    // Restore console
    consoleErrorSpy.mockRestore();
  });

  it('should return action result even when client is not available', () => {
    // Create middleware without client
    const middlewareWithoutClient = reduxMiddleware(
      null as unknown as WebSocketClient
    )(mockStore)(mockNext);

    // Dispatch action
    const action = { type: 'TEST_ACTION' };
    const result = middlewareWithoutClient(action);

    // Should still call next middleware
    expect(mockNext).toHaveBeenCalledWith(action);

    // Should return result
    expect(result).toEqual(action);

    // Should not try to send message
    expect(mockClient.sendMessage).not.toHaveBeenCalled();
  });
});
