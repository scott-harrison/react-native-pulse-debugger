import { create } from 'zustand';

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

interface NetworkState {
  requests: NetworkRequest[];
  selectedRequestId: string | null;
  addRequest: (request: NetworkRequest) => void;
  selectRequest: (requestId: string | null) => void;
  clear: () => void;
}

export const useNetworkStore = create<NetworkState>(set => ({
  requests: [],
  selectedRequestId: null,

  addRequest: request => {
    set(state => {
      // Update existing request if it exists, otherwise add new one
      const existingIndex = state.requests.findIndex(r => r.id === request.id);
      if (existingIndex !== -1) {
        const newRequests = [...state.requests];
        newRequests[existingIndex] = request;
        return { requests: newRequests };
      }
      return { requests: [request, ...state.requests] };
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
