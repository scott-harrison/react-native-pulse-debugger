import { pulseNetworkMiddleware } from '../networkMiddleware';
import { getPulse } from '../connectionManager';
import { OutgoingEventType } from '../enums/events';

jest.mock('../connectionManager', () => ({
  getPulse: jest.fn(),
}));

describe('pulseNetworkMiddleware', () => {
  let mockEventManager: { emit: jest.Mock };
  let originalFetch: jest.Mock;
  let wrappedFetch: typeof fetch;

  beforeEach(() => {
    jest.clearAllMocks();

    mockEventManager = {
      emit: jest.fn(),
    };

    (getPulse as jest.Mock).mockReturnValue({
      getEventManager: () => mockEventManager,
    });

    originalFetch = jest.fn();
    wrappedFetch = pulseNetworkMiddleware(originalFetch);
  });

  it('should intercept and log successful requests', async () => {
    const mockResponse = new Response(JSON.stringify({ data: 'test' }), {
      status: 200,
      statusText: 'OK',
      headers: new Headers({ 'content-type': 'application/json' }),
    });
    originalFetch.mockResolvedValue(mockResponse);

    await wrappedFetch('https://api.example.com/test', {
      method: 'POST',
      body: JSON.stringify({ test: 'data' }),
    });

    expect(mockEventManager.emit).toHaveBeenCalledWith(
      OutgoingEventType.NETWORK_REQUEST,
      expect.objectContaining({
        url: 'https://api.example.com/test',
        method: 'POST',
        status: 'pending',
      })
    );

    expect(mockEventManager.emit).toHaveBeenCalledWith(
      OutgoingEventType.NETWORK_REQUEST,
      expect.objectContaining({
        url: 'https://api.example.com/test',
        method: 'POST',
        status: 200,
        statusText: 'OK',
        body: { data: 'test' },
      })
    );
  });

  it('should handle non-JSON responses', async () => {
    const mockResponse = new Response('plain text response', {
      status: 200,
      headers: new Headers({ 'content-type': 'text/plain' }),
    });
    originalFetch.mockResolvedValue(mockResponse);

    await wrappedFetch('https://api.example.com/text');

    expect(mockEventManager.emit).toHaveBeenCalledWith(
      OutgoingEventType.NETWORK_REQUEST,
      expect.objectContaining({
        body: 'Unable to parse response body',
      })
    );
  });

  it('should handle network errors', async () => {
    const mockError = new Error('Network error');
    originalFetch.mockRejectedValue(mockError);

    await expect(wrappedFetch('https://api.example.com/error')).rejects.toThrow(
      'Network error'
    );

    expect(mockEventManager.emit).toHaveBeenCalledWith(
      OutgoingEventType.NETWORK_REQUEST,
      expect.objectContaining({
        status: 'error',
        error: 'Network error',
        stack: expect.any(String),
      })
    );
  });

  it('should handle unparseable responses', async () => {
    const mockResponse = new Response('invalid json', {
      status: 200,
      headers: new Headers({ 'content-type': 'application/json' }),
    });
    originalFetch.mockResolvedValue(mockResponse);

    await wrappedFetch('https://api.example.com/invalid-json');

    expect(mockEventManager.emit).toHaveBeenCalledWith(
      OutgoingEventType.NETWORK_REQUEST,
      expect.objectContaining({
        body: 'Unable to parse response body',
      })
    );
  });

  it('should work without Pulse debugger', async () => {
    const mockResponse = new Response(JSON.stringify({ data: 'test' }));
    originalFetch.mockResolvedValue(mockResponse);

    (getPulse as jest.Mock).mockReturnValue(null);

    const response = await wrappedFetch('https://api.example.com/test');

    expect(response).toBe(mockResponse);
    expect(originalFetch).toHaveBeenCalledWith(
      'https://api.example.com/test',
      undefined
    );
  });
});
