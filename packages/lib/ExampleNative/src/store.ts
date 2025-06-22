import { configureStore } from '@reduxjs/toolkit';
import { PulseDebugger } from '@react-native-pulse-debugger/lib';
import counterReducer from './features/counter/counterSlice';

export function createStore() {
  return configureStore({
    reducer: {
      counter: counterReducer,
    },
    middleware: getDefaultMiddleware =>
      getDefaultMiddleware().concat(...PulseDebugger.getInstance().getReduxMiddleware()),
  });
}

export type RootState = ReturnType<ReturnType<typeof createStore>['getState']>;
export type AppDispatch = ReturnType<typeof createStore>['dispatch'];
