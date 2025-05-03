import { create } from 'zustand';
import { ReduxEventMessage } from '@pulse/shared-types';

/**
 * Interface for the Redux store state.
 */
export interface ReduxState {
  reduxState: unknown; // Current Redux state (mirrors the app's Redux state)
  reduxActions: ReduxEventMessage[];
  setReduxState: (state: any) => void;
  addReduxAction: (action: ReduxEventMessage) => void;
  clearReduxActions: () => void;
}

export const useReduxStore = create<ReduxState>(set => ({
  reduxState: null,
  reduxActions: [],
  setReduxState: (state: unknown) => set({ reduxState: state }),
  addReduxAction: message => {
    // Validate the action object
    if (!message || typeof message !== 'object' || !message?.payload) {
      console.error('[Pulse Debugger] Invalid Redux event:', message);
      return;
    }

    // Validate required fields
    if (!message.payload.action.type) {
      console.error(
        '[Pulse Debugger] Invalid Redux event: missing action.type',
        message.payload.action.type
      );
      return;
    }

    set(store => {
      // Keep only the last 100 actions
      const reduxActions = [...store.reduxActions, message].slice(-100);

      // Update the current state with the 'after' state from the diff (if available)
      const reduxState = message?.payload?.nextState || store.reduxState;

      return { reduxActions, reduxState };
    });
  },

  clearReduxActions: () =>
    set({
      reduxActions: [],
      reduxState: null,
    }),
}));
