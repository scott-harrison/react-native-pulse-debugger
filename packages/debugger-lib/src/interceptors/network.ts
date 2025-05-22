import { WebSocketClient } from '../client/WebSocketClient';
import { type INetworkPayload } from '@pulse/shared-types';
import { generateUuid } from '../utils/generateUUID';

/**
 * Network middleware that intercepts fetch requests and sends them to the Pulse debugger.
 * Sends one pending message and one fulfilled/rejected message per request.
 *
 * @example
 * ```ts
 * import { networkMiddleware } from '@pulse/debugger-react-native';
 *
 * global.fetch = networkMiddleware(client);
 * ```
 * @param client The WebSocketClient instance to send messages.
 * @returns A wrapped fetch function that sends network requests to the debugger.
 */
export function networkMiddleware(client: WebSocketClient): typeof fetch {
  // Store the original fetch to avoid chaining issues
  const originalFetch = global.fetch;
  console.log('Creating pulseNetworkMiddleware instance');

  return async (
    input: RequestInfo | URL,
    options?: RequestInit
  ): Promise<Response> => {
    const startTime = Date.now();
    const requestId = generateUuid();
    console.log(
      `Network request started: ${requestId}, url: ${input.toString()}`
    );

    // Prepare the Pending Request
    const networkRequest: INetworkPayload = {
      status: 'pending',
      startTime,
      url:
        input instanceof URL
          ? input.toString()
          : typeof input === 'string'
            ? input
            : input.url,
      method: options?.method ?? 'GET',
      headers: options?.headers ?? {},
      body: options?.body ?? null,
    };

    // Send the Pending Request
    try {
      console.log(`Sending pending network request: ${requestId}`);
      client.sendMessage({
        type: 'network_event',
        payload: networkRequest,
        id: requestId,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Failed to send pending network request:', error);
    }

    try {
      // Make the request using the original fetch
      const response = await originalFetch(input, options);
      // Update with response details
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

      // Send the Fulfilled Request
      try {
        console.log(`Sending fulfilled network request: ${requestId}`);
        client.sendMessage({
          type: 'network_event',
          payload: networkRequest,
          id: requestId,
          timestamp: new Date().toISOString(),
        });
      } catch (error) {
        console.error('Failed to send fulfilled network request:', error);
      }

      return response;
    } catch (error) {
      // Update with error details
      networkRequest.status = 'rejected';
      networkRequest.response = {
        status: error instanceof Response ? error.status : 500,
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

      // Send the Rejected Request
      try {
        console.log(`Sending rejected network request: ${requestId}`);
        client.sendMessage({
          type: 'network_event',
          payload: networkRequest,
          id: requestId,
          timestamp: new Date().toISOString(),
        });
      } catch (innerError) {
        console.error('Failed to send rejected network request:', innerError);
      }

      throw error;
    }
  };
}
