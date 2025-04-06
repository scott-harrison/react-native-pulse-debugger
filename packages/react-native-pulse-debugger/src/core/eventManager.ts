import type { DebugEvent } from './types';

/**
 * Configuration options for the EventManager
 */
export interface EventManagerConfig {
  /**
   * Maximum number of events to batch together before sending
   * @default 10
   */
  batchSize?: number;

  /**
   * Maximum time in milliseconds to wait before sending a batch
   * @default 1000
   */
  batchTimeout?: number;

  /**
   * Minimum time in milliseconds between sending events of the same type
   * @default 100
   */
  throttleInterval?: number;

  /**
   * Whether to enable batching of events
   * @default true
   */
  enableBatching?: boolean;

  /**
   * Whether to enable throttling of events
   * @default true
   */
  enableThrottling?: boolean;
}

interface ReduxAction {
  type: string;
  payload?: any;
  timestamp?: number;
}

interface ReduxEventPayload {
  action?: ReduxAction;
  [key: string]: any;
}

/**
 * Manages the sending of debug events to the Pulse debugger.
 * Provides batching and throttling capabilities to improve performance.
 */
export class EventManager {
  private queue: DebugEvent[] = [];
  private lastSentTimes: Record<string, number> = {};
  private batchTimeout: NodeJS.Timeout | null = null;
  private config: Required<EventManagerConfig>;
  private sendFunction: (event: DebugEvent) => void;
  private lastSentEvents: Record<string, DebugEvent> = {};

  constructor(
    sendFunction: (event: DebugEvent) => void,
    config?: EventManagerConfig
  ) {
    this.sendFunction = sendFunction;
    this.config = {
      batchSize: config?.batchSize ?? 10,
      batchTimeout: config?.batchTimeout ?? 1000,
      throttleInterval: config?.throttleInterval ?? 100,
      enableBatching: config?.enableBatching ?? true,
      enableThrottling: config?.enableThrottling ?? true,
    };
  }

  /**
   * Sends an event to the debugger, applying batching and throttling as configured.
   * @param event The event to send
   */
  public send(event: DebugEvent): void {
    // Since type is required in DebugEvent interface, we can safely assert it's a string
    const eventType = event.type as string;

    // Special handling for Redux events to prevent duplicates
    if (eventType === 'redux') {
      const payload = event.payload as ReduxEventPayload;
      const actionData = payload?.action || payload;
      if (actionData && typeof actionData === 'object') {
        const actionType = (actionData as ReduxAction).type || 'UNKNOWN_ACTION';
        const actionTimestamp =
          (actionData as ReduxAction).timestamp || event.timestamp;
        const actionKey = `${actionType}-${actionTimestamp}`;

        // Check if we've already sent this exact action
        if (this.lastSentEvents[actionKey]) {
          console.log(
            `[react-native-pulse] Skipping duplicate Redux action: ${actionType}`
          );
          return;
        }

        // Store this action as the last sent action of this type
        this.lastSentEvents[actionKey] = event;

        // Clean up old entries to prevent memory leaks
        const now = Date.now();
        Object.keys(this.lastSentEvents).forEach((key) => {
          const timestamp = parseInt(key.split('-')[1], 10);
          if (now - timestamp > 5000) {
            // Remove entries older than 5 seconds
            delete this.lastSentEvents[key];
          }
        });
      }
    }

    // If throttling is enabled, check if we should throttle this event
    if (this.config.enableThrottling && this.shouldThrottleEvent(eventType)) {
      return;
    }

    // If batching is enabled, add to queue and schedule flush
    if (this.config.enableBatching) {
      this.queue.push(event);

      // If we've reached the batch size, flush immediately
      if (this.queue.length >= this.config.batchSize) {
        this.flush();
      } else if (!this.batchTimeout) {
        // Otherwise, schedule a flush after the batch timeout
        this.batchTimeout = setTimeout(() => {
          this.flush();
        }, this.config.batchTimeout);
      }
    } else {
      // If batching is disabled, send immediately
      this.sendEvent(event);
    }
  }

  /**
   * Flushes all queued events, sending them to the debugger.
   */
  public flush(): void {
    if (this.batchTimeout) {
      clearTimeout(this.batchTimeout);
      this.batchTimeout = null;
    }

    if (this.queue.length === 0) {
      return;
    }

    // If there's only one event, send it directly
    if (this.queue.length === 1) {
      this.sendEvent(this.queue[0]!);
    } else {
      // Otherwise, send a batch event containing all queued events
      this.sendEvent({
        type: 'batch',
        payload: {
          events: [...this.queue],
          count: this.queue.length,
          timestamp: Date.now(),
        },
        timestamp: Date.now(),
      });
    }

    // Clear the queue
    this.queue = [];
  }

  /**
   * Updates the configuration options.
   * @param config New configuration options
   */
  public updateConfig(config: Partial<EventManagerConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Checks if an event should be throttled based on its type.
   * @param eventType The type of event to check
   * @returns Whether the event should be throttled
   */
  private shouldThrottleEvent(eventType: string): boolean {
    const now = Date.now();
    const lastSentTime = this.lastSentTimes[eventType] || 0;

    if (now - lastSentTime < this.config.throttleInterval) {
      return true;
    }

    this.lastSentTimes[eventType] = now;
    return false;
  }

  /**
   * Sends an event to the debugger.
   * @param event The event to send
   */
  private sendEvent(event: DebugEvent): void {
    this.sendFunction(event);
  }
}
