# react-native-pulse-debugger

A debugging tool for React Native applications that provides real-time monitoring of Redux state, network requests, console logs, through an intuitive desktop interface.

## Installation

```sh
npm install react-native-pulse-debugger
```

## Usage

Initialize the debugger in your app's entry point (e.g., `App.tsx`):

```js
import { initializePulse, getPulse } from 'react-native-pulse-debugger';

// Initialize with configuration
initializePulse({
  host: 'localhost',
  port: 8080,
  autoConnect: true,
  retryInterval: 5000,
});

// Get the debugger instance
const pulse = getPulse();

// Send debug events
pulse?.send('redux', {
  action: 'USER_LOGIN',
  state: {
    /* current state */
  },
});

pulse?.send('network', {
  method: 'GET',
  url: 'https://api.example.com/data',
  status: 200,
  response: {
    /* response data */
  },
});

pulse?.send('console', {
  level: 'info',
  message: 'User logged in successfully',
});

pulse?.send('error', {
  message: 'Failed to fetch data',
  stack: 'Error: Network request failed...',
});
```

## Redux Integration

The library provides a Redux middleware that automatically sends actions and state changes to the debugger:

```js
import { configureStore } from '@reduxjs/toolkit';
import { pulseReduxMiddleware } from 'react-native-pulse-debugger';
import rootReducer from './reducers';

export const store = configureStore({
  reducer: rootReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(pulseReduxMiddleware),
});
```

## Features

- Real-time debugging through WebSocket connection
- Automatic reconnection handling
- Support for different types of debug events:
  - Redux state changes
  - Network requests
  - Console logs
  - Error tracking
- Type-safe API with TypeScript support
- Development-only initialization
- Redux middleware for automatic action tracking

## Contributing

See the [contributing guide](CONTRIBUTING.md) to learn how to contribute to the repository and the development workflow.

## License

MIT

---

Made with [create-react-native-library](https://github.com/callstack/react-native-builder-bob)
