import React, { createContext, useContext, useEffect, useState } from 'react';
import { dispatch } from '@/store';
import { MessageType, WebSocketMessage } from '@pulse/shared-types';

interface WebSocketState {
  isConnected: boolean;
  error: string | null;
}

interface WebSocketContextType {
  state: WebSocketState;
  reconnect: () => void;
}

const WebSocketContext = createContext<WebSocketContextType | undefined>(undefined);

export const WebSocketProvider: React.FC<{ wsUrl: string; children: React.ReactNode }> = ({
  wsUrl,
  children,
}) => {
  const [state, setState] = useState<WebSocketState>({ isConnected: false, error: null });
  const [reconnectTrigger, setReconnectTrigger] = useState(0);

  useEffect(() => {
    let ws: WebSocket;

    const connect = () => {
      try {
        ws = new WebSocket(wsUrl);

        ws.onopen = () => {
          console.log('WebSocket connected');
          setState({ isConnected: true, error: null });
        };

        ws.onmessage = (event: MessageEvent) => {
          try {
            const message: WebSocketMessage = JSON.parse(event.data);
            // Validate message type
            if (!Object.values(MessageType).includes(message.type)) {
              throw new Error(`Invalid message type: ${message.type}`);
            }
            dispatch({ type: message.type, payload: message });
          } catch (error: any) {
            console.error('Failed to parse WebSocket message:', error);
            setState(prev => ({
              ...prev,
              error: error.message || 'Failed to parse WebSocket message',
            }));
          }
        };

        ws.onerror = (errorEvent: Event) => {
          try {
            console.error('WebSocket error:', errorEvent);
            setState({ isConnected: false, error: 'WebSocket connection error' });
          } catch (handlerError: any) {
            console.error('Error in WebSocket error handler:', handlerError);
            setState(prev => ({
              ...prev,
              error: handlerError.message || 'Unexpected error in WebSocket error handler',
            }));
          }
        };

        ws.onclose = () => {
          try {
            console.log('WebSocket disconnected, attempting to reconnect...');
            setState({ isConnected: false, error: 'WebSocket connection error' });
            setTimeout(connect, 5000);
          } catch (handlerError: any) {
            console.error('Error in WebSocket close handler:', handlerError);
            setState(prev => ({
              ...prev,
              error: handlerError.message || 'Unexpected error in WebSocket close handler',
            }));
          }
        };
      } catch (initError: any) {
        console.error('Error initializing WebSocket:', initError);
        setState({
          isConnected: false,
          error: initError.message || 'Failed to initialize WebSocket',
        });
      }
    };

    connect();

    return () => {
      if (ws) {
        try {
          ws.close();
        } catch (closeError: any) {
          console.error('Error closing WebSocket:', closeError);
          setState(prev => ({
            ...prev,
            error: closeError.message || 'Failed to close WebSocket',
          }));
        }
      }
    };
  }, [wsUrl, reconnectTrigger]);

  const reconnect = () => {
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
