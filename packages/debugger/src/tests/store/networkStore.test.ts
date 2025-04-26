import { useNetworkStore } from '../../store/networkStore';
import { NetworkEventMessage } from '@pulse/shared-types';

const createMockRequest = (
  timestamp: string,
  url: string,
  overrides: Partial<NetworkEventMessage> = {}
): NetworkEventMessage => ({
  type: 'network_event',
  timestamp,
  method: 'GET',
  url,
  status: 200,
  duration: 123,
  requestHeaders: { 'Content-Type': 'application/json' },
  responseHeaders: { 'Content-Type': 'application/json' },
  requestBody: JSON.stringify({ id: 1 }),
  responseBody: JSON.stringify({ success: true }),
  ...overrides,
});

describe('useNetworkStore', () => {
  beforeEach(() => {
    // Reset the store state before each test
    useNetworkStore.setState({
      requests: [],
      selectedRequestId: null,
    });
    // Suppress console errors
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    // Reset mocks
    jest.restoreAllMocks();
  });

  describe('initial state', () => {
    it('initializes with empty requests and null selectedRequestId', () => {
      const state = useNetworkStore.getState();
      expect(state.requests).toEqual([]);
      expect(state.selectedRequestId).toBeNull();
    });
  });

  describe('addRequest', () => {
    it('adds a new request with a generated id', () => {
      const request = createMockRequest('2025-04-23T12:00:00.000Z', 'https://example.com/api');
      useNetworkStore.getState().addRequest(request);
      const expectedRequest = {
        ...request,
        id: `${request.timestamp}_${request.url}`,
      };
      expect(useNetworkStore.getState().requests).toEqual([expectedRequest]);
    });

    it('updates an existing request with the same requestId', () => {
      const request1 = createMockRequest('2025-04-23T12:00:00.000Z', 'https://example.com/api', {
        status: 200,
      });
      const request2 = createMockRequest('2025-04-23T12:00:00.000Z', 'https://example.com/api', {
        status: 404,
      });
      useNetworkStore.getState().addRequest(request1);
      expect(useNetworkStore.getState().requests).toHaveLength(1);

      useNetworkStore.getState().addRequest(request2);
      const expectedRequest = {
        ...request2,
        id: `${request2.timestamp}_${request2.url}`,
      };
      expect(useNetworkStore.getState().requests).toEqual([expectedRequest]);
      expect(useNetworkStore.getState().requests).toHaveLength(1);
    });

    it('handles multiple unique requests', () => {
      const request1 = createMockRequest('2025-04-23T12:00:00.000Z', 'https://example.com/api1');
      const request2 = createMockRequest('2025-04-23T12:00:01.000Z', 'https://example.com/api2');
      useNetworkStore.getState().addRequest(request1);
      useNetworkStore.getState().addRequest(request2);
      const expectedRequests = [
        {
          ...request2,
          id: `${request2.timestamp}_${request2.url}`,
        },
        {
          ...request1,
          id: `${request1.timestamp}_${request1.url}`,
        },
      ];
      expect(useNetworkStore.getState().requests).toEqual(expectedRequests);
      expect(useNetworkStore.getState().requests).toHaveLength(2);
    });

    it('rejects invalid input (null)', () => {
      const consoleErrorSpy = jest.spyOn(console, 'error');
      const invalidRequest = null as any;
      useNetworkStore.getState().addRequest(invalidRequest);
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        '[Pulse Debugger] Invalid network request:',
        null
      );
      expect(useNetworkStore.getState().requests).toEqual([]);
    });

    it('rejects invalid input (undefined)', () => {
      const consoleErrorSpy = jest.spyOn(console, 'error');
      const invalidRequest = undefined as any;
      useNetworkStore.getState().addRequest(invalidRequest);
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        '[Pulse Debugger] Invalid network request:',
        undefined
      );
      expect(useNetworkStore.getState().requests).toEqual([]);
    });

    it('rejects invalid input (non-object)', () => {
      const consoleErrorSpy = jest.spyOn(console, 'error');
      const invalidRequest = 42 as any;
      useNetworkStore.getState().addRequest(invalidRequest);
      expect(consoleErrorSpy).toHaveBeenCalledWith('[Pulse Debugger] Invalid network request:', 42);
      expect(useNetworkStore.getState().requests).toEqual([]);
    });

    it('rejects requests with missing timestamp', () => {
      const consoleErrorSpy = jest.spyOn(console, 'error');
      const invalidRequest: Partial<NetworkEventMessage> = {
        type: 'network_event',
        url: 'https://example.com/api',
        method: 'GET',
        status: 200,
        // Missing timestamp
      };
      useNetworkStore.getState().addRequest(invalidRequest as NetworkEventMessage);
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        '[Pulse Debugger] Invalid network request: missing timestamp or url',
        invalidRequest
      );
      expect(useNetworkStore.getState().requests).toEqual([]);
    });

    it('rejects requests with missing url', () => {
      const consoleErrorSpy = jest.spyOn(console, 'error');
      const invalidRequest: Partial<NetworkEventMessage> = {
        type: 'network_event',
        timestamp: '2025-04-23T12:00:00.000Z',
        method: 'GET',
        status: 200,
        // Missing url
      };
      useNetworkStore.getState().addRequest(invalidRequest as NetworkEventMessage);
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        '[Pulse Debugger] Invalid network request: missing timestamp or url',
        invalidRequest
      );
      expect(useNetworkStore.getState().requests).toEqual([]);
    });
  });

  describe('selectRequest', () => {
    it('sets selectedRequestId to the provided requestId', () => {
      useNetworkStore.getState().selectRequest('request-123');
      expect(useNetworkStore.getState().selectedRequestId).toBe('request-123');
    });

    it('sets selectedRequestId to null', () => {
      useNetworkStore.getState().selectRequest('request-123');
      useNetworkStore.getState().selectRequest(null);
      expect(useNetworkStore.getState().selectedRequestId).toBeNull();
    });
  });

  describe('clear', () => {
    it('resets requests and selectedRequestId', () => {
      const request1 = createMockRequest('2025-04-23T12:00:00.000Z', 'https://example.com/api1');
      const request2 = createMockRequest('2025-04-23T12:00:01.000Z', 'https://example.com/api2');
      useNetworkStore.getState().addRequest(request1);
      useNetworkStore.getState().addRequest(request2);
      useNetworkStore.getState().selectRequest('request-123');
      expect(useNetworkStore.getState().requests).toHaveLength(2);
      expect(useNetworkStore.getState().selectedRequestId).toBe('request-123');

      useNetworkStore.getState().clear();
      expect(useNetworkStore.getState().requests).toEqual([]);
      expect(useNetworkStore.getState().selectedRequestId).toBeNull();
    });
  });
});
