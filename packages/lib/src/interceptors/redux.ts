import { PulseDebugger } from '../index';

type ReduxState = Record<string, unknown>;

type ReduxAction<T = unknown> = {
  type: string;
  payload?: T;
};

type ReduxStore = {
  getState: () => ReduxState;
  dispatch: <T>(action: ReduxAction<T>) => ReduxAction<T>;
};

type ReduxDispatch = <T>(action: ReduxAction<T>) => ReduxAction<T>;

type ReduxMiddleware = (
  store: ReduxStore
) => (next: ReduxDispatch) => <T>(action: ReduxAction<T>) => ReduxAction<T>;

type StateDiff = {
  [key: string]: {
    prev: unknown;
    next: unknown;
  };
};

export class ReduxInterceptor {
  private pulse: PulseDebugger;
  private isReduxAvailable: boolean;

  constructor(pulse: PulseDebugger) {
    this.pulse = pulse;
    this.isReduxAvailable = this.checkReduxAvailability();
  }

  private checkReduxAvailability(): boolean {
    try {
      require('redux');
      return true;
    } catch {
      return false;
    }
  }

  createMiddleware(): ReduxMiddleware | null {
    if (!this.isReduxAvailable) {
      console.warn(
        'PulseDebugger: Redux is not installed. Redux monitoring will be disabled. ' +
          'To enable Redux monitoring, install redux: npm install redux'
      );
      return null;
    }

    return (store: ReduxStore) =>
      (next: ReduxDispatch) =>
      <T>(action: ReduxAction<T>) => {
        const startTime = Date.now();
        const prevState = store.getState();

        const result = next(action);

        if (this.pulse.isReduxMonitoringEnabled()) {
          const nextState = store.getState();
          this.pulse.sendReduxEvent({
            type: 'action',
            action: {
              type: action.type,
              payload: action.payload,
              timestamp: startTime,
            },
            state: {
              prev: prevState,
              next: nextState,
              diff: this.getStateDiff(prevState, nextState),
            },
            duration: Date.now() - startTime,
          });
        }

        return result;
      };
  }

  private getStateDiff(prevState: ReduxState, nextState: ReduxState): StateDiff | null {
    if (prevState === nextState) return null;

    const diff: StateDiff = {};
    const allKeys = new Set([...Object.keys(prevState), ...Object.keys(nextState)]);

    allKeys.forEach(key => {
      if (prevState[key] !== nextState[key]) {
        diff[key] = {
          prev: prevState[key],
          next: nextState[key],
        };
      }
    });

    return diff;
  }
}
