import { app, BrowserWindow, shell, ipcMain, screen } from 'electron';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import os from 'node:os';
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
