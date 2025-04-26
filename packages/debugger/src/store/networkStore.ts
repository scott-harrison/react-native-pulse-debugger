import { create } from 'zustand';
import { NetworkEventMessage } from '@pulse/shared-types';

interface NetworkState {
  requests: NetworkEventMessage[];
  selectedRequestId: string | null;
  addRequest: (request: NetworkEventMessage) => void;
  selectRequest: (requestId: string | null) => void;
  clear: () => void;
}

export const useNetworkStore = create<NetworkState>(set => ({
  requests: [],
  selectedRequestId: null,

  addRequest: request => {
    // Validate the request object
    if (!request || typeof request !== 'object') {
      console.error('[Pulse Debugger] Invalid network request:', request);
      return;
    }

    // Validate required fields
    if (!request.timestamp || !request.url) {
      console.error('[Pulse Debugger] Invalid network request: missing timestamp or url', request);
      return;
    }

    // Generate a unique ID for the request based on timestamp and URL
    const requestId = `${request.timestamp}_${request.url}`;
    const requestWithId = { ...request, id: requestId };

    set(state => {
      // Update existing request if it exists, otherwise add new one
      const existingIndex = state.requests.findIndex(r => r.id === requestId);
      if (existingIndex !== -1) {
        const newRequests = [...state.requests];
        newRequests[existingIndex] = requestWithId;
        return { requests: newRequests };
      }
      return { requests: [requestWithId, ...state.requests] };
    });
  },

  selectRequest: requestId => {
    set({ selectedRequestId: requestId });
  },

  clear: () => {
    set({
      requests: [],
      selectedRequestId: null,
    });
  },
}));
