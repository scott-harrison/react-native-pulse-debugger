```txt
██████╗ ██╗   ██╗██╗     ███████╗███████╗
██╔══██╗██║   ██║██║     ██╔════╝██╔════╝
██████╔╝██║   ██║██║     █████╗  ███████╗
██╔═══╝ ██║   ██║██║     ██╔══╝  ╚════██║
██║     ╚██████╔╝███████╗███████╗███████║
╚═╝      ╚═════╝ ╚══════╝╚══════╝╚══════╝
      React Native Debugging Reimagined
```

**Pulse** standalone devtool built to debug your React Native 0.78+ apps with clarity and control.

It provides a **real-time dashboard** to visualize:

- ⚙️ Redux actions and state changes  
- 🌐 Network requests (`fetch`, `axios`)  
- 🕵️ Logs and system events (coming soon)

> Built for developers who want to go beyond Flipper — Pulse gives you a focused debugging experience that works reliably across devices and emulators.

---

## 📦 Monorepo Overview

This repo contains two packages:

| Package | Description |
|--------|-------------|
| [`packages/client`](./packages/client) | The Pulse SDK for React Native apps. Includes Redux middleware and network tracking utilities. |
| [`packages/debugger`](./packages/debugger) | The Electron + React app that serves as the Pulse desktop debugger. |

---

## ⚙️ Features

- ✅ Works with React Native 0.78+  
- ✅ Time-stamped action/state tracking  
- ✅ Full or diff-based Redux state inspection  
- ✅ Network request/response logging (with duration + status)  
- ✅ Zero config to get started  
- ✅ Written in TypeScript

---

## 🚀 Quick Start

### 1. Clone the repo

```bash
git clone https://github.com/your-org/react-native-pulse-debugger.git
cd react-native-pulse-debugger
```

### 2. Install dependencies

```bash
# At the root
yarn install
# or npm install if preferred
```

### 3. Run the debugger app

```bash
cd packages/debugger
yarn dev
```

This starts the Pulse debugger UI at `ws://localhost:39842`.

---

## 📲 Client SDK Usage

Inside your React Native app:

```bash
yarn add react-native-pulse-debugger-client
```

In your Redux store setup:

```ts
import { connectToPulseDebugger, createDebugMiddleware, patchFetch } from 'react-native-pulse-debugger-client';

// Connect to debugger
const socket = connectToPulseDebugger(); // defaults to ws://localhost:39842

// Optional: patch fetch
patchFetch(socket.send);

// Add Redux middleware
const pulseMiddleware = createDebugMiddleware({
  send: socket.send,
  diffMode: true,
});
```

---

## 🖥️ Debugger UI

The desktop app is built with:

- ⚛️ React + Tailwind (dark mode)
- ⚡ Vite for fast bundling
- 🧩 Electron for native app support

It listens on port `39842` by default.

---

## 🧱 Folder Structure

```
pulse/
├── packages/
│   ├── client/        # React Native SDK
│   └── debugger/      # Electron + React debugger UI
├── package.json       # Root workspace config
└── README.md
```

---

## 🧪 Roadmap

- [ ] Action re-dispatch (time travel)
- [ ] Console log streaming
- [ ] AsyncStorage visualizer
- [ ] Mobile web dashboard
- [ ] Plugin architecture

---

## 📣 Contributing

Pull requests, ideas, and bug reports are welcome!  
Check out [CONTRIBUTING.md](./CONTRIBUTING.md) (coming soon) for guidelines.

---

## 📄 License

MIT License © [Your Name or Org]
