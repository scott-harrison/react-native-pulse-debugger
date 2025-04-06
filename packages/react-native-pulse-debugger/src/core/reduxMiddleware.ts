import type { Middleware } from '@reduxjs/toolkit';
import { getPulse } from './connection';

// Track the last sent action to prevent duplicates
let lastSentAction: {
  type: string;
  timestamp: number;
  payload: any;
} | null = null;

/**
 * Redux middleware that sends actions to the Pulse debugger.
 * Add this middleware to your Redux store to automatically send actions to the debugger.
 *
 * @example
 * ```ts
 * import { configureStore } from '@reduxjs/toolkit';
 * import { pulseReduxMiddleware } from '@pulse-debugger/react-native';
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
      // Set the store reference in the Pulse connection
      if (!pulse.getReduxStore()) {
        pulse.setReduxStore(store);
      }

      // Safely access action properties
      const actionType =
        typeof action === 'object' && action !== null && 'type' in action
          ? String(action.type)
          : 'UNKNOWN_ACTION';

      const actionPayload =
        typeof action === 'object' && action !== null && 'payload' in action
          ? action.payload
          : undefined;

      const actionTimestamp = Date.now();

      // Check if this is a duplicate action
      if (
        lastSentAction &&
        lastSentAction.type === actionType &&
        lastSentAction.timestamp === actionTimestamp &&
        JSON.stringify(lastSentAction.payload) === JSON.stringify(actionPayload)
      ) {
        console.log(
          'Skipping duplicate Redux action in middleware:',
          actionType
        );
        return result;
      }

      // Update the last sent action
      lastSentAction = {
        type: actionType,
        timestamp: actionTimestamp,
        payload: actionPayload,
      };

      // Send a properly formatted message with the action type and payload
      pulse.send('redux', {
        action: {
          type: actionType,
          payload: actionPayload,
          timestamp: actionTimestamp,
        },
        state: store.getState(),
      });
    }

    return result;
  };
