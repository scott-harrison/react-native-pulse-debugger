import { configureStore } from '@reduxjs/toolkit';
import counterReducer from './features/counter/counterSlice';
import { pulseDebugger } from '@pulse/debugger-lib';

export function createStore() {
  return configureStore({
    reducer: {
      counter: counterReducer,
    },
    middleware: (getDefaultMiddleware) => {
      return getDefaultMiddleware().concat(
        pulseDebugger.createReduxMiddleware()
      );
    },
  });
}

export type RootState = ReturnType<ReturnType<typeof createStore>['getState']>;
export type AppDispatch = ReturnType<typeof createStore>['dispatch'];
