import { contextBridge, ipcRenderer } from 'electron';

console.log('Setting up electron bridge in preload script');

// Expose protected IPC methods to the renderer process
contextBridge.exposeInMainWorld('electron', {
  ipcRenderer: {
    send: (channel: string, ...args: any[]) => {
      // Whitelist allowed channels
      const validChannels = ['send-message', 'ws-message', 'reconnect-websocket'];
      if (validChannels.includes(channel)) {
        console.log('Sending IPC message on channel:', channel, 'Args:', args);
        ipcRenderer.send(channel, ...args);
      } else {
        console.warn(`IPC send blocked: Invalid channel ${channel}`);
      }
    },
    on: (channel: string, listener: (event: any, ...args: any[]) => void) => {
      // Whitelist allowed channels
      const validChannels = [
        'ws-message',
        'connection-status',
        'connection-error',
        'CONNECTION_STATUS',
      ];
      if (validChannels.includes(channel)) {
        console.log('Registering IPC listener for channel:', channel);
        ipcRenderer.on(channel, listener);
      } else {
        console.warn(`IPC on blocked: Invalid channel ${channel}`);
      }
    },
    removeListener: (channel: string, listener: (event: any, ...args: any[]) => void) => {
      const validChannels = [
        'ws-message',
        'connection-status',
        'connection-error',
        'CONNECTION_STATUS',
      ];
      if (validChannels.includes(channel)) {
        console.log('Removing IPC listener for channel:', channel);
        ipcRenderer.removeListener(channel, listener);
      } else {
        console.warn(`IPC removeListener blocked: Invalid channel ${channel}`);
      }
    },
  },
});
