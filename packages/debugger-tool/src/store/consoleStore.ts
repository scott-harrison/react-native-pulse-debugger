import { IEvent } from '@pulse/shared-types';
import { create } from 'zustand';

interface ConsoleState {
	messages: IEvent<'console_event'>[];
	addConsole: (event: IEvent<'console_event'>) => void;
}

export const useConsoleStore = create<ConsoleState>(set => ({
	messages: [],
	addConsole: event =>
		set(state => ({
			messages: [...state.messages, event],
		})),
}));
