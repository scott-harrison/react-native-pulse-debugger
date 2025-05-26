import { networkMiddleware } from './network';
import { WebSocketClient } from '../client/WebSocketClient';
import { generateUuid } from '../utils/generateUUID';

// Mock dependencies
jest.mock('../client/WebSocketClient');
jest.mock('../utils/generateUUID');

describe('Network Middleware', () => {
  // Mock client
  let mockClient: jest.Mocked<WebSocketClient>;

  // Mock date
  const mockDate = '2023-01-01T00:00:00.000Z';

  // Mock uuid
  const mockUuid = 'test-request-uuid';

  // Save original fetch
  const originalFetch = global.fetch;

  // Mock fetch
  const mockFetchImpl = jest.fn();

  // Intercepted fetch
  let interceptedFetch: typeof fetch;

  // Keep track of original console methods
  const originalConsoleMethods = {
    log: console.log,
    error: console.error,
  };

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    // Setup mock fetch before middleware creation
    global.fetch = mockFetchImpl;

    // Mock generateUuid
    (generateUuid as jest.Mock).mockReturnValue(mockUuid);

    // Mock date
    jest.spyOn(Date.prototype, 'toISOString').mockReturnValue(mockDate);

    // Mock Date.now to return sequential values
    let currentTime = 1000;
    jest.spyOn(Date, 'now').mockImplementation(() => currentTime++);

    // Set up mock console methods to avoid actual console output during tests
    console.log = jest.fn();
    console.error = jest.fn();

    // Setup client mock
    mockClient = {
      sendMessage: jest.fn(),
    } as unknown as jest.Mocked<WebSocketClient>;

    // Create middleware
    interceptedFetch = networkMiddleware(mockClient);
  });

  afterEach(() => {
    // Restore global fetch
    global.fetch = originalFetch;

    // Restore console methods
    console.log = originalConsoleMethods.log;
    console.error = originalConsoleMethods.error;
  });

  it('should send pending event when request starts', async () => {
    // Setup mock response
    const mockResponse = {
      status: 200,
      headers: new Headers({ 'Content-Type': 'application/json' }),
      text: jest.fn().mockResolvedValue('{"success":true}'),
    };
    mockFetchImpl.mockResolvedValue(mockResponse);

    // Make the request
    const promise = interceptedFetch('https://example.com/api');

    // Verify pending request was sent
    expect(mockClient.sendMessage).toHaveBeenCalledWith({
      type: 'network_event',
      id: mockUuid,
      timestamp: mockDate,
      payload: {
        status: 'pending',
        startTime: 1000,
        url: 'https://example.com/api',
        method: 'GET',
        headers: {},
        body: null,
      },
    });

    // Finish the request
    await promise;
  });

  it('should send fulfilled event when request succeeds', async () => {
    // Setup mock response
    const mockResponse = {
      status: 200,
      headers: new Headers({ 'Content-Type': 'application/json' }),
      text: jest.fn().mockResolvedValue('{"success":true}'),
    };
    mockFetchImpl.mockResolvedValue(mockResponse);

    // Make request
    await interceptedFetch('https://example.com/api');

    // Should have called sendMessage twice (pending + fulfilled)
    expect(mockClient.sendMessage).toHaveBeenCalledTimes(2);

    // Second call should be the fulfilled event
    expect(mockClient.sendMessage).toHaveBeenNthCalledWith(2, {
      type: 'network_event',
      id: mockUuid,
      timestamp: mockDate,
      payload: {
        status: 'fulfilled',
        startTime: 1000,
        url: 'https://example.com/api',
        method: 'GET',
        headers: {},
        body: null,
        response: {
          status: 200,
          headers: { 'content-type': 'application/json' },
          body: '{"success":true}',
          duration: expect.any(Number),
          startTime: expect.any(Number),
          endTime: expect.any(Number),
        },
      },
    });
  });

  it('should send rejected event when request fails', async () => {
    // Create network error
    const networkError = new Error('Network error');

    // Mock failed fetch
    mockFetchImpl.mockRejectedValue(networkError);

    // Make request and catch the error
    let caughtError;
    try {
      await interceptedFetch('https://example.com/api');
    } catch (error) {
      caughtError = error;
    }

    // Error should be rethrown
    expect(caughtError).toBe(networkError);

    // Should have called sendMessage twice (pending + rejected)
    expect(mockClient.sendMessage).toHaveBeenCalledTimes(2);

    // Second call should be the rejected event
    expect(mockClient.sendMessage).toHaveBeenNthCalledWith(2, {
      type: 'network_event',
      id: mockUuid,
      timestamp: mockDate,
      payload: {
        status: 'rejected',
        startTime: 1000,
        url: 'https://example.com/api',
        method: 'GET',
        headers: {},
        body: null,
        response: {
          status: 500,
          headers: {},
          body: 'Network error',
          error: networkError,
          duration: expect.any(Number),
          startTime: expect.any(Number),
          endTime: expect.any(Number),
        },
      },
    });
  });

  it('should handle URL objects as input', async () => {
    // Setup mock response
    const mockResponse = {
      status: 200,
      headers: new Headers(),
      text: jest.fn().mockResolvedValue(''),
    };
    mockFetchImpl.mockResolvedValue(mockResponse);

    // Make the request with URL object
    const url = new URL('https://example.com/api');
    await interceptedFetch(url);

    // Verify URL was converted to string
    expect(mockClient.sendMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        payload: expect.objectContaining({
          url: 'https://example.com/api',
        }),
      })
    );
  });

  it('should handle Request objects as input', async () => {
    // Setup mock response
    const mockResponse = {
      status: 200,
      headers: new Headers(),
      text: jest.fn().mockResolvedValue(''),
    };
    mockFetchImpl.mockResolvedValue(mockResponse);

    // Make the request with Request object
    const request = new Request('https://example.com/api', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ data: 'test' }),
    });

    await interceptedFetch(request);

    // Verify Request properties were used
    expect(mockClient.sendMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        payload: expect.objectContaining({
          url: 'https://example.com/api',
        }),
      })
    );
  });

  it('should handle POST requests with body', async () => {
    // Setup mock response
    const mockResponse = {
      status: 201,
      headers: new Headers(),
      text: jest.fn().mockResolvedValue(''),
    };
    mockFetchImpl.mockResolvedValue(mockResponse);

    // Request body
    const body = JSON.stringify({ name: 'Test', value: 123 });

    // Make POST request
    await interceptedFetch('https://example.com/api', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
    });

    // Verify body was included
    expect(mockClient.sendMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        payload: expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body,
        }),
      })
    );
  });

  it('should handle errors sending network events', async () => {
    // Setup mock response
    const mockResponse = {
      status: 200,
      headers: new Headers(),
      text: jest.fn().mockResolvedValue(''),
    };
    mockFetchImpl.mockResolvedValue(mockResponse);

    // Make client.sendMessage throw
    const sendError = new Error('Failed to send');
    mockClient.sendMessage.mockImplementation(() => {
      throw sendError;
    });

    // Request should still succeed
    const response = await interceptedFetch('https://example.com/api');

    // Should have called console.error
    expect(console.error).toHaveBeenCalled();

    // Original response should still be returned
    expect(response).toBeDefined();
    expect(response.status).toBe(200);
  });
});
