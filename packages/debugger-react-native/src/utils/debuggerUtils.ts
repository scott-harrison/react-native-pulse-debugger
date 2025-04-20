import { getPulse } from '../connectionManager';
import { LibToDebuggerEventType } from '@pulse/shared-types';

/**
 * Sends a message to the debugger with proper type and payload formatting
 * @param type - The type of message to send (from LibToDebuggerEventType)
 * @param payload - The payload to send
 * @returns boolean indicating if the send was successful
 */
export const sendToDebugger = <T extends object>(
  type: LibToDebuggerEventType,
  payload: T
): boolean => {
  try {
    const pulse = getPulse();
    if (pulse) {
      return pulse.send({
        type,
        ...payload,
      });
    }
    return false;
  } catch (error) {
    console.error('[Pulse Debugger] Error sending message:', error);
    return false;
  }
};

/**
 * Creates a wrapper function that prevents recursive logging when sending messages
 * @param sendFn - The function to wrap with recursive protection
 * @returns A wrapped function that prevents recursive calls
 */
export const withRecursionProtection = <T extends (...args: any[]) => any>(
  sendFn: T
): T => {
  let isExecuting = false;

  return ((...args: Parameters<T>): ReturnType<T> => {
    if (isExecuting) return undefined as ReturnType<T>;

    try {
      isExecuting = true;
      return sendFn(...args);
    } finally {
      isExecuting = false;
    }
  }) as T;
};
