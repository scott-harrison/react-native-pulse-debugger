import React from 'react';
import { render, act } from '@testing-library/react';
import { useConnectionState } from '../../../hooks/useConnectionState';
import { useConnectionStore } from '../../../store/connectionStore';
import { SessionData } from '@pulse/shared-types';

// Mock the useConnectionStore hook
jest.mock('../../../store/connectionStore', () => ({
  useConnectionStore: jest.fn(),
}));

// Helper function to create a mock SessionData object
const createMockSession = (
  deviceId: string,
  status: 'connected' | 'disconnected'
): SessionData => ({
  deviceId,
  metadata: {
    appName: 'TestApp',
    appVersion: '1.0.0',
    buildNumber: '100',
    platform: 'ios',
    isExpo: false,
    deviceInfo: { model: 'iPhone', osVersion: '14.0' },
  },
  connectedAt: '2025-04-23T12:00:00.000Z',
  lastActiveAt: '2025-04-23T12:00:00.000Z',
  status,
});

// Wrapper component to use the hook
const TestComponent: React.FC<{
  onRender: (state: ReturnType<typeof useConnectionState>) => void;
}> = ({ onRender }) => {
  const state = useConnectionState();
  onRender(state);
  return null;
};

describe('useConnectionState', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns empty sessions and 0 active sessions when no sessions exist', () => {
    // Mock the Zustand store to return an empty sessions array
    (useConnectionStore as unknown as jest.Mock).mockReturnValue({ sessions: [] });

    let hookResult: ReturnType<typeof useConnectionState> | undefined;
    const onRender = (state: ReturnType<typeof useConnectionState>) => {
      hookResult = state;
    };

    render(<TestComponent onRender={onRender} />);

    expect(hookResult).toBeDefined();
    expect(hookResult!.sessions).toEqual([]);
    expect(hookResult!.activeSessions).toBe(0);
  });

  it('returns sessions and counts active sessions when all are connected', () => {
    const mockSessions = [
      createMockSession('device-1', 'connected'),
      createMockSession('device-2', 'connected'),
    ];
    (useConnectionStore as unknown as jest.Mock).mockReturnValue({ sessions: mockSessions });

    let hookResult: ReturnType<typeof useConnectionState> | undefined;
    const onRender = (state: ReturnType<typeof useConnectionState>) => {
      hookResult = state;
    };

    render(<TestComponent onRender={onRender} />);

    expect(hookResult).toBeDefined();
    expect(hookResult!.sessions).toEqual(mockSessions);
    expect(hookResult!.activeSessions).toBe(2);
  });

  it('returns sessions and counts active sessions when all are disconnected', () => {
    const mockSessions = [
      createMockSession('device-1', 'disconnected'),
      createMockSession('device-2', 'disconnected'),
    ];
    (useConnectionStore as unknown as jest.Mock).mockReturnValue({ sessions: mockSessions });

    let hookResult: ReturnType<typeof useConnectionState> | undefined;
    const onRender = (state: ReturnType<typeof useConnectionState>) => {
      hookResult = state;
    };

    render(<TestComponent onRender={onRender} />);

    expect(hookResult).toBeDefined();
    expect(hookResult!.sessions).toEqual(mockSessions);
    expect(hookResult!.activeSessions).toBe(0);
  });

  it('returns sessions and counts active sessions with mixed statuses', () => {
    const mockSessions = [
      createMockSession('device-1', 'connected'),
      createMockSession('device-2', 'disconnected'),
      createMockSession('device-3', 'connected'),
    ];
    (useConnectionStore as unknown as jest.Mock).mockReturnValue({ sessions: mockSessions });

    let hookResult: ReturnType<typeof useConnectionState> | undefined;
    const onRender = (state: ReturnType<typeof useConnectionState>) => {
      hookResult = state;
    };

    render(<TestComponent onRender={onRender} />);

    expect(hookResult).toBeDefined();
    expect(hookResult!.sessions).toEqual(mockSessions);
    expect(hookResult!.activeSessions).toBe(2);
  });

  it('updates when the store state changes', () => {
    const mockSessionsInitial = [createMockSession('device-1', 'connected')];
    const mockSessionsUpdated = [
      createMockSession('device-1', 'connected'),
      createMockSession('device-2', 'connected'),
    ];
    (useConnectionStore as unknown as jest.Mock).mockReturnValue({ sessions: mockSessionsInitial });

    let hookResult: ReturnType<typeof useConnectionState> | undefined;
    const onRender = (state: ReturnType<typeof useConnectionState>) => {
      hookResult = state;
    };

    const { rerender } = render(<TestComponent onRender={onRender} />);

    expect(hookResult).toBeDefined();
    expect(hookResult!.sessions).toEqual(mockSessionsInitial);
    expect(hookResult!.activeSessions).toBe(1);

    // Simulate a store update
    (useConnectionStore as unknown as jest.Mock).mockReturnValue({ sessions: mockSessionsUpdated });

    act(() => {
      rerender(<TestComponent onRender={onRender} />);
    });

    expect(hookResult).toBeDefined();
    expect(hookResult!.sessions).toEqual(mockSessionsUpdated);
    expect(hookResult!.activeSessions).toBe(2);
  });
});
