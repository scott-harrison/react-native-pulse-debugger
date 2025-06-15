import { PulseEvent } from '@react-native-pulse-debugger/types';
import { create } from 'zustand';

interface NetworkState {
    requests: PulseEvent<'network'>[];
    addNetworkRequest: (event: PulseEvent<'network'>) => void;
    clearNetworkRequestsBySessionId: (sessionId: string) => void;
}

export const useNetworkStore = create<NetworkState>(set => ({
    requests: [],
    addNetworkRequest: event =>
        set(state => {
            const existingIndex = state.requests.findIndex(
                req => req.payload.requestId === event.payload.requestId
            );
            if (existingIndex !== -1) {
                const updatedRequests = [...state.requests];
                updatedRequests[existingIndex] = event;
                return { requests: updatedRequests };
            }
            return { requests: [...state.requests, event] };
        }),
    clearNetworkRequestsBySessionId: (sessionId: string) => {
        set(state => ({
            requests: state.requests.filter(request => request.sessionId !== sessionId),
        }));
    },
}));
