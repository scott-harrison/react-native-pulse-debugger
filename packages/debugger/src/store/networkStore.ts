import { create, StoreApi } from 'zustand';
import { MessageType, NetworkEventMessage } from '@pulse/shared-types';

interface NetworkRequest {
  id: string;
  status: 'pending' | 'fulfilled' | 'rejected';
  startTime: number;
  url: string;
  method: string;
  headers: Record<string, string>;
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

export interface NetworkState {
  requests: NetworkRequest[];
  selectedRequestId: string | null;
  addRequest: (request: NetworkRequest) => void;
  updateRequest: (id: string, request: NetworkRequest) => void;
  clear: () => void;
  selectRequest: (id: string) => void;
}

// Create a single store instance
export const networkStore = create<NetworkState>(set => ({
  requests: [],
  selectedRequestId: null,
  addRequest: request => {
    console.log('Adding network request to store:', request);
    set(state => ({
      requests: [...state.requests, request],
      selectedRequestId: state.selectedRequestId || request.id,
    }));
  },
  updateRequest: (id, request) => {
    console.log('Updating network request in store:', { id, request });
    set(state => {
      const existingRequestIndex = state.requests.findIndex(req => req.id === id);
      if (existingRequestIndex === -1) {
        console.warn(`Network request with id ${id} not found for update`);
        return state;
      }
      const updatedRequests = [...state.requests];
      updatedRequests[existingRequestIndex] = request;
      return {
        requests: updatedRequests,
        selectedRequestId: state.selectedRequestId,
      };
    });
  },
  clear: () => {
    console.log('Clearing network requests in store');
    set({ requests: [], selectedRequestId: null });
  },
  selectRequest: id => {
    console.log('Selecting network request in store:', id);
    set({ selectedRequestId: id });
  },
}));

export const registerNetworkDispatch = (
  addRequest: (request: NetworkRequest) => void,
  updateRequest: (id: string, request: NetworkRequest) => void
) => {
  return (payload: NetworkEventMessage) => {
    console.log('registerNetworkDispatch received action:', payload);

    // Check if this is an update to an existing request (e.g., pending -> fulfilled)
    const existingRequest = networkStore.getState().requests.find(req => req.id === payload.id);
    if (existingRequest) {
      updateRequest(payload.id, payload);
    } else {
      addRequest(payload);
    }
  };
};

// Export the store instance for use in components
export const useNetworkStore = networkStore;
