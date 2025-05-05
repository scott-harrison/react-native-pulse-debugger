import { IEvent } from '@pulse/shared-types';
import { create } from 'zustand';

interface ConsoleState {
	logs: IEvent<'console_event'>[];
	addConsole: (event: IEvent<'console_event'>) => void;
	clearConsoleBySessionId: (sessionId: string) => void;
}

export const useConsoleStore = create<ConsoleState>(set => ({
	logs: [],
	addConsole: event =>
		set(state => ({
			logs: [...state.logs, event],
		})),
	clearConsoleBySessionId(sessionId) {
		set(state => ({
			logs: state.logs.filter(log => log.sessionId !== sessionId),
		}));
	},
}));
