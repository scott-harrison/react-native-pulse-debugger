import { getPulse } from './connectionManager';
import { LibToDebuggerEventType } from '@pulse/shared-types';

/**
 * Network middleware that intercepts fetch requests and sends them to the Pulse debugger.
 * This middleware should be used to wrap the global fetch function.
 *
 * @example
 * ```ts
 * import { pulseNetworkMiddleware } from 'react-native-pulse-debugger';
 *
 * // Apply the middleware to the global fetch
 * global.fetch = pulseNetworkMiddleware(fetch);
 * ```
 */
export const pulseNetworkMiddleware = (originalFetch: typeof fetch) => {
  return async (input: RequestInfo | URL, init?: RequestInit) => {
    const startTime = Date.now();
    const requestId = Math.random().toString(36).substring(2, 15);
    const pulse = getPulse();
    const eventManager = pulse?.getEventManager();

    // Create a request object for logging
    const request = {
      id: requestId,
      url:
        typeof input === 'string'
          ? input
          : input instanceof URL
            ? input.toString()
            : input.url,
      method: init?.method || 'GET',
      headers: init?.headers || {},
      body: init?.body ? JSON.stringify(init.body) : undefined,
      timestamp: startTime,
    };

    // Send request event to debugger
    if (eventManager) {
      eventManager.emit(LibToDebuggerEventType.NETWORK_REQUEST, {
        ...request,
        status: 'pending',
      });
    }

    try {
      // Make the actual fetch request
      const response = await originalFetch(input, init);
      const endTime = Date.now();
      const duration = endTime - startTime;

      // Clone the response to read its body
      const responseClone = response.clone();
      let responseBody;

      try {
        // Try to parse the response as JSON
        responseBody = await responseClone.json();
      } catch (jsonError) {
        // If not JSON, try to get text
        try {
          responseBody = await responseClone.text();
        } catch (textError) {
          responseBody = 'Unable to parse response body';
        }
      }

      // Send response event to debugger
      if (eventManager) {
        eventManager.emit(LibToDebuggerEventType.NETWORK_REQUEST, {
          id: requestId,
          url: request.url,
          method: request.method,
          status: response.status,
          statusText: response.statusText,
          headers: Object.fromEntries(response.headers.entries()),
          body: responseBody,
          duration,
          timestamp: endTime,
        });
      }

      return response;
    } catch (error) {
      const endTime = Date.now();
      const duration = endTime - startTime;

      // Send error event to debugger
      if (eventManager) {
        eventManager.emit(LibToDebuggerEventType.NETWORK_REQUEST, {
          id: requestId,
          url: request.url,
          method: request.method,
          error: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined,
          duration,
          timestamp: endTime,
          status: 'error',
        });
      }

      // Re-throw the error to maintain the original behavior
      throw error;
    }
  };
};
