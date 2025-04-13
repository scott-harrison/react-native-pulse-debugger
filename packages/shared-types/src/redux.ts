/**
 * Redux state type
 */
export interface ReduxState {
  [key: string]: any;
}

/**
 * Redux action type
 */
export interface ReduxAction {
  type: string;
  payload: any;
  timestamp: number;
  stateDiff?: {
    before: ReduxState;
    after: ReduxState;
  };
}

/**
 * Redux store interface
 */
export interface ReduxStore {
  getState: () => unknown;
}
