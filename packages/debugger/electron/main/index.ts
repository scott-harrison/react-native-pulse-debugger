import { app, BrowserWindow, shell, ipcMain, screen } from 'electron';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import os from 'node:os';
import { networkInterfaces } from 'os';
import { createServer } from 'net';
import { WebSocketServer, WebSocket } from 'ws';
import Store from 'electron-store';

const require = createRequire(import.meta.url);
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Initialize store for window state
const store = new Store({
  defaults: {
    windowState: {
      x: undefined,
      y: undefined,
      width: 1200,
      height: 800,
    },
  },
});

function restoreWindowState(win: BrowserWindow) {
  const windowState = store.get('windowState') as {
    x?: number;
    y?: number;
    width: number;
    height: number;
  };

  // Check if the saved position is on a currently available display
  if (typeof windowState.x === 'number' && typeof windowState.y === 'number') {
    const displays = screen.getAllDisplays();
    const isOnScreen = displays.some(display => {
      const bounds = display.bounds;
      return (
        windowState.x! >= bounds.x &&
        windowState.y! >= bounds.y &&
        windowState.x! + windowState.width <= bounds.x + bounds.width &&
        windowState.y! + windowState.height <= bounds.y + bounds.height
      );
    });

    if (isOnScreen) {
      win.setBounds({
        x: windowState.x,
        y: windowState.y,
        width: windowState.width,
        height: windowState.height,
      });
    }
  }
}

function saveWindowState(win: BrowserWindow) {
  if (!win.isMaximized() && !win.isMinimized()) {
    const bounds = win.getBounds();
    store.set('windowState', bounds);
  }
}

// The built directory structure
//
// ├─┬ dist-electron
// │ ├─┬ main
// │ │ └── index.js    > Electron-Main
// │ └─┬ preload
// │   └── index.mjs   > Preload-Scripts
// ├─┬ dist
// │ └── index.html    > Electron-Renderer
//
process.env.APP_ROOT = path.join(__dirname, '../..');

export const MAIN_DIST = path.join(process.env.APP_ROOT, 'dist-electron');
export const RENDERER_DIST = path.join(process.env.APP_ROOT, 'dist');
export const VITE_DEV_SERVER_URL = process.env.VITE_DEV_SERVER_URL;

process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL
  ? path.join(process.env.APP_ROOT, 'public')
  : RENDERER_DIST;

// Disable GPU Acceleration for Windows 7
if (os.release().startsWith('6.1')) app.disableHardwareAcceleration();

// Set application name for Windows 10+ notifications
if (process.platform === 'win32') app.setAppUserModelId(app.getName());

if (!app.requestSingleInstanceLock()) {
  app.quit();
  process.exit(0);
}

let win: BrowserWindow | null = null;
const preload = path.join(__dirname, '../preload/index.js');
const indexHtml = path.join(RENDERER_DIST, 'index.html');

// WebSocket server
let wsServer: WebSocketServer | null = null;
let wsClient: WebSocket | null = null;
const WS_PORT = 8973;

function startWebSocketServer() {
  if (wsServer) {
    console.log('WebSocket server already running');
    return;
  }

  try {
    wsServer = new WebSocketServer({ port: WS_PORT });
    console.log(`WebSocket server started on port ${WS_PORT}`);

    wsServer.on('connection', socket => {
      console.log('Client connected to WebSocket server');

      // Close existing connection if any
      if (wsClient && wsClient !== socket) {
        console.log('Closing existing connection for new client');
        wsClient.close();
      }

      wsClient = socket;

      socket.on('message', data => {
        try {
          // Try to parse the message
          const message = JSON.parse(data.toString());

          // Validate message structure
          if (!message || typeof message !== 'object') {
            console.warn('Received invalid message format:', data.toString());
            return;
          }

          // Handle handshake message
          if (message.type === 'handshake') {
            // Notify renderer process
            if (win) {
              console.log('Sending connected status to renderer');
              win.webContents.send('CONNECTION_STATUS', 'connected');
            }
            return;
          }

          // Forward all other messages to the renderer process
          if (win) {
            win.webContents.send('ws-message', message);
          }
        } catch (error) {
          console.error('Error processing WebSocket message:', error);
        }
      });

      socket.on('close', () => {
        console.log('Client disconnected from WebSocket server');
        if (wsClient === socket) {
          wsClient = null;
          // Notify renderer process
          if (win) {
            win.webContents.send('connection-status', 'disconnected');
          }
        }
      });

      socket.on('error', error => {
        console.error('WebSocket error:', error);
        // Notify renderer process
        if (win) {
          win.webContents.send('connection-error', error.message || 'Connection error');
          win.webContents.send('connection-status', 'error');
        }
      });
    });

    wsServer.on('error', error => {
      console.error('WebSocket server error:', error);

      // Notify renderer process
      if (win) {
        win.webContents.send('connection-error', error.message || 'Server error');
        win.webContents.send('connection-status', 'error');
      }
    });
  } catch (error) {
    console.error('Failed to start WebSocket server:', error);
  }
}

async function createWindow() {
  try {
    const windowState = store.get('windowState') as {
      width: number;
      height: number;
    };

    win = new BrowserWindow({
      title: 'React Native Debugger',
      width: windowState.width,
      height: windowState.height,
      transparent: true,
      frame: false,
      titleBarStyle: 'hiddenInset',
      vibrancy: 'under-window',
      visualEffectState: 'active',
      backgroundColor: '#00000000',
      webPreferences: {
        preload,
        contextIsolation: true,
        nodeIntegration: false,
      },
    });

    // Restore window position after creation
    restoreWindowState(win);

    // Save window state on close and move
    win.on('close', () => {
      if (win) saveWindowState(win);
    });

    win.on('moved', () => {
      if (win) saveWindowState(win);
    });

    win.on('resized', () => {
      if (win) saveWindowState(win);
    });

    if (VITE_DEV_SERVER_URL) {
      win.loadURL(VITE_DEV_SERVER_URL);
      win.webContents.openDevTools();
    } else {
      win.loadFile(indexHtml);
      win.webContents.openDevTools();
    }
    // Start WebSocket server after window is created
    startWebSocketServer();
  } catch (error) {
    console.error('Error creating window:', error);
  }
}

app
  .whenReady()
  .then(createWindow)
  .catch(error => {
    console.error('Error in app startup:', error);
    app.quit();
  });

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// Handle messages from renderer process
ipcMain.on('send-message', (_, message) => {
  if (wsClient) {
    wsClient.send(JSON.stringify(message));
  }
});

// Handle WebSocket messages from renderer
ipcMain.on('ws-message', (_, message) => {
  if (wsClient) {
    wsClient.send(JSON.stringify(message));
  } else {
    console.warn('Cannot send WebSocket message: No client connected');
  }
});

// New window example arg: new windows url
ipcMain.handle('open-win', (_, arg) => {
  const childWindow = new BrowserWindow({
    webPreferences: {
      preload,
      nodeIntegration: true,
      contextIsolation: false,
    },
  });

  if (VITE_DEV_SERVER_URL) {
    childWindow.loadURL(`${VITE_DEV_SERVER_URL}#${arg}`);
  } else {
    childWindow.loadFile(indexHtml, { hash: arg });
  }
});
