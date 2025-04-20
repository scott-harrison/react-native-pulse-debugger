import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useReduxStore } from '../store/reduxStore';
import { CONNECTION_STATUS, type ConnectionState } from '@pulse/shared-types';

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

interface AppInfo {
  name: string;
  platform: string;
  version: string;
}

interface ConnectionContextState {
  status: ConnectionState;
  appInfo: AppInfo | null;
  error: string | null;
}

const defaultConnectionState: ConnectionContextState = {
  status: 'disconnected',
  appInfo: null,
  error: null,
};

interface ConnectionContextType {
  connectionState: ConnectionContextState;
  sendMessage: (message: any) => void;
}

const ConnectionContext = createContext<ConnectionContextType | null>(null);

interface ConnectionProviderProps {
  children: ReactNode;
}

export function ConnectionProvider({ children }: ConnectionProviderProps): React.ReactElement {
  const [connectionState, setConnectionState] =
    useState<ConnectionContextState>(defaultConnectionState);
  const { setState } = useReduxStore();

  useEffect(() => {
    const handleConnectionStatus = (event: CustomEvent<ConnectionState>) => {
      console.log('Connection status:', event.detail);
      setConnectionState(prev => ({
        ...prev,
        status: event.detail,
      }));
    };

    // const handleAppInfo = (event: CustomEvent<AppInfo>) => {
    //   setConnectionState(prev => ({
    //     ...prev,
    //     appInfo: event.detail,
    //   }));
    // };

    // const handleError = (event: CustomEvent<{ status: string; error: string }>) => {
    //   setConnectionState(prev => ({
    //     ...prev,
    //     status: event.detail.status as ConnectionState,
    //     error: event.detail.error,
    //   }));
    // };

    // Add event listeners
    window.addEventListener(CONNECTION_STATUS, handleConnectionStatus as EventListener);
    // window.addEventListener('app_info', handleAppInfo as EventListener);

    return () => {
      // Remove event listeners
      window.removeEventListener(CONNECTION_STATUS, handleConnectionStatus as EventListener);
      // window.removeEventListener('app_info', handleAppInfo as EventListener);
    };
  }, [setState]);

  const sendMessage = (message: any) => {
    if (connectionState.status === 'connected') {
      window.electron.ipcRenderer.send('ws-message', JSON.stringify(message));
    } else {
      console.warn('Cannot send message: not connected');
    }
  };

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
