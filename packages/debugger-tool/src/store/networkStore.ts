import { IEvent } from '@pulse/shared-types';
import { create } from 'zustand';

interface NetworkState {
	requests: IEvent<'network_event'>[];
	addNetworkRequest: (event: IEvent<'network_event'>) => void;
}

export const useNetworkStore = create<NetworkState>(set => ({
	requests: [],
	addNetworkRequest: event =>
		set(state => {
			const existingIndex = state.requests.findIndex(req => req.id === event.id);
			if (existingIndex !== -1) {
				const updatedRequests = [...state.requests];
				updatedRequests[existingIndex] = event;
				return { requests: updatedRequests };
			}
			return { requests: [...state.requests, event] };
		}),
}));
