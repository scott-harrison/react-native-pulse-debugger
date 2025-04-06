import { useState, useEffect, useCallback } from 'react';

type ConnectionStatus = 'connected' | 'disconnected' | 'connecting';

interface ConnectionHook {
  connectionState: ConnectionStatus;
  sendMessage: (message: any) => void;
}

export function useConnection(): ConnectionHook {
  const [connectionState, setConnectionState] = useState<ConnectionStatus>('disconnected');

  useEffect(() => {
    const handleConnectionChange = (e: CustomEvent) => {
      setConnectionState(e.detail);
    };

    window.addEventListener('connection_state_change', handleConnectionChange as EventListener);

    return () => {
      window.removeEventListener(
        'connection_state_change',
        handleConnectionChange as EventListener
      );
    };
  }, []);

  const sendMessage = useCallback((message: any) => {
    // Dispatch a custom event that will be handled by the WebSocket connection manager
    window.dispatchEvent(new CustomEvent('send_message', { detail: message }));
  }, []);

  return {
    connectionState,
    sendMessage,
  };
}
