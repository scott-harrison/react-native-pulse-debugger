import { ConnectionManager } from './connectionManager';
import type {
  ValidationResult,
  EventHandler,
  EventMessage,
  LibToDebuggerEventType,
  DebuggerToLibEventType,
} from '@pulse/shared-types';
import { validators } from './validators';

/**
 * Manages the communication of events between the React Native app and the debugger.
 * Handles both outgoing events (from app to debugger) and incoming events (from debugger to app).
 */
export class EventManager {
  private outgoingHandlers: Map<string, Set<EventHandler>> = new Map();
  private incomingHandlers: Map<string, Set<EventHandler>> = new Map();

  constructor(private connectionManager: ConnectionManager) {
    this.setupConnectionHandlers();
  }

  /**
   * Sets up the connection handlers for incoming messages.
   */
  private setupConnectionHandlers(): void {
    // Listen for messages from the debugger - expect parsed objects now, not strings
    this.connectionManager.on(ConnectionManager.EVENTS.MESSAGE, (data) => {
      this.handleIncomingMessage(data as any);
    });
  }

  /**
   * Handles incoming messages from the debugger.
   * Validates the message payload and triggers the appropriate handlers.
   * @param message - The already parsed message object
   */
  private handleIncomingMessage(message: any): void {
    try {
      // Expect already parsed object with type and payload
      const { type, payload } = message;

      const validation = this.validateMessage(type, payload);
      if (!validation.isValid) {
        console.error(`Invalid incoming message: ${validation.error}`);
        return;
      }

      // Process valid message
      const handlers = this.incomingHandlers.get(type);
      if (handlers && handlers.size > 0) {
        handlers.forEach((handler) => handler(payload));
      }
    } catch (error) {
      console.error('Error handling message:', error);
    }
  }

  /**
   * Register a handler for outgoing events (app to debugger)
   * @param type - The type of event to listen for
   * @param handler - The handler function
   */
  public onOutgoing<T>(
    type: LibToDebuggerEventType | string,
    handler: EventHandler<T>
  ): void {
    if (!this.outgoingHandlers.has(type)) {
      this.outgoingHandlers.set(type, new Set());
    }
    this.outgoingHandlers.get(type)!.add(handler as EventHandler);
  }

  /**
   * Register a handler for incoming events (debugger to app)
   * @param type - The type of event to listen for
   * @param handler - The handler function
   */
  public onIncoming<T>(
    type: DebuggerToLibEventType | string,
    handler: EventHandler<T>
  ): void {
    if (!this.incomingHandlers.has(type)) {
      this.incomingHandlers.set(type, new Set());
    }
    this.incomingHandlers.get(type)!.add(handler as EventHandler);
  }

  /**
   * Remove an event handler
   * @param type - The type of event
   * @param handler - The handler function to remove
   */
  public off(
    type: LibToDebuggerEventType | DebuggerToLibEventType | string,
    handler: EventHandler
  ): void {
    this.outgoingHandlers.get(type)?.delete(handler);
    this.incomingHandlers.get(type)?.delete(handler);
  }

  /**
   * Emit an event to the debugger
   * @param type - The type of event
   * @param payload - The event payload
   */
  public emit<T>(
    type: LibToDebuggerEventType | DebuggerToLibEventType | string,
    payload: T
  ): void {
    const validation = this.validateMessage(
      type as LibToDebuggerEventType | DebuggerToLibEventType,
      payload
    );
    if (!validation.isValid) {
      console.error(`Invalid message: ${validation.error}`);
      return;
    }

    const message: EventMessage<T> = {
      type,
      payload,
    };

    this.connectionManager.send(message);
  }

  /**
   * Validates the message payload based on the event type.
   * @param type - The type of event to validate against
   * @param payload - The payload to validate
   * @returns A ValidationResult indicating whether the payload is valid and any associated error message
   */
  private validateMessage(
    type: LibToDebuggerEventType | DebuggerToLibEventType | string,
    payload: unknown
  ): ValidationResult {
    const validator =
      validators[type as LibToDebuggerEventType | DebuggerToLibEventType];
    if (!validator) {
      // Return valid for unknown event types for now
      return { isValid: true, error: undefined };
    }

    return validator(payload);
  }
}
