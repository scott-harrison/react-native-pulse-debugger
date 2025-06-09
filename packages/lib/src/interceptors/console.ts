import { PulseDebugger } from '../index';

type ConsoleMethod = 'log' | 'info' | 'warn' | 'error' | 'debug';

export class ConsoleInterceptor {
  private pulse: PulseDebugger;

  constructor(pulse: PulseDebugger) {
    this.pulse = pulse;
  }

  private createInterceptedMethod(method: ConsoleMethod) {
    const originalMethod = console[method];
    return (...args: any[]) => {
      // Call the original method first
      originalMethod.apply(console, args);

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
      console[method] = this.createInterceptedMethod(method);
    });
  }
}
