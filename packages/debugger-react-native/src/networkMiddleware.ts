import { LibToDebuggerEventType } from '@pulse/shared-types';
import { sendToDebugger } from './utils/debuggerUtils';

interface NetworkRequest {
  id: string;
  status: 'pending' | 'fulfilled' | 'rejected';
  startTime: number;
  url: string;
  method: string;
  headers: object;
  body: unknown | null;
  response?: {
    status: number;
    headers: Record<string, string>;
    body: string;
    error?: Error;
    duration: number;
    startTime: number;
    endTime: number;
  };
}

/**
 * Network middleware that intercepts fetch requests and sends them to the Pulse debugger.
 * This middleware should be used to wrap the global fetch function.
 *
 * @example
 * ```ts
 * import { pulseNetworkMiddleware } from 'react-native-pulse-debugger';
 *
 * global.fetch = pulseNetworkMiddleware(fetch);
 * ```
 */
export const pulseNetworkMiddleware = (originalFetch: typeof fetch) => {
  return async (url: Request, options?: RequestInit) => {
    const startTime = Date.now();
    const requestId = Math.random().toString(36).substring(2, 15);

    // Prepare the Pending Request
    const networkRequest: NetworkRequest = {
      id: requestId,
      status: 'pending',
      startTime,
      url: url.toString(),
      method: options?.method ?? 'GET',
      headers: options?.headers ?? {},
      body: options?.body,
    };

    // Emit the Pending Request
    sendToDebugger(LibToDebuggerEventType.NETWORK_REQUEST, networkRequest);

    try {
      // Make the request
      const response = await originalFetch(url, options);
      // Update the pending request with the response
      networkRequest.status = 'fulfilled';
      networkRequest.response = {
        status: response.status,
        headers: response.headers
          ? Object.fromEntries(response.headers.entries())
          : {},
        body: await response.text(),
        duration: Date.now() - startTime,
        startTime,
        endTime: Date.now(),
      };

      // Emit the Fulfilled Request, this will notify the debugger that the network request has been fulfilled
      sendToDebugger(LibToDebuggerEventType.NETWORK_REQUEST, networkRequest);

      return response;
    } catch (error) {
      networkRequest.status = 'rejected';
      networkRequest.response = {
        status: error instanceof Response ? error.status : 0,
        headers:
          error instanceof Response
            ? Object.fromEntries(error.headers.entries())
            : {},
        body: error instanceof Error ? error.message : String(error),
        error: error instanceof Error ? error : new Error(String(error)),
        duration: Date.now() - startTime,
        startTime,
        endTime: Date.now(),
      };

      // Emit the Rejected Request, this will notify the debugger that the network request has been rejected
      sendToDebugger(LibToDebuggerEventType.NETWORK_REQUEST, networkRequest);

      throw error;
    }
  };
};
