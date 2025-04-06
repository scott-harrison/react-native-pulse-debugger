import { create } from 'zustand';

export interface ReduxState {
  [key: string]: any;
}

export interface ReduxAction {
  type: string;
  payload: any;
  timestamp: number;
  stateDiff?: {
    before: ReduxState;
    after: ReduxState;
  };
}

interface ReduxStore {
  state: ReduxState | null;
  actions: ReduxAction[];
  setState: (state: ReduxState) => void;
  addAction: (action: ReduxAction) => void;
  clearActions: () => void;
}

export const useReduxStore = create<ReduxStore>(set => ({
  state: null,
  actions: [],
  setState: state => set({ state }),
  addAction: action =>
    set(store => {
      // Create a state diff if we have a previous state
      const stateDiff = store.state
        ? {
            before: store.state,
            after: action.stateDiff?.after || store.state,
          }
        : undefined;

      // Add the state diff to the action
      const actionWithDiff = {
        ...action,
        stateDiff,
      };

      // Keep only the last 100 actions
      const actions = [...store.actions, actionWithDiff].slice(-100);

      // Return the updated state
      return { actions };
    }),
  clearActions: () => set({ actions: [] }),
}));
