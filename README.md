```txt
██████╗ ██╗   ██╗██╗     ███████╗███████╗
██╔══██╗██║   ██║██║     ██╔════╝██╔════╝
██████╔╝██║   ██║██║     ███████╗█████╗
██╔═══╝ ██║   ██║██║     ╚════██║██╔══╝
██║     ╚██████╔╝███████╗███████║███████╗
╚═╝      ╚═════╝ ╚══════╝╚══════╝╚══════╝
      React Native Debugging Reimagined
```

**Pulse** is a standalone devtool built to debug your React Native 0.78+ apps with clarity and control.

It provides a **real-time dashboard** to visualize:

- ⚙️ Redux actions and state changes
- 🌐 Network requests (`fetch`, `axios`)
- 📝 Console logs and system events
- 🔍 Detailed request/response inspection

> Built for developers who want to go beyond Flipper — Pulse gives you a focused debugging experience that works reliably across devices and emulators.

---

## 📦 Monorepo Overview

This repo contains two packages:

| Package                                                                          | Description                                                                                    |
| -------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| [`packages/react-native-pulse-debugger`](./packages/react-native-pulse-debugger) | The Pulse SDK for React Native apps. Includes Redux middleware and network tracking utilities. |
| [`packages/debugger`](./packages/debugger)                                       | The Electron + React app that serves as the Pulse desktop debugger.                            |

---

## ⚙️ Features

- ✅ Works with React Native 0.78+
- ✅ Time-stamped action/state tracking
- ✅ Full or diff-based Redux state inspection
- ✅ Network request/response logging (with duration + status)
- ✅ Console log streaming and filtering
- ✅ Zero config to get started
- ✅ Written in TypeScript
- ✅ Dark mode UI

---

## 🚀 Quick Start

### For Users (Using the Released App)

1. Download the latest release from the [Releases page](https://github.com/your-org/react-native-pulse-debugger/releases)
2. Install the app on your computer
3. Launch the Pulse Debugger app
4. Install the Pulse SDK in your React Native app:

TODO - UPDATE WITH PACKAGE NAME ONCE UPLOADED TO NPM

```bash
yarn add <NPM_PACKAGE_NAME>
# or
npm install <NPM_PACKAGE_NAME>
```

5. Connect your React Native app by following the [Client SDK Usage](#-client-sdk-usage) instructions below

### For Developers (Building from Source)

1. Clone the repo

```bash
git clone https://github.com/your-org/react-native-pulse-debugger.git
cd react-native-pulse-debugger
```

2. Install dependencies

```bash
# At the root
yarn install
```

3. Run the debugger app in development mode

```bash
yarn debugger:dev
```

This starts the Pulse debugger UI at `ws://localhost:8973`.

4. Build the app for distribution

```bash
yarn debugger:build
```

This will create distributable packages in the `packages/debugger/dist` directory.

---

## 🚀 Client SDK Usage

Inside your React Native app:

```bash
yarn add react-native-pulse-debugger
```

### 1. Initialize Pulse Debugger

In your `App.tsx` or entry file:

```tsx
import { initializePulse, getPulse } from 'react-native-pulse-debugger';

// Initialize Pulse Debugger
initializePulse({
  host: 'localhost',
  port: 8973,
  autoConnect: true,
  retryInterval: 5000,
});

// Optional: Configure event handling
const pulse = getPulse();
if (pulse) {
  pulse.updateEventConfig({
    enableBatching: false,
    enableThrottling: false,
  });
}
```

### 2. Set up Redux Middleware

In your Redux store configuration:

```tsx
import { configureStore } from '@reduxjs/toolkit';
import { pulseReduxMiddleware } from 'react-native-pulse-debugger';

export const store = configureStore({
  reducer: {
    // your reducers...
  },
  middleware: getDefaultMiddleware => getDefaultMiddleware().concat(pulseReduxMiddleware),
});
```

### 3. Add Network and Console Middleware

In your `App.tsx` or entry file:

```tsx
import { pulseNetworkMiddleware, pulseConsoleMiddleware } from 'react-native-pulse-debugger';

// Apply network middleware to track fetch requests
global.fetch = pulseNetworkMiddleware(fetch);

// Apply console middleware to track console logs
global.console = pulseConsoleMiddleware(console);
```

### 4. Monitor Connection Status (Optional)

```tsx
import { getPulse } from 'react-native-pulse-debugger';
import type { ConnectionStatus } from 'react-native-pulse-debugger';

function YourComponent() {
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('disconnected');

  useEffect(() => {
    const pulse = getPulse();
    if (pulse) {
      setConnectionStatus(pulse.getStatus());
    }
  }, []);

  return (
    <View>
      <Text>Debugger Status: {connectionStatus}</Text>
    </View>
  );
}
```

---

## 🖥️ Debugger UI

The desktop app is built with:

- ⚛️ React + Tailwind (dark mode)
- ⚡ Vite for fast bundling
- 🧩 Electron for native app support

It listens on port `8973` by default.

---

## 🧱 Folder Structure

```
pulse/
├── packages/
│   ├── react-native-pulse-debugger/  # React Native SDK
│   └── debugger/                     # Electron + React debugger UI
├── package.json                      # Root workspace config
└── README.md
```

---

## 🧪 Roadmap

- [ ] Action re-dispatch (time travel)
- [ ] AsyncStorage visualizer
- [ ] Network request mocking

---

## 📣 Contributing

Pull requests, ideas, and bug reports are welcome!  
Check out [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines.

---

## 📄 License

MIT License © 2024 Scott Harrison

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
