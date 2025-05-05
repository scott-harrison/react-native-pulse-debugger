export type TLogLevel = 'log' | 'info' | 'warn' | 'error' | 'debug' | 'table' | 'assert';

export type TReduxAction = {
	type: string;
	payload?: unknown;
};

export interface IReduxActionPayload {
	action: TReduxAction;
	prevState: unknown;
	nextState: unknown;
}

export interface IReduxStatePayload {
	state: unknown;
}

export interface IConsolePayload {
	level: TLogLevel;
	message: string;
	data?: object | [];
	stack?: Error;
}

export interface INetworkPayload {
	status: 'pending' | 'fulfilled' | 'rejected';
	startTime: number;
	url: string;
	method: string;
	headers: object;
	body: unknown | null;
	response?: {
		status: number;
		headers: Record<string, string>;
		body: string;
		error?: Error;
		duration: number;
		startTime: number;
		endTime: number;
	};
}

export type EventType =
	| 'console_event'
	| 'redux_action_event'
	| 'redux_state_event'
	| 'network_event';

export interface IEventMap {
	redux_action_event: IReduxActionPayload;
	redux_state_event: IReduxStatePayload;
	console_event: IConsolePayload;
	network_event: INetworkPayload;
}

export interface IEvent<T extends keyof IEventMap = keyof IEventMap> {
	id: string;
	sessionId?: string;
	type: T | string;
	payload: IEventMap[T];
	timestamp: string;
}
