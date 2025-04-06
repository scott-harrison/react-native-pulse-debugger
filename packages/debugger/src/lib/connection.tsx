import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  useRef,
  useCallback,
} from 'react';
import { useReduxStore, ReduxAction } from '../store/reduxStore';

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

interface ConnectionState {
  status: ConnectionStatus;
  appInfo: {
    name: string;
    platform: string;
    version: string;
  } | null;
  error: string | null;
  lastHeartbeat: number | null;
  connectedAt: string | null;
}

const defaultConnectionState: ConnectionState = {
  status: 'disconnected',
  appInfo: null,
  error: null,
  lastHeartbeat: null,
  connectedAt: null,
};

// Heartbeat timeout in milliseconds (5 seconds)
const HEARTBEAT_TIMEOUT = 5000;

interface ConnectionContextType {
  connectionState: ConnectionState;
  sendMessage: (message: any) => void;
}

const ConnectionContext = createContext<ConnectionContextType | null>(null);

interface ConnectionProviderProps {
  children: ReactNode;
}

export function ConnectionProvider({ children }: ConnectionProviderProps): React.ReactElement {
  const [connectionState, setConnectionState] = useState<ConnectionState>(defaultConnectionState);
  const { setState, addAction } = useReduxStore();
  const heartbeatTimerRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const connectionTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Track the last processed action to prevent duplicates
  const lastProcessedActionRef = useRef<{
    type: string;
    timestamp: number;
    payload: any;
  } | null>(null);

  // Function to check if the connection is still alive based on the last heartbeat
  const checkHeartbeat = useCallback(() => {
    if (
      connectionState.status === 'connected' &&
      connectionState.lastHeartbeat &&
      Date.now() - connectionState.lastHeartbeat > HEARTBEAT_TIMEOUT
    ) {
      console.log('Heartbeat timeout, marking as disconnected');
      setConnectionState(prev => ({ ...prev, status: 'disconnected' }));
    }
  }, [connectionState.status, connectionState.lastHeartbeat]);

  // Function to request reconnection
  const requestReconnection = useCallback(() => {
    if (connectionState.status === 'disconnected') {
      console.log('Requesting reconnection');
      window.electron.ipcRenderer.send('request-reconnection');
    }
  }, [connectionState.status]);

  useEffect(() => {
    // Listen for connection status updates from the main process
    const handleConnectionStatus = (_event: any, status: ConnectionStatus) => {
      console.log('Connection status update:', status);
      setConnectionState(prev => ({
        ...prev,
        status,
        connectedAt: status === 'connected' ? new Date().toISOString() : prev.connectedAt,
      }));
    };

    // Listen for app info updates from the main process
    const handleAppInfo = (_event: any, appInfo: any) => {
      console.log('App info update:', appInfo);
      setConnectionState(prev => ({
        ...prev,
        appInfo,
      }));
    };

    // Listen for connection errors from the main process
    const handleError = (_event: any, error: string) => {
      console.error('Connection error:', error);
      setConnectionState(prev => ({
        ...prev,
        status: 'error',
        error,
      }));
    };

    // Listen for heartbeat messages from the main process
    const handleHeartbeat = (_event: any, timestamp: number) => {
      console.log('Heartbeat received:', new Date(timestamp).toISOString());
      setConnectionState(prev => ({
        ...prev,
        lastHeartbeat: timestamp,
      }));
    };

    // Handle Redux state updates
    const handleReduxState = (_event: any, state: any) => {
      console.log('Received Redux state update:', state ? 'State received' : 'No state');
      if (state) {
        setState(state);
      } else {
        console.warn('Received empty Redux state');
      }
    };

    // Handle WebSocket messages
    const handleWsMessage = (_event: any, message: any) => {
      try {
        // Handle Redux state update message
        if (message.type === 'redux-state' && message.payload?.state) {
          console.log('Received Redux state update');
          setState(message.payload.state);
          return;
        }

        // Handle Redux messages from the WebSocket
        if (message.type === 'redux') {
          console.log('Processing Redux message from WebSocket:', message);

          // Check if the action is directly in the message or nested in the payload
          const actionData = message.action || (message.payload && message.payload.action);
          const stateData = message.state || (message.payload && message.payload.state);

          if (actionData) {
            let actionType = '';
            let actionPayload = null;

            if (typeof actionData === 'string') {
              actionType = actionData;
              actionPayload = message.payload || null;
            } else if (actionData && typeof actionData === 'object') {
              actionType = actionData.type || 'UNKNOWN_ACTION';
              actionPayload = actionData.payload || null;
            } else {
              console.warn('Invalid Redux action format in renderer:', actionData);
              return;
            }

            const actionTimestamp = message.timestamp || actionData.timestamp || Date.now();

            // Check if this is a duplicate action
            const lastAction = lastProcessedActionRef.current;
            if (
              lastAction &&
              lastAction.type === actionType &&
              lastAction.timestamp === actionTimestamp &&
              JSON.stringify(lastAction.payload) === JSON.stringify(actionPayload)
            ) {
              console.log('Skipping duplicate action:', actionType);
              return;
            }

            // Update the last processed action
            lastProcessedActionRef.current = {
              type: actionType,
              timestamp: actionTimestamp,
              payload: actionPayload,
            };

            // Capture the current state before updating
            const currentState = useReduxStore.getState().state;

            // Create the action with state diff
            const action: ReduxAction = {
              type: actionType,
              payload: actionPayload,
              timestamp: actionTimestamp,
              stateDiff: stateData
                ? {
                    before: currentState || {},
                    after: stateData,
                  }
                : undefined,
            };

            // Add the action to the store
            addAction(action);

            // Update state if provided
            if (stateData) {
              console.log('Updating Redux state from action');
              setState(stateData);
            }
          } else {
            console.warn('Redux message missing action property:', message);
          }
        }
      } catch (error) {
        console.error('Error handling WebSocket message:', error);
      }
    };

    console.log('Setting up IPC event listeners');
    // Register event listeners
    window.electron.ipcRenderer.on('connection-status', handleConnectionStatus);
    window.electron.ipcRenderer.on('app-info', handleAppInfo);
    window.electron.ipcRenderer.on('connection-error', handleError);
    window.electron.ipcRenderer.on('heartbeat', handleHeartbeat);
    window.electron.ipcRenderer.on('redux-state', handleReduxState);
    window.electron.ipcRenderer.on('ws-message', handleWsMessage);

    // Set up heartbeat check interval
    heartbeatTimerRef.current = setInterval(checkHeartbeat, 1000);

    // Set up reconnection timer
    reconnectTimeoutRef.current = setInterval(() => {
      if (connectionState.status === 'disconnected') {
        // Only request reconnection if we're not already in the process of connecting
        console.log('Connection is disconnected, requesting reconnection');
        requestReconnection();
      }
    }, 5000);

    // Clean up event listeners
    return () => {
      console.log('Cleaning up IPC event listeners');
      window.electron.ipcRenderer.removeListener('connection-status', handleConnectionStatus);
      window.electron.ipcRenderer.removeListener('app-info', handleAppInfo);
      window.electron.ipcRenderer.removeListener('connection-error', handleError);
      window.electron.ipcRenderer.removeListener('heartbeat', handleHeartbeat);
      window.electron.ipcRenderer.removeListener('redux-state', handleReduxState);
      window.electron.ipcRenderer.removeListener('ws-message', handleWsMessage);

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
  }, [checkHeartbeat, requestReconnection, setState, addAction]);

  const sendMessage = useCallback(
    (message: any) => {
      if (connectionState.status === 'connected') {
        window.dispatchEvent(new CustomEvent('send_message', { detail: message }));
      }
    },
    [connectionState.status]
  );

  return (
    <ConnectionContext.Provider value={{ connectionState, sendMessage }}>
      {children}
    </ConnectionContext.Provider>
  );
}

export function useConnection() {
  const context = useContext(ConnectionContext);
  if (!context) {
    throw new Error('useConnection must be used within a ConnectionProvider');
  }
  return context;
}
