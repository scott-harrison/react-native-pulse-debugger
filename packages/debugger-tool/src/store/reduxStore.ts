import { IEvent } from '@pulse/shared-types';
import { create } from 'zustand';

interface IState {
	state: unknown;
	deviceId: string;
}

interface ReduxState {
	actions: IEvent<'redux_action_event'>[];
	states: IState[];
	addReduxAction: (event: IEvent<'redux_action_event'>) => void;
	addReduxState: (event: IEvent<'redux_state_event'>) => void;
	clearReduxBySessionId: (sessionId: string) => void;
}

export const useReduxStore = create<ReduxState>(set => ({
	actions: [],
	states: [],
	addReduxAction: event =>
		set(state => ({
			actions: [...state.actions, event],
		})),
	addReduxState: event =>
		set(() => ({
			states: event.payload.state,
		})),
	clearReduxBySessionId: (sessionId: string) => {
		set(state => ({
			actions: state.actions.filter(action => action.sessionId !== sessionId),
			state: {},
		}));
	},
}));
