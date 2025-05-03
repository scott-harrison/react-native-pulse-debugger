import { app, BrowserWindow, shell, ipcMain, screen } from 'electron';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import os from 'node:os';
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
// │   └── index.js    > Preload-Scripts
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
let wsClients: WebSocket[] = [];
const WS_PORT = 8973;

function startWebSocketServer() {
  if (wsServer) {
    console.log('WebSocket server already running on port', WS_PORT);
    return;
  }

  try {
    wsServer = new WebSocketServer({ port: WS_PORT });
    console.log(`WebSocket server successfully started on ws://localhost:${WS_PORT}`);

    wsServer.on('connection', socket => {
      wsClients.push(socket);

      // Immediately notify renderer of connection
      if (win) {
        console.log('Notifying renderer of WebSocket connection');
        win.webContents.send('connection-status', 'connected');
      }

      socket.on('message', data => {
        try {
          const message = JSON.parse(data.toString());
          if (!message || typeof message !== 'object') {
            console.warn('Received invalid message format:', data.toString());
            return;
          }

          if (message.type === 'handshake') {
            if (win) {
              console.log('Received handshake, sending connected status to renderer');
              win.webContents.send('connection-status', 'connected');
            }
            return;
          }

          // Forward the WebSocket message to the renderer
          if (win) {
            console.log('Sending WebSocket message to renderer:', message);
            win.webContents.send('ws-message', message);
          } else {
            console.warn('Cannot send WebSocket message: No renderer window available');
          }
        } catch (error) {
          console.error('Error processing WebSocket message:', error);
        }
      });

      socket.on('close', (code, reason) => {
        console.log('Client disconnected from WebSocket server:', {
          code,
          reason: reason.toString(),
        });
        wsClients = wsClients.filter(client => client !== socket);
        if (wsClients.length === 0 && win) {
          console.log('No WebSocket clients connected, notifying renderer');
          win.webContents.send('connection-status', 'disconnected');
        }
      });

      socket.on('error', error => {
        console.error('WebSocket client error:', error);
        if (win) {
          win.webContents.send('connection-error', error.message || 'Connection error');
          win.webContents.send('connection-status', 'error');
        }
      });
    });

    wsServer.on('error', error => {
      console.error('WebSocket server error:', error);
      if (win) {
        win.webContents.send('connection-error', error.message || 'Server error');
        win.webContents.send('connection-status', 'error');
      }
    });

    wsServer.on('listening', () => {
      console.log(`WebSocket server is listening on ws://localhost:${WS_PORT}`);
    });
  } catch (error) {
    console.error('Failed to start WebSocket server:', error);
    if (win) {
      win.webContents.send('connection-error', error.message || 'Failed to start server');
      win.webContents.send('connection-status', 'error');
    }
  }
}

function stopWebSocketServer() {
  if (wsServer) {
    console.log('Stopping WebSocket server');
    wsServer.close(error => {
      if (error) {
        console.error('Error closing WebSocket server:', error);
        if (win) {
          win.webContents.send('connection-error', error.message || 'Failed to close server');
          win.webContents.send('connection-status', 'error');
        }
      }
    });
    wsClients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.close(1000, 'Server shutdown');
      }
    });
    wsServer = null;
    wsClients = [];
    if (win) {
      win.webContents.send('connection-status', 'disconnected');
    }
  }
}

async function createWindow() {
  try {
    const windowState = store.get('windowState') as {
      width: number;
      height: number;
    };

    win = new BrowserWindow({
      title: 'Pulse Debugger',
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

    // Log when the window is ready to receive messages
    win!.on('ready-to-show', () => {
      console.log('Window is ready to show');
      win!.show();
    });
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
  wsClients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(message));
    }
  });
});

// Handle WebSocket messages from renderer
ipcMain.on('ws-message', (_, message) => {
  wsClients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(message));
    }
  });
});

// Handle WebSocket reconnect
ipcMain.on('reconnect-websocket', () => {
  console.log('Received reconnect-websocket request');
  stopWebSocketServer();
  startWebSocketServer();
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
