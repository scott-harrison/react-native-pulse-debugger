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
  appName: 'MyApp', // Optional: Override the automatically detected app name
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

## Configuration Options

| Option          | Type    | Default                                   | Description                                                   |
| --------------- | ------- | ----------------------------------------- | ------------------------------------------------------------- |
| `host`          | string  | 'localhost' (iOS) or '10.0.2.2' (Android) | The host to connect to                                        |
| `port`          | number  | 8973                                      | The port to connect to                                        |
| `autoConnect`   | boolean | true                                      | Whether to automatically connect on initialization            |
| `retryInterval` | number  | 3000                                      | The interval in milliseconds to retry connection              |
| `appName`       | string  | Auto-detected                             | The name of your app (automatically detected if not provided) |

### Automatic App Name Detection

The library automatically detects your app name using the following methods in order of preference:

1. **Expo Apps**: If your app is built with Expo, it uses the name from `expoConfig.name`
2. **iOS Apps**: Uses the app name from `SettingsManager` (AppDisplayName or AppName)
3. **Android Apps**: Uses the app name from `AppInfo` or extracts it from the package name
4. **Fallback**: If all else fails, it uses 'React Native App'

You can override this automatic detection by providing your own `appName` in the configuration.

### Performance Optimization

The library includes built-in performance optimizations to reduce WebSocket traffic and improve overall performance:

```js
import { getPulse } from 'react-native-pulse-debugger';

// Get the debugger instance
const pulse = getPulse();

// Configure performance settings
pulse?.updateEventConfig({
  // Maximum number of events to batch together before sending
  batchSize: 20,

  // Maximum time in milliseconds to wait before sending a batch
  batchTimeout: 500,

  // Minimum time in milliseconds between sending events of the same type
  throttleInterval: 50,

  // Whether to enable batching of events
  enableBatching: true,

  // Whether to enable throttling of events
  enableThrottling: true,
});

// Manually flush queued events if needed
pulse?.flushEvents();
```

These optimizations help reduce the number of WebSocket messages sent to the debugger, which can improve performance, especially in apps with high event frequency.

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

## Network Monitoring

The library provides a network middleware that intercepts fetch requests and sends them to the debugger:

```js
import { pulseNetworkMiddleware } from 'react-native-pulse-debugger';

// Apply the middleware to the global fetch
global.fetch = pulseNetworkMiddleware(fetch);

// Now all fetch requests will be monitored
fetch('https://api.example.com/data')
  .then((response) => response.json())
  .then((data) => console.log(data));
```

The network middleware captures:

- Request details (URL, method, headers, body)
- Response details (status, headers, body)
- Timing information (duration)
- Error information (if the request fails)

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
- Network middleware for automatic request tracking

## Contributing

See the [contributing guide](CONTRIBUTING.md) to learn how to contribute to the repository and the development workflow.

## License

MIT

---

Made with [create-react-native-library](https://github.com/callstack/react-native-builder-bob)
