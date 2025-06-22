import {
    DeviceInfo,
    EventType,
    PulseEvent,
    PulseEventPayload,
    Session,
} from '@react-native-pulse-debugger/types';
import { generateUUID } from '@react-native-pulse-debugger/utils';
import { PulseDebuggerConfig } from '../types';
import { getDeviceInfo } from '../utils/deviceInfo';
import { getDevelopmentHost } from '../utils/networkUtils';

export class WebSocketManager {
    private ws: WebSocket | null = null;
    private isConnecting: boolean = false;
    private reconnectTimeout: NodeJS.Timeout | null = null;
    private eventQueue: PulseEvent[] = [];
    private batchTimeout: NodeJS.Timeout | null = null;
    private lastSentTime: number = 0;
    private readonly BATCH_INTERVAL = 100;
    private readonly THROTTLE_INTERVAL = 100;
    private deviceDetails: DeviceInfo | null = null;
    private session: Session | null = null;

    constructor(private config: PulseDebuggerConfig) {
        this.initializeAutoDiscovery();
    }

    private async initializeAutoDiscovery(): Promise<void> {
        if (!this.config.host || this.config.host === 'localhost') {
            const host = await getDevelopmentHost();
            if (host) {
                this.config.host = host.host;
                this.config.port = host.port;
            }
        }
    }

    private async initializeSession(): Promise<void> {
        // if session already exists, skip initialization
        if (this.session) {
            return;
        }

        // fetch device details
        this.deviceDetails = await getDeviceInfo();
        if (!this.deviceDetails || !this.deviceDetails?.deviceId || !this.deviceDetails?.appName) {
            console.error('[PulseDebuggerLib] - [WebSocketManager] Failed to fetch device details');
            return;
        }

        // create a unique session ID using deviceId and appName
        const { deviceId, appName } = this.deviceDetails;
        const sessionId = `${deviceId}-${appName}`;

        // create the session object
        this.session = {
            id: sessionId,
            deviceInfo: this.deviceDetails,
            monitoring: {
                network: this.config.monitoring?.network ?? true,
                console: this.config.monitoring?.console ?? true,
                redux: this.config.monitoring?.redux ?? false,
            },
        };

        console.log('[PulseDebuggerLib] - [WebSocketManager] Session initialized:', this.session);
    }

    async connect(): Promise<void> {
        if (this.isConnecting || this.ws?.readyState === WebSocket.OPEN) return;

        this.isConnecting = true;

        if (!this.session) {
            await this.initializeSession();
        }

        const wsUrl = `ws://${this.config.host}:${this.config.port}`;

        this.ws = new WebSocket(wsUrl);

        this.ws.onopen = () => {
            this.isConnecting = false;
            this.processEventQueue();
        };

        this.ws.onclose = () => {
            this.isConnecting = false;
            if (this.config.autoConnect) {
                this.scheduleReconnect();
            }
        };
        this.ws.onerror = (event: Event) => {
            // Use proper WebSocket error event typing
            const errorEvent = event as ErrorEvent;
            const ws = event.target as WebSocket;

            // Don't handle errors if the connection is already closed
            if (ws.readyState === WebSocket.CLOSED) {
                return;
            }

            // Extract error information safely
            const errorMessage =
                errorEvent.message || errorEvent.error?.message || 'Unknown WebSocket error';
            const errorType = errorEvent.error?.name || 'WebSocketError';

            // Filter out common connection errors that don't need logging
            const shouldLogError =
                !this.isConnectionRefusedError(errorMessage) &&
                !this.isNetworkUnreachableError(errorMessage);

            if (shouldLogError) {
                console.error('[PulseDebugger] WebSocket error:', {
                    type: errorType,
                    message: errorMessage,
                    readyState: ws.readyState,
                    url: ws.url,
                    timestamp: new Date().toISOString(),
                });
            }

            // Update connection state if we're still connecting
            if (this.isConnecting) {
                this.isConnecting = false;
            }
        };

        this.ws.onmessage = event => {
            try {
                const message = JSON.parse(event.data);
                if (message.type === 'request_handshake') {
                    // Resend the handshake data
                    if (this.session) {
                        this.sendEvent('handshake', this.session);
                    }
                }
            } catch (error) {
                console.error('Error processing message:', error);
            }
        };
    }

    private scheduleReconnect(): void {
        if (this.reconnectTimeout) return;

        this.reconnectTimeout = setTimeout(() => {
            this.reconnectTimeout = null;
            this.connect();
        }, this.config.retryInterval);
    }

    sendEvent(type: EventType, payload: PulseEventPayload[EventType]): void {
        if (!this.session) {
            return;
        }

        const event: PulseEvent = {
            type,
            payload,
            eventId: generateUUID(),
            sessionId: this.session?.id,
            timestamp: Date.now(),
        };

        if (this.config.enableBatching) {
            this.eventQueue.push(event);
            this.scheduleBatchProcessing();
        } else {
            // For non-batching mode, ensure we're connected before sending
            if (this.ws?.readyState === WebSocket.OPEN) {
                this.sendImmediately(event);
            } else {
                // If not connected, queue the event and try to connect
                this.eventQueue.push(event);
                if (!this.isConnecting) {
                    this.connect();
                }
            }
        }
    }

    private scheduleBatchProcessing(): void {
        if (this.batchTimeout) return;

        this.batchTimeout = setTimeout(() => {
            this.batchTimeout = null;
            this.processEventQueue();
        }, this.BATCH_INTERVAL);
    }

    private processEventQueue(): void {
        if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;

        if (this.config.enableThrottling) {
            const now = Date.now();
            if (now - this.lastSentTime < this.THROTTLE_INTERVAL) {
                // If we're throttling, reschedule the processing
                this.scheduleBatchProcessing();
                return;
            }
        }

        if (this.eventQueue.length > 0) {
            const events = this.eventQueue.splice(0, this.eventQueue.length);
            this.sendImmediately(events);
            this.lastSentTime = Date.now();
        }
    }

    private sendImmediately(events: PulseEvent | PulseEvent[]): void {
        if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
            // If we can't send, put the events back in the queue
            if (Array.isArray(events)) {
                this.eventQueue.unshift(...events);
            } else {
                this.eventQueue.unshift(events);
            }
            return;
        }

        this.ws.send(JSON.stringify(events));
    }

    disconnect(): void {
        // Clear all timeouts
        if (this.reconnectTimeout) {
            clearTimeout(this.reconnectTimeout);
            this.reconnectTimeout = null;
        }

        if (this.batchTimeout) {
            clearTimeout(this.batchTimeout);
            this.batchTimeout = null;
        }

        // Clear event queue
        this.eventQueue = [];

        // Properly close and cleanup WebSocket
        if (this.ws) {
            // Remove all event listeners to prevent any callbacks
            this.ws.onopen = null;
            this.ws.onclose = null;
            this.ws.onerror = null;
            this.ws.onmessage = null;

            // Close the connection if it's not already closed
            if (
                this.ws.readyState === WebSocket.OPEN ||
                this.ws.readyState === WebSocket.CONNECTING
            ) {
                this.ws.close();
            }
            this.ws = null;
        }

        // Reset connection state
        this.isConnecting = false;

        // Clear the session
        this.session = null;
    }

    destroy(): void {
        this.disconnect();
    }

    isConnected(): boolean {
        return this.ws?.readyState === WebSocket.OPEN;
    }

    /**
     * Check if the error is a connection refused error
     */
    private isConnectionRefusedError(message: string): boolean {
        const connectionRefusedPatterns = [
            'connection refused',
            'connection reset',
            'connection failed',
            'network is unreachable',
            'no route to host',
            'connection timed out',
        ];

        const lowerMessage = message.toLowerCase();
        return connectionRefusedPatterns.some(pattern => lowerMessage.includes(pattern));
    }

    /**
     * Check if the error is a network unreachable error
     */
    private isNetworkUnreachableError(message: string): boolean {
        const networkUnreachablePatterns = [
            'network is unreachable',
            'no route to host',
            'host unreachable',
            'network unreachable',
        ];

        const lowerMessage = message.toLowerCase();
        return networkUnreachablePatterns.some(pattern => lowerMessage.includes(pattern));
    }
}
