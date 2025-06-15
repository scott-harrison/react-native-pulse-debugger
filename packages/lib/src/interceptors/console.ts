import { PulseDebugger } from '../index';
import { JSONValue } from '@react-native-pulse-debugger/types';

type ConsoleMethod = 'log' | 'info' | 'warn' | 'error' | 'debug';

export class ConsoleInterceptor {
    private pulse: PulseDebugger;
    private originalConsole: any;
    private isIntercepting: boolean = false;

    constructor(pulse: PulseDebugger) {
        this.pulse = pulse;
        // Store original methods safely
        this.originalConsole = {
            log: global.console.log,
            info: global.console.info,
            warn: global.console.warn,
            error: global.console.error,
            debug: global.console.debug,
        };
    }

    isBlacklisted(message: string) {
        const config = this.pulse.getConfig();
        const blacklist = config?.consoleBlacklist;

        if (!blacklist) return false;

        return blacklist.some(pattern => {
            return message.includes(pattern);
        });
    }

    private processArgs(args: JSONValue[]) {
        const messageParts: string[] = [];
        const data: JSONValue[] = [];

        args.forEach((arg: JSONValue) => {
            if (typeof arg === 'string') {
                messageParts.push(arg); // Add strings to the message
            } else if (typeof arg === 'object' && arg !== null) {
                // Cast to JSONValue since we know it's a valid object
                data.push(arg); // Add objects/arrays to the data
            } else {
                // Handle other types (e.g., numbers, booleans)
                messageParts.push(String(arg));
            }
        });

        return {
            message: messageParts.join(' '), // Combine all string parts into a single message
            data,
        };
    }

    intercept(): void {
        if (!this.pulse.isConsoleMonitoringEnabled()) return;

        if (this.isIntercepting) return;

        const methods: ConsoleMethod[] = ['log', 'info', 'warn', 'error', 'debug'];

        methods.forEach(method => {
            global.console[method] = (...args: JSONValue[]) => {
                // Prevent recursion
                if (this.isIntercepting) {
                    return this.originalConsole[method].apply(console, args);
                }

                this.isIntercepting = true;
                try {
                    const { message, data } = this.processArgs(args);

                    // Call original first
                    this.originalConsole[method].apply(console, args);

                    // Then send event if enabled
                    if (!this.isBlacklisted(message)) {
                        const error = args.find(arg => arg instanceof Error) as Error | undefined;

                        this.pulse.sendConsoleEvent({
                            type: method,
                            message,
                            data: error ? null : data?.length ? data : null,
                            stack: error?.stack,
                        });
                    }
                } finally {
                    this.isIntercepting = false;
                }
            };
        });
    }

    restore(): void {
        Object.assign(global.console, this.originalConsole);
    }
}
