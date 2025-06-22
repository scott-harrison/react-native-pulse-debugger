# React Native Pulse Debugger

A debugging library for React Native applications that provides real-time monitoring of console logs, network requests, and Redux state to pulse debugger macos/windows desktop apps.

## Features

- 🔍 **Console Monitoring**: Intercepts and forwards console.log, console.warn, console.error, console.debug, and console.info calls
- 🌐 **Network Monitoring**: Tracks all fetch requests with timing, status codes, and response data
- 🔄 **Redux Monitoring**: Monitors Redux actions and state changes with middleware integration
- ⚙️ **Configurable**: Customize monitoring options, connection settings, and filtering
- 🚀 **Auto-reconnection**: Automatic retry mechanism for WebSocket connections
- 📦 **Lightweight**: Minimal performance impact with efficient event batching
- 🔌 **Smart Host Discovery**: Automatic detection of development server host for both Expo and React Native CLI projects

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
        monitoring: {
            console: true,
            network: true,
            redux: false,
        },
    });
}
```

### Connection Configuration

The Pulse Debugger automatically discovers the correct host and port for your development environment. However, you can also configure it manually:

#### Automatic Host Discovery (Recommended)

The library automatically detects the correct host and port:

- **Expo Projects**: Uses Expo's development server host from `expo-constants`
- **React Native CLI**: Uses Metro bundler's network interface detection
- **Manual Override**: You can always specify `host` and `port` explicitly

```typescript
// Automatic discovery (recommended)
initializePulse({
    monitoring: {
        console: true,
        network: true,
        redux: false,
    },
});

// Manual configuration
initializePulse({
    host: '192.168.1.100', // Your computer's IP address
    port: 8973,
    monitoring: {
        console: true,
        network: true,
        redux: false,
    },
});
```

#### Connection Scenarios

##### 1. **Same Network (WiFi)**

When your device and computer are on the same WiFi network:

```typescript
// Automatic discovery works best
initializePulse({
    monitoring: {
        console: true,
        network: true,
        redux: false,
    },
});
```

##### 2. **USB Tethering**

When your device is connected via USB cable:

```typescript
// For USB tethering, you may need to specify the host manually
initializePulse({
    host: 'localhost', // or your computer's IP address
    port: 8973,
    monitoring: {
        console: true,
        network: true,
        redux: false,
    },
});
```

##### 3. **Expo Development Builds**

For Expo development builds, the host discovery works automatically:

```typescript
// Expo automatically provides the correct host
initializePulse({
    monitoring: {
        console: true,
        network: true,
        redux: false,
    },
});
```

##### 4. **React Native CLI Projects**

For React Native CLI projects, ensure Metro middleware is configured:

```javascript
// metro.config.js
const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');

const config = {
    server: {
        enhanceMiddleware: middleware => {
            const pulseDebuggerMiddleware = require('@react-native-pulse-debugger/lib/metro-middleware');
            return (req, res, next) => {
                pulseDebuggerMiddleware(req, res, next);
                return middleware(req, res, next);
            };
        },
    },
};

module.exports = mergeConfig(getDefaultConfig(__dirname), config);
```

### Configuration Options

```typescript
interface PulseDebuggerConfig {
    host?: string; // WebSocket server host (default: auto-discovered)
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

## Troubleshooting Connection Issues

### Common Connection Problems

#### 1. **Device Cannot Connect to Host**

- **Symptom**: Connection timeout or "connection refused" errors
- **Solution**:
    - Ensure your device and computer are on the same network
    - Check if your computer's firewall is blocking port 8973
    - Try using your computer's IP address explicitly: `host: '192.168.1.100'`

#### 2. **USB Tethering Issues**

- **Symptom**: Device connected via USB but can't reach the debugger
- **Solution**:
    - Use `host: 'localhost'` for USB tethering
    - Or use your computer's local IP address
    - Ensure USB debugging is enabled on Android devices

#### 3. **Expo Development Build Connection**

- **Symptom**: Expo app can't connect to the debugger
- **Solution**:
    - The library automatically detects Expo's development server
    - If issues persist, manually specify the host from Expo's development tools

#### 4. **React Native CLI Metro Issues**

- **Symptom**: Metro bundler can't serve the host discovery endpoint
- **Solution**:
    - Ensure the Metro middleware is properly configured in `metro.config.js`
    - Restart the Metro bundler after configuration changes

### Debugging Connection Status

You can check the connection status programmatically:

```typescript
import { getPulse } from '@react-native-pulse-debugger/lib';

const pulse = getPulse();

// Check if connected
if (pulse.isConnected()) {
    console.log('✅ Connected to Pulse Debugger');
} else {
    console.log('❌ Not connected to Pulse Debugger');
}

// Get current configuration
const config = pulse.getConfig();
console.log('Current host:', config.host);
console.log('Current port:', config.port);
```

### Network Configuration Examples

#### For Different Development Environments

```typescript
// Development on local machine
initializePulse({
    host: 'localhost',
    port: 8973,
    monitoring: { console: true, network: true, redux: false },
});

// Development with device on same network
initializePulse({
    host: '192.168.1.100', // Your computer's IP
    port: 8973,
    monitoring: { console: true, network: true, redux: false },
});

// USB tethering
initializePulse({
    host: 'localhost',
    port: 8973,
    monitoring: { console: true, network: true, redux: false },
});

// Expo development (automatic)
initializePulse({
    monitoring: { console: true, network: true, redux: false },
});
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

## Examples

See the `ExampleExpo` and `ExampleNative` directories for complete working examples of:

- Basic setup and configuration
- Redux integration with Redux Toolkit
- Dynamic monitoring control
- Connection status monitoring
- Different network configurations

## License

MIT
