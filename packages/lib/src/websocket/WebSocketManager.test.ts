import { WebSocket, Server } from 'mock-socket';
import { WebSocketManager } from './WebSocketManager';

describe('WebSocketManager', () => {
    let wsManager: WebSocketManager;
    let mockServer: Server;
    const wsUrl = 'ws://localhost:8973';
    let mockWebSocket: jest.Mock;
    let messages: string[] = [];

    beforeEach(() => {
        jest.clearAllMocks();
        jest.useFakeTimers();
        messages = [];
        mockServer = new Server(wsUrl);

        // Set up message handling on the mock server
        mockServer.on('connection', socket => {
            socket.on('message', data => {
                messages.push(data.toString());
            });
        });

        // Create a mock WebSocket constructor
        mockWebSocket = jest.fn().mockImplementation(url => {
            const ws = new WebSocket(url);

            // Override the send method to ensure messages are sent to the server
            const originalSend = ws.send;
            ws.send = (data: string | Blob | ArrayBuffer | ArrayBufferView) => {
                if (typeof data === 'string') {
                    messages.push(data);
                }
                return originalSend.call(ws, data);
            };

            // Set readyState using Object.defineProperty
            Object.defineProperty(ws, 'readyState', {
                value: WebSocket.OPEN,
                writable: true,
                configurable: true,
            });

            // Trigger onopen immediately
            if (ws.onopen) {
                ws.onopen(new Event('open'));
            }
            return ws;
        });

        // Add required static properties
        Object.defineProperties(mockWebSocket, {
            CONNECTING: { value: 0, configurable: true },
            OPEN: { value: 1, configurable: true },
            CLOSING: { value: 2, configurable: true },
            CLOSED: { value: 3, configurable: true },
        });

        // @ts-ignore - Mock WebSocket implementation
        global.WebSocket = mockWebSocket;
    });

    afterEach(() => {
        mockServer.stop();
        jest.useRealTimers();
    });

    it('should connect to WebSocket server', async () => {
        wsManager = new WebSocketManager({
            host: 'localhost',
            port: 8973,
            autoConnect: false,
            retryInterval: 1000,
            enableBatching: true,
            enableThrottling: true,
            monitoring: {
                network: true,
                console: true,
                redux: true,
            },
        });
        await wsManager.connect();
        expect(mockWebSocket).toHaveBeenCalledWith(wsUrl);
    });

    it('should send events immediately when batching is disabled', async () => {
        wsManager = new WebSocketManager({
            host: 'localhost',
            port: 8973,
            autoConnect: false,
            enableBatching: false,
            enableThrottling: false,
            monitoring: {
                network: true,
                console: true,
                redux: true,
            },
        });
        await wsManager.connect();
        jest.runAllTimers();

        // Send multiple events
        wsManager.sendEvent('console', {
            type: 'log',
            args: ['test1'],
            id: 'test1',
        });
        wsManager.sendEvent('console', {
            type: 'log',
            args: ['test2'],
            id: 'test2',
        });

        // Run all timers to ensure messages are processed
        jest.runAllTimers();

        // Each event should be sent immediately
        expect(messages.length).toBe(3);

        // Verify each message is a single event, not an array
        messages.forEach(message => {
            const event = JSON.parse(message);
            expect(event).toHaveProperty('type');
            expect(event).toHaveProperty('payload');
            expect(event).toHaveProperty('timestamp');
        });
    });

    it('should batch events when batching is enabled', async () => {
        wsManager = new WebSocketManager({
            host: 'localhost',
            port: 8973,
            autoConnect: false,
            enableBatching: true,
            enableThrottling: false,
            monitoring: {
                network: true,
                console: true,
                redux: true,
            },
        });
        await wsManager.connect();
        jest.runAllTimers();

        // Send multiple events
        wsManager.sendEvent('console', {
            type: 'log',
            args: ['test1'],
            id: 'test1',
        });
        wsManager.sendEvent('console', {
            type: 'log',
            args: ['test2'],
            id: 'test2',
        });

        // Run all timers to ensure messages are processed
        jest.runAllTimers();

        // Should receive one message containing all events
        expect(messages.length).toBe(1);
        const receivedMessage = messages[0];
        expect(receivedMessage).toBeDefined();

        // Parse the received message and compare the object structure
        expect(JSON.parse(receivedMessage!)).toEqual([
            {
                type: 'test1',
                payload: { data: 'test1' },
                timestamp: expect.any(Number),
            },
            {
                type: 'test2',
                payload: { data: 'test2' },
                timestamp: expect.any(Number),
            },
            {
                type: 'test3',
                payload: { data: 'test3' },
                timestamp: expect.any(Number),
            },
        ]);
    });

    it('should throttle events when throttling is enabled', async () => {
        wsManager = new WebSocketManager({
            host: 'localhost',
            port: 8973,
            autoConnect: false,
            enableBatching: true,
            enableThrottling: true,
            monitoring: {
                network: true,
                console: true,
                redux: true,
            },
        });
        await wsManager.connect();
        jest.runAllTimers();

        // Send multiple events in quick succession
        wsManager.sendEvent('console', {
            type: 'log',
            args: ['test1'],
            id: 'test1',
        });
        wsManager.sendEvent('console', {
            type: 'log',
            args: ['test2'],
            id: 'test2',
        });

        // Run all timers to ensure messages are processed
        jest.runAllTimers();

        // First batch should be sent immediately
        expect(messages.length).toBe(1);

        // Advance past the throttle interval
        jest.advanceTimersByTime(150);
        jest.runAllTimers();

        // Send more events
        wsManager.sendEvent('console', {
            type: 'log',
            args: ['test4'],
            id: 'test4',
        });
        wsManager.sendEvent('console', {
            type: 'log',
            args: ['test5'],
            id: 'test5',
        });

        // Run all timers to ensure messages are processed
        jest.runAllTimers();

        // Should have two messages total
        expect(messages.length).toBe(2);
    });

    it('should queue events when connection is not available', async () => {
        wsManager = new WebSocketManager({
            host: 'localhost',
            port: 8973,
            autoConnect: false,
            enableBatching: true,
            enableThrottling: false,
            monitoring: {
                network: true,
                console: true,
                redux: true,
            },
        });

        // Send events before connecting
        wsManager.sendEvent('console', {
            type: 'log',
            args: ['test1'],
            id: 'test1',
        });
        wsManager.sendEvent('console', {
            type: 'log',
            args: ['test2'],
            id: 'test2',
        });

        // Connect after sending events
        await wsManager.connect();
        jest.runAllTimers();

        // Advance timers to allow reconnection and message processing
        jest.advanceTimersByTime(100);
        jest.runAllTimers();

        // Should have received the queued messages
        expect(messages.length).toBeGreaterThan(0);
    });
});
