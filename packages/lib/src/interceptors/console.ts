import { PulseDebugger } from '../index';

type ConsoleMethod = 'log' | 'info' | 'warn' | 'error' | 'debug';

export class ConsoleInterceptor {
  private originalConsole: Console;
  private pulse: PulseDebugger;

  constructor(pulse: PulseDebugger) {
    this.pulse = pulse;
    this.originalConsole = global.console;
  }

  private createInterceptedMethod(method: ConsoleMethod) {
    return (...args: any[]) => {
      // Call original console method
      this.originalConsole[method](...args);

      // Only send to Pulse if console monitoring is enabled
      if (this.pulse.isConsoleMonitoringEnabled()) {
        this.pulse.sendConsoleEvent({
          type: method,
          timestamp: Date.now(),
          args: args.map(arg => this.serializeArg(arg)),
        });
      }
    };
  }

  private serializeArg(arg: any): any {
    if (typeof arg === 'object' && arg !== null) {
      try {
        return JSON.parse(JSON.stringify(arg));
      } catch {
        return String(arg);
      }
    }
    return arg;
  }

  intercept(): void {
    const methods: ConsoleMethod[] = ['log', 'info', 'warn', 'error', 'debug'];

    methods.forEach(method => {
      global.console[method] = this.createInterceptedMethod(method);
    });
  }

  restore(): void {
    Object.assign(global.console, this.originalConsole);
  }
}
