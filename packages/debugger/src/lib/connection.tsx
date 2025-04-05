import React, { createContext, useContext, useState, useEffect, ReactNode, useRef } from 'react';

// Add type declaration for Electron IPC renderer
declare global {
  interface Window {
    electron: {
      ipcRenderer: {
        on: (channel: string, func: (...args: any[]) => void) => void;
        removeListener: (channel: string, func: (...args: any[]) => void) => void;
        send: (channel: string, ...args: any[]) => void;
      };
    };
  }
}

export type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'error';

export interface ConnectionState {
  status: ConnectionStatus;
  appInfo: {
    name: string;
    platform: string;
    version: string;
  } | null;
  error: string | null;
  connectedAt: string | null;
  lastHeartbeat: number | null;
}

interface ConnectionContextType {
  connectionState: ConnectionState;
  sendMessage: (type: string, payload: unknown) => void;
}

const defaultConnectionState: ConnectionState = {
  status: 'disconnected',
  appInfo: null,
  error: null,
  connectedAt: null,
  lastHeartbeat: null,
};

const ConnectionContext = createContext<ConnectionContextType>({
  connectionState: defaultConnectionState,
  sendMessage: () => {},
});

export const useConnection = () => useContext(ConnectionContext);

interface ConnectionProviderProps {
  children: ReactNode;
}

// Heartbeat timeout in milliseconds (5 seconds)
const HEARTBEAT_TIMEOUT = 5000;

export function ConnectionProvider({ children }: ConnectionProviderProps): React.ReactElement {
  const [connectionState, setConnectionState] = useState<ConnectionState>(defaultConnectionState);
  const heartbeatTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastHeartbeatRef = useRef<number | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const connectionTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Function to check if we've received a heartbeat recently
  const checkHeartbeat = () => {
    const now = Date.now();
    const lastHeartbeat = lastHeartbeatRef.current;

    if (lastHeartbeat && now - lastHeartbeat > HEARTBEAT_TIMEOUT) {
      // Only update the state if we're currently connected
      setConnectionState(prev => {
        if (prev.status === 'connected') {
          console.log('No heartbeat received for too long, marking as disconnected');
          return {
            ...prev,
            status: 'disconnected',
            error: 'Connection lost - no response from app',
            // Don't clear connectedAt to maintain the connection time
            // Don't clear appInfo to maintain the app information
            lastHeartbeat: null,
          };
        }
        return prev;
      });
    }
  };

  // Function to request reconnection from the main process
  const requestReconnection = () => {
    console.log('Requesting reconnection from main process');
    window.electron.ipcRenderer.send('request-reconnection');
  };

  useEffect(() => {
    // Listen for connection status updates from the main process
    const handleConnectionStatus = (_event: any, status: ConnectionStatus) => {
      console.log('Renderer received connection status:', status);

      // Clear any existing connection timeout
      if (connectionTimeoutRef.current) {
        clearTimeout(connectionTimeoutRef.current);
        connectionTimeoutRef.current = null;
      }

      setConnectionState(prev => {
        if (status === 'connected' && prev.status !== 'connected') {
          return {
            ...prev,
            status,
            connectedAt: new Date().toLocaleTimeString('en-US', {
              hour: 'numeric',
              minute: '2-digit',
              hour12: true,
            }),
            lastHeartbeat: Date.now(),
          };
        }
        if (status !== 'connected') {
          // When disconnected, keep the appInfo and connectedAt
          return {
            ...prev,
            status,
            // Don't clear connectedAt to maintain the connection time
            // Don't clear appInfo to maintain the app information
            lastHeartbeat: null,
          };
        }
        return { ...prev, status };
      });
    };

    // Listen for app info updates from the main process
    const handleAppInfo = (
      _event: any,
      appInfo: ConnectionState['appInfo'] & { timestamp?: number }
    ) => {
      console.log('Renderer received app info:', appInfo);
      setConnectionState(prev => {
        // Use the timestamp from the app info if available, otherwise use current time
        const timestamp = appInfo.timestamp ? new Date(appInfo.timestamp) : new Date();
        const connectedAt = timestamp.toLocaleTimeString('en-US', {
          hour: 'numeric',
          minute: '2-digit',
          hour12: true,
        });

        return {
          ...prev,
          appInfo: {
            name: appInfo.name,
            platform: appInfo.platform,
            version: appInfo.version,
          },
          status: 'connected',
          connectedAt,
          lastHeartbeat: Date.now(),
        };
      });
    };

    // Listen for error updates from the main process
    const handleError = (_event: any, error: string) => {
      console.log('Renderer received error:', error);
      setConnectionState(prev => ({
        ...prev,
        error,
        status: 'error',
        connectedAt: null,
        lastHeartbeat: null,
      }));
    };

    // Listen for heartbeat messages from the main process
    const handleHeartbeat = (_event: any) => {
      // Update the last heartbeat time without changing the connection status
      const now = Date.now();
      lastHeartbeatRef.current = now;

      // Only update the state if we're already connected and it's been a while since the last update
      // This prevents UI flickering and reduces unnecessary state updates
      setConnectionState(prev => {
        if (
          prev.status === 'connected' &&
          (!prev.lastHeartbeat || now - prev.lastHeartbeat > 1000)
        ) {
          return {
            ...prev,
            lastHeartbeat: now,
          };
        }
        return prev;
      });
    };

    console.log('Setting up IPC event listeners');
    // Register event listeners
    window.electron.ipcRenderer.on('connection-status', handleConnectionStatus);
    window.electron.ipcRenderer.on('app-info', handleAppInfo);
    window.electron.ipcRenderer.on('connection-error', handleError);
    window.electron.ipcRenderer.on('heartbeat', handleHeartbeat);

    // Set up heartbeat check interval
    heartbeatTimerRef.current = setInterval(checkHeartbeat, 1000);

    // Set up reconnection timer
    reconnectTimeoutRef.current = setInterval(() => {
      if (connectionState.status === 'disconnected') {
        // Only request reconnection if we're not already in the process of connecting
        requestReconnection();
      }
    }, 5000); // Try to reconnect every 5 seconds if disconnected

    // Clean up event listeners
    return () => {
      console.log('Cleaning up IPC event listeners');
      window.electron.ipcRenderer.removeListener('connection-status', handleConnectionStatus);
      window.electron.ipcRenderer.removeListener('app-info', handleAppInfo);
      window.electron.ipcRenderer.removeListener('connection-error', handleError);
      window.electron.ipcRenderer.removeListener('heartbeat', handleHeartbeat);

      if (heartbeatTimerRef.current) {
        clearInterval(heartbeatTimerRef.current);
      }

      if (reconnectTimeoutRef.current) {
        clearInterval(reconnectTimeoutRef.current);
      }

      if (connectionTimeoutRef.current) {
        clearTimeout(connectionTimeoutRef.current);
      }
    };
  }, [connectionState.status]);

  const sendMessage = (type: string, payload: unknown) => {
    if (connectionState.status === 'connected') {
      const message = {
        type,
        payload,
        timestamp: Date.now(),
      };

      // Send message to the main process
      window.electron.ipcRenderer.send('send-message', message);
    }
  };

  const value = { connectionState, sendMessage };

  return <ConnectionContext.Provider value={value}>{children}</ConnectionContext.Provider>;
}
