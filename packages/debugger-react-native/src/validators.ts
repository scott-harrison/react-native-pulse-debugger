import {
  LibToDebuggerEventType,
  DebuggerToLibEventType,
  type ValidationResult,
} from '@pulse/shared-types';

export const validators: Record<
  LibToDebuggerEventType | DebuggerToLibEventType,
  (payload: unknown) => ValidationResult
> = {
  [LibToDebuggerEventType.REDUX_STATE_UPDATE]: (
    payload: unknown
  ): ValidationResult => {
    if (!payload || typeof payload !== 'object') {
      return { isValid: false, error: 'Payload must be an object' };
    }

    const { state } = payload as any;
    if (!state || typeof state !== 'object') {
      return { isValid: false, error: 'Payload must contain a state object' };
    }

    return { isValid: true };
  },

  [LibToDebuggerEventType.NETWORK_REQUEST]: (
    payload: unknown
  ): ValidationResult => {
    if (!payload || typeof payload !== 'object') {
      return { isValid: false, error: 'Payload must be an object' };
    }

    const { url, method, headers } = payload as any;

    if (url && typeof url !== 'string') {
      return { isValid: false, error: 'URL must be a string' };
    }

    if (method && typeof method !== 'string') {
      return { isValid: false, error: 'Method must be a string' };
    }

    if (headers && typeof headers !== 'object') {
      return { isValid: false, error: 'Headers must be an object' };
    }

    return { isValid: true };
  },

  [LibToDebuggerEventType.CONSOLE]: () => ({ isValid: true }),
  [LibToDebuggerEventType.REDUX_ACTION]: () => ({ isValid: true }),

  [DebuggerToLibEventType.REDUX_STATE_REQUEST]: () => ({ isValid: true }),
};
