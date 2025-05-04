import type { Middleware } from 'redux';
import { WebSocketClient } from '../client/WebSocketClient';
import type { IEvent, TReduxAction } from '@pulse/shared-types';
import { generateUuid } from '../utils/generateUUID';

export function reduxMiddleware(client: WebSocketClient): Middleware {
  return (store) => (next) => (action: unknown) => {
    // Get the state before the action is applied
    const prevState = store.getState();

    // Apply the action
    const result = next(action);

    // Get the state after the action is applied
    const nextState = store.getState();

    if (!client) return result;

    // Send state update to debugger
    if (action && typeof action === 'object' && 'type' in action) {
      const reduxAction = action as TReduxAction;
      const message: IEvent<'redux_action_event'> = {
        type: 'redux_action_event',
        payload: {
          action: {
            type: reduxAction.type,
            payload: reduxAction.payload || undefined,
          },
          prevState,
          nextState,
        },
        id: generateUuid(),
        timestamp: new Date().toISOString(),
      };
      try {
        client.sendMessage(message);
      } catch (error) {
        console.error('Failed to send WebSocket message:', error);
      }
    }

    return result;
  };
}
