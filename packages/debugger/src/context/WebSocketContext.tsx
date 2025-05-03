import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { StoreApi } from 'zustand';
import {
  AppInfoMessage,
  ConsoleLogMessage,
  HandshakeAcknowledgeMessage,
  HandshakeMessage,
  MessageType,
  NetworkEventMessage,
  ReduxEventMessage,
  WebSocketMessage,
} from '@pulse/shared-types';
import { ConsoleState, registerConsoleDispatch } from '@/store/consoleStore';
import { registerNetworkDispatch, useNetworkStore } from '@/store/networkStore';
import { useReduxStore } from '@/store';

// Define global electron interface
declare global {
  interface Window {
    electron: {
      ipcRenderer: {
        send: (channel: string, ...args: any[]) => void;
        on: (channel: string, listener: (event: any, ...args: any[]) => void) => void;
        removeListener: (channel: string, listener: (event: any, ...args: any[]) => void) => void;
      };
    };
  }
}

export interface WebSocketState {
  isConnected: boolean;
  error: string | null;
}

interface WebSocketContextType {
  state: WebSocketState;
  reconnect: () => void;
}

const WebSocketContext = createContext<WebSocketContextType | undefined>(undefined);

// Define a type for message handlers that maps each MessageType to its specific handler
type MessageHandlerMap = {
  [MessageType.Handshake]: (message: HandshakeMessage) => void;
  [MessageType.HandshakeAcknowledge]: (message: HandshakeAcknowledgeMessage) => void;
  [MessageType.AppInfo]: (message: AppInfoMessage) => void;
  [MessageType.Console]: (message: ConsoleLogMessage) => void;
  [MessageType.NetworkEvent]: (message: NetworkEventMessage) => void;
  [MessageType.ReduxEvent]: (message: ReduxEventMessage) => void;
};

export const WebSocketProvider: React.FC<{
  consoleStore: StoreApi<ConsoleState>;
  children: React.ReactNode;
}> = ({ consoleStore, children }) => {
  const initialized = useRef(false);
  const [state, setState] = useState<WebSocketState>({ isConnected: false, error: null });
  const [reconnectTrigger, setReconnectTrigger] = useState(0);

  const { addRequest, updateRequest } = useNetworkStore();
  const { addReduxAction } = useReduxStore();

  // Store listener functions in refs to keep them stable across renders
  const wsMessageListenerRef = useRef<(event: any, message: WebSocketMessage) => void>(null);
  const connectionStatusListenerRef = useRef<(event: any, status: string) => void>(null);
  const connectionErrorListenerRef = useRef<(event: any, errorMessage: string) => void>(null);

  // Register IPC listeners only once on mount
  useEffect(() => {
    if (initialized.current) {
      return;
    }
    initialized.current = true;
    // Define listener functions
    const handleWSMessage = (_: any, message: WebSocketMessage) => {
      console.log('Renderer received WebSocket message via IPC:', message);
      try {
        if (!Object.values(MessageType).includes(message.type)) {
          throw new Error(`Invalid message type: ${message.type}`);
        }
        // Use a switch statement to narrow the type of message and call the appropriate handler
        switch (message.type) {
          case MessageType.Console: {
            const handler = messageHandlers[MessageType.Console];
            if (handler) handler(message as ConsoleLogMessage);
            break;
          }
          case MessageType.NetworkEvent: {
            const handler = messageHandlers[MessageType.NetworkEvent];
            if (handler) handler(message as NetworkEventMessage);
            break;
          }
          case MessageType.Handshake: {
            const handler = messageHandlers[MessageType.Handshake];
            if (handler) handler(message as HandshakeMessage);
            break;
          }
          case MessageType.HandshakeAcknowledge: {
            const handler = messageHandlers[MessageType.HandshakeAcknowledge];
            if (handler) handler(message as HandshakeAcknowledgeMessage);
            break;
          }
          case MessageType.AppInfo: {
            const handler = messageHandlers[MessageType.AppInfo];
            if (handler) handler(message as AppInfoMessage);
            break;
          }
          case MessageType.ReduxEvent: {
            const handler = messageHandlers[MessageType.ReduxEvent];
            if (handler) handler(message as ReduxEventMessage);
            break;
          }
          default:
            console.warn(`No handler for message type: ${message.type}`);
        }
      } catch (error: any) {
        console.error('Failed to process WebSocket message:', error, message);
        setState(prev => ({
          ...prev,
          error: error.message || 'Failed to process WebSocket message',
        }));
      }
    };

    const handleConnectionStatus = (_: any, status: string) => {
      console.log('Received connection status:', status);
      setState(prev => ({
        ...prev,
        isConnected: status === 'connected',
        error:
          status === 'error'
            ? 'Connection error'
            : status === 'disconnected'
              ? 'Disconnected'
              : null,
      }));
    };

    const handleConnectionError = (_: any, errorMessage: string) => {
      console.error('Received connection error:', errorMessage);
      setState(prev => ({
        ...prev,
        isConnected: false,
        error: errorMessage,
      }));
    };

    // Assign to refs to keep references stable
    wsMessageListenerRef.current = handleWSMessage;
    connectionStatusListenerRef.current = handleConnectionStatus;
    connectionErrorListenerRef.current = handleConnectionError;

    // Register listeners
    console.log('Registering IPC listeners in WebSocketContext');
    window.electron.ipcRenderer.on('ws-message', wsMessageListenerRef.current);
    window.electron.ipcRenderer.on('connection-status', connectionStatusListenerRef.current);
    window.electron.ipcRenderer.on('connection-error', connectionErrorListenerRef.current);

    // Cleanup on unmount
    return () => {
      console.log('Cleaning up IPC listeners in WebSocketContext');
      if (wsMessageListenerRef.current) {
        window.electron.ipcRenderer.removeListener('ws-message', wsMessageListenerRef.current);
      }
      if (connectionStatusListenerRef.current) {
        window.electron.ipcRenderer.removeListener(
          'connection-status',
          connectionStatusListenerRef.current
        );
      }
      if (connectionErrorListenerRef.current) {
        window.electron.ipcRenderer.removeListener(
          'connection-error',
          connectionErrorListenerRef.current
        );
      }
    };
  }, []); // Empty dependency array: run once on mount

  // Message handlers for each MessageType
  const messageHandlers: Partial<MessageHandlerMap> = {
    [MessageType.Console]: message => {
      console.log('Handling console message:', message);

      registerConsoleDispatch(consoleStore.setState)({
        type: message.type,
        payload: message.payload,
      });
    },
    [MessageType.NetworkEvent]: message => {
      console.log('Received network event:', message);

      registerNetworkDispatch(addRequest, updateRequest)(message.payload);
    },
    [MessageType.ReduxEvent]: message => {
      addReduxAction(message);
    },
  };

  // Handle reconnect separately
  useEffect(() => {
    if (reconnectTrigger > 0) {
      console.log('Triggering reconnect via main process');
      window.electron.ipcRenderer.send('reconnect-websocket');
    }
  }, [reconnectTrigger]);

  const reconnect = () => {
    console.log('Triggering manual reconnect');
    setReconnectTrigger(prev => prev + 1);
  };

  return (
    <WebSocketContext.Provider value={{ state, reconnect }}>{children}</WebSocketContext.Provider>
  );
};

export const useWebSocket = () => {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error('useWebSocket must be used within a WebSocketProvider');
  }
  return context;
};
