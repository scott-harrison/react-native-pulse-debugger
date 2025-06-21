import { Monitoring } from './config';
import { DeviceInfo } from './device';
import { SessionId } from './session';

export type JSONValue =
    | string
    | number
    | boolean
    | null
    | JSONValue[]
    | { [key: string]: JSONValue };

export type EventType = 'handshake' | 'console' | 'network' | 'redux';

export type HandshakePayload = {
    id: string;
    deviceInfo: DeviceInfo;
    monitoring: Monitoring;
};

export type ConsolePayload = {
    type: 'log' | 'info' | 'warn' | 'error' | 'debug';
    message: string;
    data: JSONValue | null;
    stack?: string;
};

export type NetworkPayload = {
    requestId: string;
    requestStatus: 'pending' | 'fulfilled' | 'rejected';
    startTime: number;
    url: string;
    method: string;
    headers: object;
    body: object | string | null;
    error?: Error | string;
    response?: {
        status: number;
        headers: Record<string, string>;
        body: string;
        error?: Error;
        duration: number;
        startTime: number;
        endTime: number;
    };
};

export type ReduxPayload = {
    action: {
        type: string;
        payload: unknown;
    };
    state: {
        prev: unknown;
        next: unknown;
    };
    duration: number;
};

export type PulseEventPayload = {
    handshake: HandshakePayload;
    console: ConsolePayload;
    network: NetworkPayload;
    redux: ReduxPayload;
};

export interface PulseEvent<T extends EventType = EventType> {
    type: T;
    payload: PulseEventPayload[T];
    eventId: string;
    sessionId: SessionId | null;
    timestamp: number;
}
