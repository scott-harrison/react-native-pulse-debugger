import { create } from 'zustand';
import { NetworkRequest as SharedNetworkRequest, NetworkResponse } from '@pulse/shared-types';

// Extend the shared NetworkRequest type with additional fields
interface NetworkRequest extends SharedNetworkRequest {
  status?: 'pending' | 'completed' | 'error';
}

interface NetworkState {
  requests: NetworkRequest[];
  responses: NetworkResponse[];
  selectedRequestId: string | null;
  selectedResponseId: string | null;
  addRequest: (request: NetworkRequest) => void;
  addResponse: (response: NetworkResponse) => void;
  updateRequestStatus: (requestId: string, status: NetworkRequest['status']) => void;
  selectRequest: (requestId: string | null) => void;
  selectResponse: (responseId: string | null) => void;
  getResponseForRequest: (requestId: string) => NetworkResponse | undefined;
  clear: () => void;
}

// Keep track of processed requests and responses to prevent duplicates
const processedRequests = new Set<string>();
const processedResponses = new Set<string>();

export const useNetworkStore = create<NetworkState>((set, get) => ({
  requests: [],
  responses: [],
  selectedRequestId: null,
  selectedResponseId: null,

  addRequest: request => {
    // Create a unique key for this request
    const requestKey = `${request.id}_${request.timestamp}`;

    // Check if we've already processed this request
    if (processedRequests.has(requestKey)) {
      console.log('Skipping duplicate request:', request.id);
      return;
    }

    // Mark this request as processed
    processedRequests.add(requestKey);

    // Clean up old entries to prevent memory leaks (keep last 1000)
    if (processedRequests.size > 1000) {
      const keys = Array.from(processedRequests);
      for (let i = 0; i < keys.length - 1000; i++) {
        processedRequests.delete(keys[i]);
      }
    }

    set(state => ({
      requests: [request, ...state.requests],
    }));
  },

  addResponse: response => {
    // Create a unique key for this response
    const responseKey = `${response.id}_${response.timestamp}`;

    // Check if we've already processed this response
    if (processedResponses.has(responseKey)) {
      console.log('Skipping duplicate response:', response.id);
      return;
    }

    // Mark this response as processed
    processedResponses.add(responseKey);

    // Clean up old entries to prevent memory leaks (keep last 1000)
    if (processedResponses.size > 1000) {
      const keys = Array.from(processedResponses);
      for (let i = 0; i < keys.length - 1000; i++) {
        processedResponses.delete(keys[i]);
      }
    }

    set(state => ({
      responses: [response, ...state.responses],
      // Update the corresponding request status
      requests: state.requests.map(req =>
        req.id === response.id ? { ...req, status: 'completed' } : req
      ),
    }));
  },

  updateRequestStatus: (requestId, status) => {
    set(state => ({
      requests: state.requests.map(req => (req.id === requestId ? { ...req, status } : req)),
    }));
  },

  selectRequest: requestId => {
    set({ selectedRequestId: requestId });
    // If there's a response for this request, select it too
    if (requestId) {
      const response = get().responses.find(r => r.id === requestId);
      if (response) {
        set({ selectedResponseId: response.id });
      }
    } else {
      set({ selectedResponseId: null });
    }
  },

  selectResponse: responseId => {
    set({ selectedResponseId: responseId });
  },

  getResponseForRequest: requestId => {
    return get().responses.find(response => response.id === requestId);
  },

  clear: () => {
    set({
      requests: [],
      responses: [],
      selectedRequestId: null,
      selectedResponseId: null,
    });
    // Also clear the processed sets
    processedRequests.clear();
    processedResponses.clear();
  },
}));
