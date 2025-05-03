import WebSocket, { WebSocketServer } from 'ws';
import { messageHandler } from './messageHandler';
import { sessionManager } from './sessionManager';

const PORT = 8379;

/**
 * DebuggerWebSocketServer class to manage WebSocket connections for the debugger.
 */
export class DebuggerWebSocketServer {
  private wss: WebSocketServer | null = null;

  constructor() {
    // Server is not started automatically; call start() to initialize
  }

  /**
   * Start the WebSocket server.
   */
  public start(): void {
    this.wss = new WebSocketServer({ port: PORT }, () => {
      console.log(`WebSocket server started on ws://localhost:${PORT}`);
    });

    this.wss.on('error', (error: Error) => {
      console.error('WebSocket server error:', error);
    });

    this.wss.on('connection', (ws: WebSocket) => {
      console.log('New client connected');

      ws.on('message', (data: WebSocket.RawData) => {
        try {
          const message = JSON.parse(data.toString());
          // Handle the incoming message (correct parameter order)
          messageHandler.handleMessage(ws, message);
        } catch (error) {
          console.error('Error parsing message:', error);
          // Send an error response to the client
          const errorResponse = {
            type: 'error',
            timestamp: new Date().toISOString(),
            message: 'Invalid message format',
          };
          ws.send(JSON.stringify(errorResponse));
        }
      });

      ws.on('close', () => {
        console.log('Client disconnected');
        sessionManager.handleDisconnect(ws);
      });

      ws.on('error', (error: Error) => {
        console.error('WebSocket error:', error);
      });
    });

    this.wss.on('close', () => {
      console.log('WebSocket server closed');
      // Clean up sessions on server close
      (sessionManager as any).sessions.clear();
    });
  }

  /**
   * Get the WebSocketServer instance.
   * @returns The WebSocketServer instance, or null if not started.
   */
  public getServer(): WebSocketServer | null {
    return this.wss;
  }

  /**
   * Close the WebSocket server.
   */
  public close(): void {
    if (this.wss) {
      this.wss.close();
    }
  }
}

export const debuggerWebSocketServer = new DebuggerWebSocketServer();
