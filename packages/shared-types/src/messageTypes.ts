import { AppMetadata, Platform } from './commonTypes';

// Enum for all WebSocket message types
enum MessageType {
  Handshake = 'handshake',
  HandshakeAcknowledge = 'handshake_acknowledge',
  AppInfo = 'app_info',
  Console = 'console',
  NetworkEvent = 'network_event',
  ReduxEvent = 'redux_event',
}

interface BaseMessage {
  type: MessageType;
  timestamp: string; // ISO 8601 format, e.g., "2025-04-23T12:00:00Z"
}

interface HandshakeMessage extends BaseMessage {
  type: MessageType.Handshake;
  deviceId: string; // Unique identifier for the device
  platform: Platform;
}

interface HandshakeAcknowledgeMessage extends BaseMessage {
  type: MessageType.HandshakeAcknowledge;
  status: 'connected' | 'rejected';
  reason?: string; // Optional reason for rejection
}

interface AppInfoMessage extends BaseMessage {
  type: MessageType.AppInfo;
  data: AppMetadata;
}

interface ConsoleLogMessage extends BaseMessage {
  type: MessageType.Console;
  level: 'log' | 'info' | 'warn' | 'error' | 'debug';
  message: string;
  args?: any[]; // Optional additional arguments
}

interface NetworkEventMessage extends BaseMessage {
  type: MessageType.NetworkEvent;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'OPTIONS' | 'HEAD';
  id?: string;
  url: string;
  status: number;
  duration: number;
  requestHeaders: Record<string, string>;
  responseHeaders: Record<string, string>;
  requestBody?: string;
  responseBody?: string;
  error?: string; // Optional error message, if request failed
}

interface ReduxEventMessage extends BaseMessage {
  type: MessageType.ReduxEvent;
  action: {
    type: string;
    payload?: any; // Optional payload for the action
  };
  stateDiff: {
    before: any; // State before the action
    after: any; // State after the action
  };
}

/**
 * Union type for all possible WebSocket messages.
 */
type WebSocketMessage =
  | HandshakeMessage
  | HandshakeAcknowledgeMessage
  | AppInfoMessage
  | ConsoleLogMessage
  | NetworkEventMessage
  | ReduxEventMessage;

export {
  MessageType,
  BaseMessage,
  HandshakeMessage,
  HandshakeAcknowledgeMessage,
  AppInfoMessage,
  ConsoleLogMessage,
  NetworkEventMessage,
  ReduxEventMessage,
  WebSocketMessage,
};
