import type { Middleware } from 'redux';
import { WebSocketClient } from './client/WebSocketClient';
import { consoleMiddleware as pulseConsoleMiddleware } from './interceptors/console';
import { networkMiddleware as pulseNetworkMiddleware } from './interceptors/network';
import { reduxMiddleware as pulseReduxMiddleware } from './interceptors/redux';

export interface DebuggerOptions {
  port?: number;
  enableConsole?: boolean;
  enableNetwork?: boolean;
}

export type ConnectionState =
  | 'connected'
  | 'disconnected'
  | 'connecting'
  | 'error';

interface PulseDebugger {
  configure: (config?: DebuggerOptions) => PulseDebugger;
  createReduxMiddleware: () => Middleware;
}

let client: WebSocketClient | null = null;
let isDebuggerConfigured = false;
// Store the original fetch to avoid chaining issues
const originalFetch = global.fetch;

export const pulseDebugger: PulseDebugger = {
  configure(config: DebuggerOptions = {}) {
    if (isDebuggerConfigured) {
      return this;
    }
    const { port = 8080, enableConsole = true, enableNetwork = true } = config;
    client = initializePulseDebugger({ port, enableConsole, enableNetwork });
    console.log('PulseDebugger configured with port:', port);
    isDebuggerConfigured = true;
    return this;
  },

  createReduxMiddleware() {
    if (!client) {
      throw new Error(
        'PulseDebugger not configured. Call pulseDebugger.configure() first.'
      );
    }
    return pulseReduxMiddleware(client);
  },
};

/**
 * Initializes the Pulse debugger, setting up WebSocket connection and optional console/network interceptors.
 * Returns the WebSocketClient for use in custom scenarios.
 * @param options Configuration options for the debugger.
 * @returns WebSocketClient instance.
 */
export function initializePulseDebugger(
  options: DebuggerOptions = {}
): WebSocketClient {
  const { port = 8080, enableConsole = true, enableNetwork = true } = options;
  const url = `ws://localhost:${port}`;
  const wsClient = new WebSocketClient(url);

  if (enableConsole && !(global.console as any).__pulseDebuggerWrapped) {
    console.log('Applying console middleware to global.console');
    const wrappedConsole = pulseConsoleMiddleware(wsClient) as Console;
    Object.defineProperty(wrappedConsole, '__pulseDebuggerWrapped', {
      value: true,
      writable: false,
    });
    global.console = wrappedConsole;
  }

  if (enableNetwork && !(global.fetch as any).__pulseDebuggerWrapped) {
    console.log('Applying network middleware to global.fetch');
    // Reset to original fetch to break any existing chain
    global.fetch = originalFetch;
    const wrappedFetch = pulseNetworkMiddleware(wsClient) as typeof fetch;
    Object.defineProperty(wrappedFetch, '__pulseDebuggerWrapped', {
      value: true,
      writable: false,
    });
    global.fetch = wrappedFetch;
  }

  return wsClient;
}

/**
 * Gets the connection state of the WebSocket client.
 * Uses the internal client if no client is provided.
 * @param providedClient Optional WebSocketClient instance.
 * @returns Connection state.
 */
export function getPulseState(
  providedClient?: WebSocketClient
): ConnectionState {
  const targetClient = providedClient || client;
  if (!targetClient) {
    return 'disconnected';
  }
  return targetClient.isConnected() ? 'connected' : 'disconnected';
}
