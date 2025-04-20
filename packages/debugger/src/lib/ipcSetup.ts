// import { AppInfo } from '@/types/connection';
import {
  ConnectionState,
  EventMessage,
  LibToDebuggerEventType,
  CONNECTION_STATUS,
} from '../../../shared-types/dist';

// Event handlers
export const handlers = {
  connectionStatus: (_event: any, status: ConnectionState) => {
    console.log('[Pulse Debugger] Connection status:', status);
    // Send the connection status to the Electron app
    window.dispatchEvent(new CustomEvent(CONNECTION_STATUS, { detail: status }));
    // Send the connection status to the Lib
  },

  // appInfo: (_event: any, info: AppInfo) => {
  //   console.log('[Pulse Debugger] App info:', info);
  //   // Send the app info to the Lib
  //   window.dispatchEvent(new CustomEvent(APP_INFO, { detail: info }));
  // },

  // error: (_event: any, error: string) => {
  //   console.error('Connection error:', error);
  //   window.dispatchEvent(
  //     new CustomEvent('connection_error', { detail: { status: 'error', error } })
  //   );
  // },

  wsMessage: (_event: any, message: EventMessage<any>) => {
    try {
      console.log('[Pulse Debugger] Received message:', message);

      switch (message.type) {
        case LibToDebuggerEventType.CONSOLE:
          if (message.payload) {
            window.dispatchEvent(
              new CustomEvent(LibToDebuggerEventType.CONSOLE, { detail: message })
            );
          }
          break;

        case LibToDebuggerEventType.REDUX_ACTION:
          if (message) {
            window.dispatchEvent(
              new CustomEvent(LibToDebuggerEventType.REDUX_ACTION, { detail: message })
            );
          }
          break;

        case LibToDebuggerEventType.REDUX_STATE_UPDATE:
          window.dispatchEvent(
            new CustomEvent(LibToDebuggerEventType.REDUX_STATE_UPDATE, { detail: message })
          );
          break;

        case LibToDebuggerEventType.NETWORK_REQUEST:
          if (message) {
            window.dispatchEvent(
              new CustomEvent(LibToDebuggerEventType.NETWORK_REQUEST, { detail: message })
            );
          }
          break;

        default:
          console.log('[Pulse Debugger] Unhandled message type:', message.type);
      }
    } catch (error) {
      console.error('Error handling WebSocket message:', error);
    }
  },
};
