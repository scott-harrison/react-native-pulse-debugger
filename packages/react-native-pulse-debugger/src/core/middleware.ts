import type { Middleware } from '@reduxjs/toolkit';
import { getPulse } from './connection';

/**
 * Redux middleware that sends actions to the Pulse debugger.
 * Add this middleware to your Redux store to automatically send actions to the debugger.
 *
 * @example
 * ```ts
 * import { configureStore } from '@reduxjs/toolkit';
 * import { pulseReduxMiddleware } from 'react-native-pulse-debugger';
 *
 * export const store = configureStore({
 *   reducer: rootReducer,
 *   middleware: (getDefaultMiddleware) =>
 *     getDefaultMiddleware().concat(pulseReduxMiddleware),
 * });
 * ```
 */
export const pulseReduxMiddleware: Middleware =
  (store) => (next) => (action) => {
    const result = next(action);
    const pulse = getPulse();

    if (pulse) {
      // Safely access action properties
      const actionType =
        typeof action === 'object' && action !== null && 'type' in action
          ? String(action.type)
          : 'UNKNOWN_ACTION';

      const actionPayload =
        typeof action === 'object' && action !== null && 'payload' in action
          ? action.payload
          : undefined;

      pulse.send('redux', {
        action: actionType,
        payload: actionPayload,
        state: store.getState(),
        timestamp: Date.now(),
      });
    }

    return result;
  };
