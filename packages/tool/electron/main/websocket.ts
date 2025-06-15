import { WebSocketServer, WebSocket as WS } from 'ws';
import { BrowserWindow } from 'electron';
import { generateUUID } from '@react-native-pulse-debugger/utils';
import { Session } from '@react-native-pulse-debugger/types';

interface WebSocketClient extends WS {
    sessionId: string;
}

export class WebSocketManager {
    private wss: WebSocketServer | null = null;
    private mainWindow: BrowserWindow | null = null;
    private clients: Set<WebSocketClient> = new Set();

    constructor(private port: number = 8973) {}

    initialize(mainWindow: BrowserWindow) {
        this.mainWindow = mainWindow;
        this.wss = new WebSocketServer({ port: this.port });

        this.wss.on('connection', ws => {
            const WebSocketClient = ws as WebSocketClient;

            console.log('Client connected, requesting handshake...');
            // TODO: find out why we get multiple connections for the same singular app the connection is coming from. Its like it keeps old connections open and doesn't close them if lib is restarted or hot reloads etc.

            WebSocketClient.send(
                JSON.stringify({
                    type: 'request_handshake',
                })
            );

            ws.on('message', data => {
                try {
                    const messages = JSON.parse(data.toString());
                    const messageArray = Array.isArray(messages) ? messages : [messages];

                    messageArray.forEach(message => {
                        if (message.type === 'handshake') {
                            const session = message.payload as Session;

                            if (!session?.deviceInfo || !session?.id) {
                                console.warn('Invalid handshake payload: missing deviceInfo or id');
                                ws.close();
                                return;
                            }

                            // Store session ID and add to clients
                            WebSocketClient.sessionId = session.id;
                            this.clients.add(WebSocketClient);
                        }

                        if (this.mainWindow && WebSocketClient.sessionId) {
                            this.mainWindow.webContents.send(
                                'pulse-event',
                                WebSocketClient.sessionId,
                                message
                            );
                        }
                    });
                } catch (error) {
                    console.error('Error processing message:', error);
                }
            });

            ws.on('close', () => {
                if (WebSocketClient.sessionId) {
                    console.log('Client disconnected', WebSocketClient.sessionId);
                    if (this.mainWindow) {
                        this.mainWindow.webContents.send(
                            'pulse-disconnection',
                            WebSocketClient.sessionId
                        );
                    }
                    this.clients.delete(WebSocketClient);
                }
            });

            ws.on('error', error => {
                if (WebSocketClient.sessionId) {
                    console.error('WebSocket error:', error);
                    if (this.mainWindow) {
                        this.mainWindow.webContents.send(
                            'pulse-disconnection',
                            WebSocketClient.sessionId
                        );
                    }
                    this.clients.delete(WebSocketClient);
                }
            });
        });

        console.log(`WebSocket server started on port ${this.port}`);
    }

    sendHandshakeEvent() {
        this.clients.forEach(client => {
            if (client.readyState === WS.OPEN) {
                client.send(
                    JSON.stringify({
                        type: 'request_handshake',
                    })
                );
            }
        });
    }

    broadcast(message: any) {
        const messageStr = JSON.stringify(message);
        this.clients.forEach(client => {
            if (client.readyState === WS.OPEN) {
                client.send(messageStr);
            }
        });
    }

    close() {
        if (this.wss) {
            this.wss.close();
            this.wss = null;
            this.clients.clear();
        }
    }
}
