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

export type EventType = 'handshake' | 'console' | 'network_request' | 'network_response' | 'redux';

export type HandshakePayload = {
    id: string;
    deviceInfo: DeviceInfo;
    monitoring: Monitoring;
};

export type ConsolePayload = {
    type: 'log' | 'info' | 'warn' | 'error' | 'debug';
    message: string;
    data?: JSONValue;
    stack?: string;
};

export type NetworkPayload = {
    status: 'pending' | 'fulfilled' | 'rejected';
    startTime: number;
    url: string;
    method: string;
    headers: object;
    body: object | string | null;
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
    prevState: unknown;
    nextState: unknown;
};

export type PulseEventPayload = {
    handshake: HandshakePayload;
    console: ConsolePayload;
    network_request: NetworkPayload;
    network_response: NetworkPayload;
    redux: ReduxPayload;
};

export interface PulseEvent<T extends EventType = EventType> {
    type: T;
    payload: PulseEventPayload[T];
    eventId: string;
    sessionId: SessionId;
    timestamp: number;
}
