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
  data: {
    type: string;
    payload: any;
    prevState: ReduxState;
    nextState: ReduxState;
  };
  timestamp: number;
}

/**
 * Redux store interface
 */
export interface ReduxStore {
  getState: () => unknown;
}
