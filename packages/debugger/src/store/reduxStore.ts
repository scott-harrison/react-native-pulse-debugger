import { create } from 'zustand';
import { ReduxEventMessage } from '@pulse/shared-types';

/**
 * Interface for the Redux store state.
 */
export interface ReduxState {
  state: any; // Current Redux state (mirrors the app's Redux state)
  actions: ReduxEventMessage[];
  setState: (state: any) => void;
  addAction: (action: ReduxEventMessage) => void;
  clearActions: () => void;
}

export const useReduxStore = create<ReduxState>((set, get) => ({
  state: null,
  actions: [],

  setState: state => set({ state }),

  addAction: action => {
    // Validate the action object
    if (!action || typeof action !== 'object') {
      console.error('[Pulse Debugger] Invalid Redux event:', action);
      return;
    }

    // Validate required fields
    if (!action.action) {
      console.error('[Pulse Debugger] Invalid Redux event: missing action field', action);
      return;
    }

    if (!action.action.type) {
      console.error('[Pulse Debugger] Invalid Redux event: missing action.type', action);
      return;
    }

    set(store => {
      // Use the stateDiff from the action if provided, otherwise calculate it
      const stateDiff =
        action.stateDiff ||
        (store.state
          ? {
              before: store.state,
              after: action.action.payload || store.state, // Fallback to current state if no new state
            }
          : undefined);

      // Add the state diff to the action
      const actionWithDiff: ReduxEventMessage = {
        ...action,
        stateDiff,
      };

      // Keep only the last 100 actions
      const actions = [...store.actions, actionWithDiff].slice(-100);

      // Update the current state with the 'after' state from the diff (if available)
      const newState = stateDiff?.after || store.state;

      return { actions, state: newState };
    });
  },

  clearActions: () =>
    set({
      actions: [],
      state: null, // Reset state as well
    }),
}));
