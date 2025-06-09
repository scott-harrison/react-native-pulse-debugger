import { ConsoleInterceptor } from './interceptors/console';
import { NetworkInterceptor } from './interceptors/network';
import { ReduxInterceptor } from './interceptors/redux';
import { WebSocketManager } from './websocket/WebSocketManager';
import type {
  ConsoleEvent,
  NetworkRequestEvent,
  NetworkResponseEvent,
  NetworkErrorEvent,
  ReduxEvent,
} from '@react-native-pulse-debugger/types';
import { PulseDebuggerConfig } from './types';

export class PulseDebugger {
  private static instance: PulseDebugger;
  private config: PulseDebuggerConfig = {
    host: 'localhost',
    port: 8973,
    autoConnect: true,
    retryInterval: 5000,
    enableBatching: true,
    enableThrottling: true,
    monitoring: {
      network: true,
      console: true,
      redux: false,
    },
  };

  private consoleInterceptor: ConsoleInterceptor;
  private networkInterceptor: NetworkInterceptor;
  private reduxInterceptor: ReduxInterceptor;
  private wsManager: WebSocketManager;

  private constructor() {
    this.consoleInterceptor = new ConsoleInterceptor(this);
    this.networkInterceptor = new NetworkInterceptor(this);
    this.reduxInterceptor = new ReduxInterceptor(this);
    this.wsManager = new WebSocketManager(this.config);
  }

  static getInstance(): PulseDebugger {
    if (!PulseDebugger.instance) {
      PulseDebugger.instance = new PulseDebugger();
    }
    return PulseDebugger.instance;
  }

  configure(config: Partial<PulseDebuggerConfig>): PulseDebugger {
    this.config = {
      ...this.config,
      ...config,
      monitoring: {
        ...this.config.monitoring,
        ...(config.monitoring || {}),
      },
    };

    // Update WebSocket manager with new config
    this.wsManager = new WebSocketManager(this.config);
    if (this.config.autoConnect) {
      this.wsManager.connect();
    }

    // Setup interceptors based on monitoring config
    if (this.config.monitoring?.console) {
      this.consoleInterceptor.intercept();
    }
    if (this.config.monitoring?.network) {
      this.networkInterceptor.intercept();
    }

    return this;
  }

  getConfig(): PulseDebuggerConfig {
    return { ...this.config };
  }

  updateEventConfig(
    config: Pick<PulseDebuggerConfig, 'enableBatching' | 'enableThrottling'>
  ): void {
    this.config = {
      ...this.config,
      ...config,
    };
  }

  enableNetworkMonitoring(): void {
    this.config.monitoring = {
      ...this.config.monitoring,
      network: true,
    };
    this.networkInterceptor.intercept();
  }

  disableNetworkMonitoring(): void {
    this.config.monitoring = {
      ...this.config.monitoring,
      network: false,
    };
    this.networkInterceptor.restore();
  }

  enableConsoleMonitoring(): void {
    this.config.monitoring = {
      ...this.config.monitoring,
      console: true,
    };
    this.consoleInterceptor.intercept();
  }

  disableConsoleMonitoring(): void {
    this.config.monitoring = {
      ...this.config.monitoring,
      console: false,
    };
  }

  enableReduxMonitoring(): void {
    this.config.monitoring = {
      ...this.config.monitoring,
      redux: true,
    };
  }

  disableReduxMonitoring(): void {
    this.config.monitoring = {
      ...this.config.monitoring,
      redux: false,
    };
  }

  isNetworkMonitoringEnabled(): boolean {
    return this.config.monitoring?.network ?? false;
  }

  isConsoleMonitoringEnabled(): boolean {
    return this.config.monitoring?.console ?? false;
  }

  isReduxMonitoringEnabled(): boolean {
    return this.config.monitoring?.redux ?? false;
  }

  isConnected(): boolean {
    return this.wsManager.isConnected();
  }

  // Event sending methods
  sendConsoleEvent(event: ConsoleEvent): void {
    this.wsManager.sendEvent('console', event);
  }

  sendNetworkRequestEvent(event: NetworkRequestEvent): void {
    this.wsManager.sendEvent('network_request', event);
  }

  sendNetworkResponseEvent(event: NetworkResponseEvent): void {
    this.wsManager.sendEvent('network_response', event);
  }

  sendNetworkErrorEvent(event: NetworkErrorEvent): void {
    this.wsManager.sendEvent('network_error', event);
  }

  sendReduxEvent(event: ReduxEvent): void {
    this.wsManager.sendEvent('redux', event);
  }

  getReduxMiddleware() {
    const middleware = this.reduxInterceptor.createMiddleware();
    if (!middleware) {
      console.warn(
        'PulseDebugger: Redux middleware is not available. ' +
          'Make sure redux is installed in your project.'
      );
      return [];
    }
    return [middleware];
  }
}

export const initializePulse = (config: Partial<PulseDebuggerConfig> = {}): PulseDebugger => {
  return PulseDebugger.getInstance().configure(config);
};

export const getPulse = (): PulseDebugger => {
  return PulseDebugger.getInstance();
};

export default PulseDebugger.getInstance();
