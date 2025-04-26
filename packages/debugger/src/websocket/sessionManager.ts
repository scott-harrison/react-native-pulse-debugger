import WebSocket from 'ws';
import { SessionData, AppMetadata, Platform } from '@pulse/shared-types';

/**
 * SessionManager class to track and manage sessions for connected Pulse clients.
 */
export class SessionManager {
  // Map of deviceId to SessionData
  private sessions: Map<string, SessionData & { ws?: WebSocket }> = new Map();

  /**
   * Handle a new client connection or reconnection.
   * @param ws The WebSocket instance of the client.
   * @param deviceId The unique device identifier.
   * @param platform The platform of the client (ios or android).
   */
  public handleConnect(ws: WebSocket, deviceId: string, platform: Platform): void {
    if (!deviceId || !platform) {
      console.error('Invalid deviceId or platform');
      throw new Error('Invalid deviceId or platform');
    }

    const existingSession = this.sessions.get(deviceId);
    const timestamp = new Date().toISOString();

    if (existingSession) {
      // Reconnection: Update the existing session
      existingSession.ws = ws;
      existingSession.status = 'connected';
      existingSession.connectedAt = timestamp;
      existingSession.lastActiveAt = timestamp;
      console.log(`Client reconnected: ${deviceId}`);
    } else {
      // New connection: Create a new session
      const newSession: SessionData & { ws?: WebSocket } = {
        deviceId,
        metadata: { platform } as AppMetadata, // Partial metadata, will be updated by AppInfoMessage
        connectedAt: timestamp,
        lastActiveAt: timestamp,
        status: 'connected',
        ws,
      };
      this.sessions.set(deviceId, newSession);
      console.log(`New client connected: ${deviceId}`);
    }
  }

  /**
   * Update the app metadata for a session.
   * @param ws The WebSocket instance of the client.
   * @param metadata The app metadata to update.
   */
  public updateAppMetadata(ws: WebSocket, metadata: AppMetadata): void {
    const session = Array.from(this.sessions.values()).find(s => s.ws === ws);
    if (!session) {
      console.warn('No session found for WebSocket');
      return;
    }

    session.metadata = metadata;
    session.lastActiveAt = new Date().toISOString();
    console.log(`Updated metadata for device: ${session.deviceId}`);
  }

  /**
   * Handle a client disconnection.
   * @param ws The WebSocket instance of the client.
   */
  public handleDisconnect(ws: WebSocket): void {
    const session = Array.from(this.sessions.values()).find(s => s.ws === ws);
    if (!session) {
      console.warn('No session found for WebSocket');
      return;
    }

    session.ws = undefined;
    session.status = 'disconnected';
    session.lastActiveAt = new Date().toISOString();
    console.log(`Client disconnected: ${session.deviceId}`);
  }

  /**
   * Retrieve a session by deviceId.
   * @param deviceId The unique device identifier.
   * @returns The session data or undefined if not found.
   */
  public getSession(deviceId: string): SessionData | undefined {
    const session = this.sessions.get(deviceId);
    if (!session) {
      return undefined;
    }
    // Return a copy without the ws property to match SessionData type
    const { ws, ...sessionData } = session;
    return sessionData;
  }

  /**
   * Retrieve the WebSocket instance for a session (for testing purposes).
   * @param deviceId The unique device identifier.
   * @returns The WebSocket instance or undefined if not found.
   */
  public getWebSocket(deviceId: string): WebSocket | undefined {
    const session = this.sessions.get(deviceId);
    return session?.ws;
  }

  /**
   * Retrieve all sessions.
   * @returns An array of all session data.
   */
  public getAllSessions(): SessionData[] {
    return Array.from(this.sessions.values()).map(({ ws, ...sessionData }) => sessionData);
  }
}

export const sessionManager = new SessionManager();
