export interface ConsoleEvent {
  type: 'log' | 'info' | 'warn' | 'error' | 'debug';
  timestamp: number;
  args: unknown[];
}

export interface NetworkRequestEvent {
  type: 'request';
  id: string;
  url: string;
  method: string;
  headers: Record<string, string>;
  body: unknown;
  timestamp: number;
}

export interface NetworkResponseEvent {
  type: 'response';
  id: string;
  status: number;
  statusText: string;
  headers: Record<string, string>;
  body: unknown;
  duration: number;
}

export interface NetworkErrorEvent {
  type: 'error';
  id: string;
  error: string;
  duration: number;
}

export interface ReduxEvent {
  type: 'action';
  action: {
    type: string;
    payload: unknown;
    timestamp: number;
  };
  state: {
    prev: Record<string, unknown>;
    next: Record<string, unknown>;
    diff: Record<string, { prev: unknown; next: unknown }> | null;
  };
  duration: number;
}

export type PulseEvent =
  | ConsoleEvent
  | NetworkRequestEvent
  | NetworkResponseEvent
  | NetworkErrorEvent
  | ReduxEvent;
