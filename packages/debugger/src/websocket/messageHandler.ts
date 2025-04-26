import {
  AppInfoMessage,
  ConsoleMessage,
  HandshakeAcknowledgeMessage,
  HandshakeMessage,
  MessageType,
  NetworkEventMessage,
  ReduxEventMessage,
  WebSocketMessage,
} from '@pulse/shared-types';
import { sessionManager } from './sessionManager';
import { WebSocket } from 'ws';
import { dispatch } from '@/store';

/**
 * MessageHandler class to process incoming WebSocket messages from Pulse clients.
 */
export class MessageHandler {
  /**
   * Handle an incoming WebSocket message.
   * @param ws The WebSocket instance of the client.
   * @param message The raw message data.
   */
  public handleMessage(ws: WebSocket, message: unknown): void {
    try {
      const webSocketMessage = message as WebSocketMessage;
      if (!webSocketMessage.type || !webSocketMessage.timestamp) {
        throw new Error('Invalid message: missing type or timestamp');
      }

      console.log('Received message:', webSocketMessage.type);

      // Dispatch based on message type
      switch (webSocketMessage.type) {
        case MessageType.Handshake:
          this.handleHandshake(ws, webSocketMessage as HandshakeMessage);
          break;
        case MessageType.AppInfo:
          this.handleAppInfo(ws, webSocketMessage as AppInfoMessage);
          break;
        case MessageType.Console:
          this.handleConsole(webSocketMessage as ConsoleMessage);
          break;
        case MessageType.NetworkEvent:
          this.handleNetworkEvent(webSocketMessage as NetworkEventMessage);
          break;
        case MessageType.ReduxEvent:
          this.handleReduxEvent(webSocketMessage as ReduxEventMessage);
          break;
        default:
          console.warn('Unknown message type:', webSocketMessage?.type);
      }
    } catch (error) {
      console.error('Error processing message:', error);
    }
  }

  private handleHandshake(ws: WebSocket, message: HandshakeMessage): void {
    if (!message.deviceId || !message.platform) {
      const acknowledgment: HandshakeAcknowledgeMessage = {
        type: MessageType.HandshakeAcknowledge,
        timestamp: new Date().toISOString(),
        status: 'rejected',
        reason: 'Missing deviceId or platform',
      };
      ws.send(JSON.stringify(acknowledgment));
      return;
    }

    sessionManager.handleConnect(ws, message.deviceId, message.platform);

    const acknowledgment: HandshakeAcknowledgeMessage = {
      type: MessageType.HandshakeAcknowledge,
      timestamp: new Date().toISOString(),
      status: 'connected',
    };
    ws.send(JSON.stringify(acknowledgment));
  }

  private handleAppInfo(ws: WebSocket, message: AppInfoMessage): void {
    if (!message?.data || !message?.data?.appName || !message?.data?.platform) {
      console.error('Invalid AppInfoMessage: missing required fields');
      return;
    }

    sessionManager.updateAppMetadata(ws, message.data);
    dispatch({ type: 'UPDATE_APP_INFO', payload: message.data });
  }

  private handleConsole(message: ConsoleMessage): void {
    if (!message.level || !message.message) {
      console.error('Invalid ConsoleMessage: missing required fields');
      return;
    }

    dispatch({ type: 'ADD_CONSOLE', payload: message });
  }

  private handleNetworkEvent(message: NetworkEventMessage): void {
    if (!message.method || !message.url || !message.status) {
      console.error('Invalid NetworkEventMessage: missing required fields');
      return;
    }

    dispatch({ type: 'ADD_NETWORK_EVENT', payload: message });
  }

  private handleReduxEvent(message: ReduxEventMessage): void {
    if (!message.action || !message.action.type) {
      console.error('Invalid ReduxEventMessage: missing required fields');
      return;
    }

    dispatch({ type: 'ADD_REDUX_EVENT', payload: message });
  }
}

export const messageHandler = new MessageHandler();
