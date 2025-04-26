import { SessionManager } from '../../websocket/sessionManager';
import { SessionData, AppMetadata, Platform } from '@pulse/shared-types';
import WebSocket from 'ws';

// Mock WebSocket instances
const mockWs1 = { send: jest.fn() } as unknown as WebSocket;
const mockWs2 = { send: jest.fn() } as unknown as WebSocket;

// Test data
const deviceId1 = 'device-123';
const deviceId2 = 'device-456';
const platform: Platform = 'ios';
const appMetadata: AppMetadata = {
  appName: 'TestApp',
  appVersion: '1.0.0',
  buildNumber: '100',
  platform,
  isExpo: false,
  deviceInfo: {
    model: 'iPhone 14',
    osVersion: '16.0',
  },
};

describe('SessionManager', () => {
  let sessionManager: SessionManager;

  beforeEach(() => {
    jest.clearAllMocks();
    sessionManager = new SessionManager();
  });

  describe('Session Creation', () => {
    it('creates a new session on handleConnect with a new deviceId', () => {
      sessionManager.handleConnect(mockWs1, deviceId1, platform);
      const session = sessionManager.getSession(deviceId1);
      const ws = sessionManager.getWebSocket(deviceId1);

      expect(session).toBeDefined();
      expect(session?.deviceId).toBe(deviceId1);
      expect(session?.metadata.platform).toBe(platform);
      expect(session?.status).toBe('connected');
      expect(session?.connectedAt).toBeDefined();
      expect(session?.lastActiveAt).toBeDefined();
      expect(ws).toBe(mockWs1);
    });

    it('logs and throws an error for missing deviceId', () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      expect(() => sessionManager.handleConnect(mockWs1, '', platform)).toThrow(
        'Invalid deviceId or platform'
      );
      expect(consoleErrorSpy).toHaveBeenCalledWith('Invalid deviceId or platform');
      consoleErrorSpy.mockRestore();
    });
  });

  describe('Session Update', () => {
    it('updates session metadata with updateAppMetadata', () => {
      sessionManager.handleConnect(mockWs1, deviceId1, platform);
      sessionManager.updateAppMetadata(mockWs1, appMetadata);
      const session = sessionManager.getSession(deviceId1);

      expect(session).toBeDefined();
      expect(session?.metadata).toBe(appMetadata);
      expect(session?.lastActiveAt).toBeDefined();
    });

    it('logs and ignores updateAppMetadata for unknown WebSocket', () => {
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
      sessionManager.updateAppMetadata(mockWs1, appMetadata);
      expect(consoleWarnSpy).toHaveBeenCalledWith('No session found for WebSocket');
      consoleWarnSpy.mockRestore();
    });
  });

  describe('Session Disconnection', () => {
    it('marks a session as disconnected on handleDisconnect', () => {
      sessionManager.handleConnect(mockWs1, deviceId1, platform);
      sessionManager.handleDisconnect(mockWs1);
      const session = sessionManager.getSession(deviceId1);
      const ws = sessionManager.getWebSocket(deviceId1);

      expect(session).toBeDefined();
      expect(session?.status).toBe('disconnected');
      expect(ws).toBeUndefined();
    });

    it('logs and ignores handleDisconnect for unknown WebSocket', () => {
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
      sessionManager.handleDisconnect(mockWs1);
      expect(consoleWarnSpy).toHaveBeenCalledWith('No session found for WebSocket');
      consoleWarnSpy.mockRestore();
    });
  });

  describe('Reconnection', () => {
    it('reassociates an existing session on handleConnect with the same deviceId', () => {
      // Initial connection
      sessionManager.handleConnect(mockWs1, deviceId1, platform);
      sessionManager.updateAppMetadata(mockWs1, appMetadata);
      sessionManager.handleDisconnect(mockWs1);

      // Reconnect with the same deviceId
      sessionManager.handleConnect(mockWs2, deviceId1, platform);
      const session = sessionManager.getSession(deviceId1);
      const ws = sessionManager.getWebSocket(deviceId1);

      expect(session).toBeDefined();
      expect(session?.deviceId).toBe(deviceId1);
      expect(session?.metadata).toEqual(appMetadata); // Retains metadata
      expect(session?.status).toBe('connected');
      expect(ws).toBe(mockWs2);
    });
  });

  describe('Session Retrieval', () => {
    it('retrieves a session by deviceId', () => {
      sessionManager.handleConnect(mockWs1, deviceId1, platform);
      const session = sessionManager.getSession(deviceId1);

      expect(session).toBeDefined();
      expect(session?.deviceId).toBe(deviceId1);
    });

    it('returns undefined for unknown deviceId', () => {
      const session = sessionManager.getSession('unknown-device');
      expect(session).toBeUndefined();
    });

    it('retrieves all sessions', () => {
      sessionManager.handleConnect(mockWs1, deviceId1, platform);
      sessionManager.handleConnect(mockWs2, deviceId2, 'android');
      const sessions = sessionManager.getAllSessions();

      expect(sessions).toHaveLength(2);
      expect(sessions.find((s: SessionData) => s.deviceId === deviceId1)).toBeDefined();
      expect(sessions.find((s: SessionData) => s.deviceId === deviceId2)).toBeDefined();
    });
  });
});
