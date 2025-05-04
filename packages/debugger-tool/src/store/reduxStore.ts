import { IEvent } from '@pulse/shared-types';
import { create } from 'zustand';

interface ReduxState {
	actions: IEvent<'redux_action_event'>[];
	state: unknown;
	addReduxAction: (event: IEvent<'redux_action_event'>) => void;
	addReduxState: (event: IEvent<'redux_state_event'>) => void;
}

export const useReduxStore = create<ReduxState>(set => ({
	actions: [],
	state: {},
	addReduxAction: event =>
		set(state => ({
			actions: [...state.actions, event],
		})),
	addReduxState: event =>
		set(() => ({
			state: event.payload.state,
		})),
}));
