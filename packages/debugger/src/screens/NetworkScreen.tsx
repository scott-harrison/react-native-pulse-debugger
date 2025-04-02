import { useState } from 'react';
import { cn } from '@/lib/utils';
import { JSONViewer } from '../components/common/JSONViewer';
import { mockNetworkRequests, mockNetworkResponses } from '../mocks/data';

interface NetworkRequest {
  id: string;
  method: string;
  url: string;
  headers: Record<string, string>;
  body?: any;
  timestamp: number;
}

interface NetworkResponse {
  id: string;
  status: number;
  headers: Record<string, string>;
  body?: any;
  timestamp: number;
}

export function NetworkScreen() {
  const [selectedRequest, setSelectedRequest] = useState<NetworkRequest | null>(null);
  const [selectedResponse, setSelectedResponse] = useState<NetworkResponse | null>(null);

  const getResponseForRequest = (requestId: string) => {
    return mockNetworkResponses.find(response => response.id === requestId);
  };

  const getMethodColor = (method: string) => {
    switch (method) {
      case 'GET':
        return 'bg-blue-500/20 text-blue-400';
      case 'POST':
        return 'bg-green-500/20 text-green-400';
      case 'PUT':
        return 'bg-yellow-500/20 text-yellow-400';
      case 'DELETE':
        return 'bg-red-500/20 text-red-400';
      default:
        return 'bg-zinc-500/20 text-zinc-400';
    }
  };

  const getStatusColor = (status: number) => {
    if (status >= 500) return 'bg-red-500/20 text-red-400';
    if (status >= 400) return 'bg-yellow-500/20 text-yellow-400';
    return 'bg-green-500/20 text-green-400';
  };

  return (
    <div className="h-full flex bg-zinc-950">
      {/* Request List */}
      <div className="w-1/2 border-r border-zinc-800 flex flex-col">
        <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-zinc-100">Network Requests</h2>
            <p className="text-xs text-zinc-500 mt-0.5">Recent network activity</p>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[10px] font-medium text-emerald-400 uppercase tracking-wider">
              Live
            </span>
          </div>
        </div>
        <div className="flex-1 overflow-auto">
          {mockNetworkRequests.map(request => {
            const response = getResponseForRequest(request.id);
            return (
              <div
                key={request.id}
                onClick={() => {
                  setSelectedRequest(request);
                  if (response) setSelectedResponse(response);
                }}
                role="button"
                tabIndex={0}
                onKeyDown={e => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    setSelectedRequest(request);
                    if (response) setSelectedResponse(response);
                  }
                }}
                className={cn(
                  'w-full text-left px-4 py-3 border-b border-zinc-800/50 transition-colors cursor-pointer',
                  selectedRequest?.id === request.id ? 'bg-zinc-800' : 'hover:bg-zinc-900'
                )}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <span
                      className={cn(
                        'text-xs font-medium px-1.5 py-0.5 rounded shrink-0',
                        getMethodColor(request.method)
                      )}
                    >
                      {request.method}
                    </span>
                    <span className="text-xs text-zinc-300 truncate flex-1">{request.url}</span>
                  </div>
                  <div className="text-[10px] tabular-nums text-zinc-500 shrink-0 ml-2">
                    {new Date(request.timestamp).toLocaleTimeString()}
                  </div>
                </div>
                {response && (
                  <div className="mt-1.5 flex items-center gap-2">
                    <span
                      className={cn(
                        'text-xs font-medium px-1.5 py-0.5 rounded',
                        getStatusColor(response.status)
                      )}
                    >
                      {response.status}
                    </span>
                    <span className="text-[10px] text-zinc-500">
                      {new Date(response.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Request/Response Details */}
      {(selectedRequest || selectedResponse) && (
        <div className="w-1/2 border-l border-zinc-800 flex flex-col">
          <div className="px-3 py-2 border-b border-zinc-800">
            <h2 className="text-sm font-semibold text-zinc-100">Details</h2>
            <p className="text-[10px] text-zinc-500 mt-0.5">
              {selectedRequest ? 'Request' : 'Response'} information
            </p>
          </div>
          <div className="flex-1 p-4 overflow-auto">
            <div className="space-y-4">
              {selectedRequest && (
                <div>
                  <h3 className="text-xs font-medium text-zinc-400 mb-1">Request</h3>
                  <div className="space-y-2">
                    <div>
                      <span className="text-[10px] text-zinc-500">Method</span>
                      <p className="text-xs font-mono text-zinc-200">{selectedRequest.method}</p>
                    </div>
                    <div>
                      <span className="text-[10px] text-zinc-500">URL</span>
                      <p className="text-xs font-mono text-zinc-200">{selectedRequest.url}</p>
                    </div>
                    <div>
                      <span className="text-[10px] text-zinc-500">Headers</span>
                      <JSONViewer data={selectedRequest.headers} className="text-xs" />
                    </div>
                    {selectedRequest.body && (
                      <div>
                        <span className="text-[10px] text-zinc-500">Body</span>
                        <JSONViewer data={selectedRequest.body} className="text-xs" />
                      </div>
                    )}
                  </div>
                </div>
              )}
              {selectedResponse && (
                <div>
                  <h3 className="text-xs font-medium text-zinc-400 mb-1">Response</h3>
                  <div className="space-y-2">
                    <div>
                      <span className="text-[10px] text-zinc-500">Status</span>
                      <p className="text-xs font-mono text-zinc-200">{selectedResponse.status}</p>
                    </div>
                    <div>
                      <span className="text-[10px] text-zinc-500">Headers</span>
                      <JSONViewer data={selectedResponse.headers} className="text-xs" />
                    </div>
                    {selectedResponse.body && (
                      <div>
                        <span className="text-[10px] text-zinc-500">Body</span>
                        <JSONViewer data={selectedResponse.body} className="text-xs" />
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
