import { app, BrowserWindow, shell, ipcMain } from 'electron';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import os from 'node:os';
import { networkInterfaces } from 'os';
import { createServer } from 'net';
import { WebSocketServer, WebSocket } from 'ws';

const require = createRequire(import.meta.url);
const __dirname = path.dirname(fileURLToPath(import.meta.url));

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
const WS_PORT = 8080;
let heartbeatInterval: NodeJS.Timeout | null = null;

// Track the last processed Redux action to prevent duplicates
let lastProcessedReduxAction: {
  type: string;
  timestamp: number;
  payload: any;
} | null = null;

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

      // Notify renderer process
      if (win) {
        win.webContents.send('connection-status', 'connecting');
      }

      wsClient = socket;

      // Start sending heartbeat messages
      if (heartbeatInterval) {
        clearInterval(heartbeatInterval);
      }

      heartbeatInterval = setInterval(() => {
        if (wsClient && wsClient.readyState === WebSocket.OPEN) {
          try {
            // Send a ping message to the client silently
            wsClient.send(JSON.stringify({ type: 'ping' }));
          } catch (error) {
            // Only log errors if they're not related to the connection being closed
            if (error.message && !error.message.includes('WebSocket is not open')) {
              console.error('Failed to send heartbeat:', error);
            }
          }
        }
      }, 3000); // Send heartbeat every 3 seconds

      socket.on('message', data => {
        try {
          const message = JSON.parse(data.toString());

          // Validate message structure
          if (!message || typeof message !== 'object') {
            console.warn('Received invalid message format:', data.toString());
            return;
          }

          // Handle handshake message
          if (message.type === 'handshake') {
            // console.log('Received handshake message:', message.payload);
            const appInfo = {
              name: message.payload?.appName || 'Unknown App',
              platform: message.payload?.platform || 'Unknown',
              version: message.payload?.version || 'Unknown',
              timestamp: message.payload?.timestamp || Date.now(),
            };

            // Notify renderer process
            if (win) {
              console.log('Sending app info to renderer:', appInfo);
              win.webContents.send('app-info', appInfo);
              console.log('Sending connected status to renderer');
              win.webContents.send('connection-status', 'connected');
            } else {
              console.log('Window not available to send handshake response');
            }
            return;
          }

          // Handle pong message (response to our ping) silently
          if (message.type === 'pong') {
            return; // Exit early for pong messages
          }

          // Forward all other messages to the renderer process
          if (win) {
            // Forward the parsed message directly
            win.webContents.send('ws-message', message);
          }
        } catch (error) {
          console.error('Error processing WebSocket message:', error);
        }
      });

      socket.on('close', () => {
        console.log('Client disconnected from WebSocket server');
        wsClient = null;

        // Notify renderer process
        if (win) {
          win.webContents.send('connection-status', 'disconnected');
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
    win = new BrowserWindow({
      title: 'React Native Debugger',
      width: 1200,
      height: 800,
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

    if (VITE_DEV_SERVER_URL) {
      await win.loadURL(VITE_DEV_SERVER_URL);
    } else {
      await win.loadFile(indexHtml);
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
