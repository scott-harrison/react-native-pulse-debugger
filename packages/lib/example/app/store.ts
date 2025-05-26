import { configureStore } from '@reduxjs/toolkit';
import counterReducer from './features/counter/counterSlice';
import { pulseDebugger } from '@react-native-pulse-debugger/lib';

// Configure the debugger first
pulseDebugger.configure({
  port: 8973,
  enableConsole: true,
  enableNetwork: true,
});

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

const store = createStore();
export default store;
