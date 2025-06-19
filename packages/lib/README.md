# React Native Pulse Debugger

A debugging library for React Native applications that provides real-time monitoring of console logs, network requests, and Redux state to pulse debugger macos/windows desktop apps.

## Features

- 🔍 **Console Monitoring**: Intercepts and forwards console.log, console.warn, console.error, console.debug, and console.info calls
- 🌐 **Network Monitoring**: Tracks all fetch requests with timing, status codes, and response data
- 🔄 **Redux Monitoring**: Monitors Redux actions and state changes with middleware integration
- ⚙️ **Configurable**: Customize monitoring options, connection settings, and filtering
- 🚀 **Auto-reconnection**: Automatic retry mechanism for WebSocket connections
- 📦 **Lightweight**: Minimal performance impact with efficient event batching

## Installation

### Using Yarn (Recommended)

```bash
yarn add -D @react-native-pulse-debugger/lib
```

### Using npm

```bash
npm install --save-dev @react-native-pulse-debugger/lib
```

## Setup and Configuration

### Basic Setup

Import and initialize the Pulse Debugger in your app's entry point:

```typescript
import { initializePulse } from '@react-native-pulse-debugger/lib';

// Only initialize in development
if (__DEV__) {
    initializePulse({
        host: 'localhost',
        port: 8973,
        monitoring: {
            console: true,
            network: true,
            redux: false,
        },
    });
}
```

### Configuration Options

```typescript
interface PulseDebuggerConfig {
    host?: string; // WebSocket server host (default: 'localhost')
    port?: number; // WebSocket server port (default: 8973)
    autoConnect?: boolean; // Auto-connect to WebSocket (default: true)
    retryInterval?: number; // Reconnection interval in ms (default: 5000)
    enableBatching?: boolean; // Enable event batching (default: true)
    enableThrottling?: boolean; // Enable event throttling (default: true)
    consoleBlacklist?: string[]; // Console messages to ignore
    networkBlacklist?: string[]; // Network URLs to ignore
    monitoring?: {
        console?: boolean; // Enable console monitoring (default: true)
        network?: boolean; // Enable network monitoring (default: true)
        redux?: boolean; // Enable Redux monitoring (default: false)
    };
}
```

### Redux Middleware Setup

To monitor Redux actions and state changes, you need to add the Pulse Debugger middleware to your Redux store:

#### Using Redux Toolkit

```typescript
import { configureStore } from '@reduxjs/toolkit';
import { PulseDebugger } from '@react-native-pulse-debugger/lib';
import rootReducer from './reducers';

export const store = configureStore({
    reducer: rootReducer,
    middleware: getDefaultMiddleware => {
        const middleware = getDefaultMiddleware();

        // Only add Pulse Debugger middleware in development
        if (__DEV__) {
            middleware.push(...PulseDebugger.getInstance().getReduxMiddleware());
        }

        return middleware;
    },
});
```

#### Using Vanilla Redux

```typescript
import { createStore, applyMiddleware } from 'redux';
import { PulseDebugger } from '@react-native-pulse-debugger/lib';
import rootReducer from './reducers';

const middleware = [];

// Only add Pulse Debugger middleware in development
if (__DEV__) {
    middleware.push(...PulseDebugger.getInstance().getReduxMiddleware());
}

const store = createStore(rootReducer, applyMiddleware(...middleware));
```

### Enable Redux Monitoring

After setting up the middleware, enable Redux monitoring:

```typescript
// Option 1: Enable during initialization (recommended)
if (__DEV__) {
    initializePulse({
        monitoring: {
            redux: true,
            console: true,
            network: true,
        },
    });
}

// Option 2: Enable after initialization (if needed)
import { getPulse } from '@react-native-pulse-debugger/lib';
if (__DEV__) {
    getPulse().enableReduxMonitoring();
}
```

## Usage Examples

### Basic Console and Network Monitoring

```typescript
// App.tsx or index.js
import { initializePulse } from '@react-native-pulse-debugger/lib';

// Initialize with console and network monitoring
initializePulse({
    monitoring: {
        console: true,
        network: true,
        redux: false,
    },
});

// Your app code
console.log('This will be captured and sent to the debugger');
console.warn('Warning messages too');
console.error('And error messages');

// Network requests will be automatically monitored
fetch('https://api.example.com/data')
    .then(response => response.json())
    .then(data => console.log(data));
```

### Complete Redux Integration

```typescript
// store.ts
import { configureStore } from '@reduxjs/toolkit';
import { PulseDebugger } from '@react-native-pulse-debugger/lib';
import counterReducer from './features/counter/counterSlice';

export function createStore() {
  return configureStore({
    reducer: {
      counter: counterReducer,
    },
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware().concat(
        ...PulseDebugger.getInstance().getReduxMiddleware()
      ),
  });
}

// App.tsx
import { initializePulse } from '@react-native-pulse-debugger/lib';
import { Provider } from 'react-redux';
import { createStore } from './store';

// Initialize with all monitoring enabled
initializePulse({
  monitoring: {
    redux: true,
    network: true,
    console: true,
  },
});

const store = createStore();

export default function App() {
  return (
    <Provider store={store}>
      {/* Your app components */}
    </Provider>
  );
}
```

### Dynamic Configuration

```typescript
import { getPulse } from '@react-native-pulse-debugger/lib';

const pulse = getPulse();

// Enable/disable monitoring at runtime
pulse.enableNetworkMonitoring();
pulse.disableConsoleMonitoring();
pulse.enableReduxMonitoring();

// Check connection status
if (pulse.isConnected()) {
    console.log('Connected to debugger');
}

// Update configuration
pulse.configure({
    monitoring: {
        console: false,
        network: true,
        redux: true,
    },
});
```

## Requirements

### Peer Dependencies

- React >= 18.0.0
- React Native >= 0.74.0
- @babel/runtime >= 7.0.0
- expo-application >= 6.0.0 (optional)
- expo-constants >= 16.0.0 (optional)
- expo-device >= 8.0.0 (optional)

### For Redux Monitoring

- redux (any version)

## Troubleshooting

### Connection Issues

- Ensure the WebSocket server is running on the specified host and port
- Check that your device/emulator can reach the host IP address
- Verify firewall settings aren't blocking the connection

### Redux Middleware Not Working

- Make sure `redux` is installed in your project
- Ensure the middleware is properly added to your store configuration
- Check that Redux monitoring is enabled

### Network Monitoring Issues

- Network requests are automatically intercepted when monitoring is enabled
- Check the `networkBlacklist` configuration if some requests aren't being captured

## Examples

See the `ExampleExpo` and `ExampleNative` directories for complete working examples of:

- Basic setup and configuration
- Redux integration with Redux Toolkit
- Dynamic monitoring control
- Connection status monitoring

## License

MIT
.
