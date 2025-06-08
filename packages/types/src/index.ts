export interface LogEntry {
	timestamp: number;
	level: 'debug' | 'info' | 'warn' | 'error';
	message: string;
	data?: any;
}

export interface NetworkRequest {
	id: string;
	timestamp: number;
	method: string;
	url: string;
	headers: Record<string, string>;
	body?: any;
	response?: {
		status: number;
		headers: Record<string, string>;
		body?: any;
	};
}

export interface ReduxAction {
	type: string;
	payload?: any;
	timestamp: number;
}

export interface ReduxState {
	state: any;
	timestamp: number;
}
