import { ConsoleInterceptor } from './interceptors/console';
import { NetworkInterceptor } from './interceptors/network';
import { ReduxInterceptor } from './interceptors/redux';
import { WebSocketManager } from './websocket/WebSocketManager';
import { PulseDebuggerConfig } from './types';
import { PulseEventPayload } from '@react-native-pulse-debugger/types';

/**
 * PulseDebugger is the main class for the Pulse Debugger library.
 */
export class PulseDebugger {
    private static instance: PulseDebugger;
    private config: PulseDebuggerConfig = {
        host: 'localhost',
        port: 8973,
        autoConnect: true,
        retryInterval: 5000,
        enableBatching: true,
        enableThrottling: true,
        consoleBlacklist: ['[PulseDebuggerLib]'],
        networkBlacklist: ['/symbolicate'],
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

        // Disconnect from any existing WebSocket connection
        if (this.wsManager) {
            this.wsManager.disconnect();
        }

        // Update WebSocket manager with new config
        this.wsManager = new WebSocketManager(this.config);
        if (this.config.autoConnect) {
            this.wsManager.connect();
        }

        // Setup interceptors based on monitoring config
        if (this.config.monitoring?.console) {
            // intercept console methods without hijacking the console object
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
    sendConsoleEvent(payload: PulseEventPayload['console']): void {
        this.wsManager.sendEvent('console', payload);
    }

    sendNetworkEvent(event: PulseEventPayload['network']): void {
        this.wsManager.sendEvent('network', event);
    }

    sendReduxEvent(event: PulseEventPayload['redux']): void {
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
