import { IEvent } from '@pulse/shared-types';
import { create } from 'zustand';

interface ConsoleState {
	messages: IEvent<'console_event'>[];
	addConsole: (event: IEvent<'console_event'>) => void;
	clearConsoleBySessionId: (sessionId: string) => void;
}

export const useConsoleStore = create<ConsoleState>(set => ({
	messages: [],
	addConsole: event =>
		set(state => ({
			messages: [...state.messages, event],
		})),
	clearConsoleBySessionId(sessionId) {
		set(state => ({
			messages: state.messages.filter(message => message.sessionId !== sessionId),
		}));
	},
}));
