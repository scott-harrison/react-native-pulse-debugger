import type { Middleware } from 'redux';
import { getPulse } from './connectionManager';
import { setReduxStore } from './utils/reduxStore';
import { LibToDebuggerEventType } from '@pulse/shared-types';

/**
 * Redux middleware that sends state updates to the Pulse debugger.
 * This middleware should be added to your Redux store configuration.
 *
 * @example
 * ```ts
 * import { pulseReduxMiddleware } from 'react-native-pulse-debugger';
 *
 * const store = configureStore({
 *   reducer: rootReducer,
 *   middleware: (getDefaultMiddleware) =>
 *     getDefaultMiddleware().concat(pulseReduxMiddleware),
 * });
 * ```
 */
export const pulseReduxMiddleware: Middleware =
  (store) => (next) => (action: unknown) => {
    // Register the store with the ConnectionManager
    setReduxStore(store);

    const pulse = getPulse();
    const eventManager = pulse?.getEventManager();

    // Get the state before the action is applied
    const prevState = store.getState();

    // Apply the action
    const result = next(action);

    // Get the state after the action is applied
    const nextState = store.getState();

    // Send state update to debugger
    if (
      eventManager &&
      typeof action === 'object' &&
      action !== null &&
      'type' in action
    ) {
      eventManager.emit(LibToDebuggerEventType.REDUX_STATE_UPDATE, {
        action: {
          type: String(action.type),
          payload: 'payload' in action ? action.payload : undefined,
        },
        prevState,
        nextState,
        timestamp: Date.now(),
      });
    }

    return result;
  };
