import type { Middleware } from 'redux';
import type { Message } from '../client/types';
import { WebSocketClient } from '../client/WebSocketClient';
import { MessageType } from '@pulse/shared-types';

// Define a type for Redux actions
interface ReduxAction {
  type: string;
  payload?: any;
}

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
      const reduxAction = action as ReduxAction;
      const message: Message = {
        type: MessageType.ReduxEvent,
        payload: {
          action: {
            type: reduxAction.type,
            payload: reduxAction.payload || undefined,
          },
          prevState,
          nextState,
          timestamp: new Date().toISOString(),
        },
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
