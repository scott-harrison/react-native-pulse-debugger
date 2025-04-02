import { useState } from 'react';
import { cn } from '@/lib/utils';
import { JSONViewer } from '../common/JSONViewer';

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

interface NetworkPanelProps {
  requests: NetworkRequest[];
  responses: NetworkResponse[];
}

export function NetworkPanel({ requests, responses }: NetworkPanelProps) {
  const [selectedRequest, setSelectedRequest] = useState<NetworkRequest | null>(null);
  const [selectedResponse, setSelectedResponse] = useState<NetworkResponse | null>(null);

  const getResponseForRequest = (requestId: string) => {
    return responses.find(response => response.id === requestId);
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
          {requests.map(request => {
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
                        request.method === 'GET'
                          ? 'bg-blue-500/20 text-blue-400'
                          : request.method === 'POST'
                            ? 'bg-green-500/20 text-green-400'
                            : request.method === 'PUT'
                              ? 'bg-yellow-500/20 text-yellow-400'
                              : request.method === 'DELETE'
                                ? 'bg-red-500/20 text-red-400'
                                : 'bg-zinc-500/20 text-zinc-400'
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
                        'text-[10px] font-medium px-1.5 py-0.5 rounded',
                        response.status >= 200 && response.status < 300
                          ? 'bg-emerald-500/20 text-emerald-400'
                          : response.status >= 300 && response.status < 400
                            ? 'bg-yellow-500/20 text-yellow-400'
                            : response.status >= 400 && response.status < 500
                              ? 'bg-red-500/20 text-red-400'
                              : 'bg-zinc-500/20 text-zinc-400'
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
      <div className="w-1/2 flex flex-col">
        {selectedRequest && (
          <>
            <div className="p-4 border-b border-zinc-800">
              <h2 className="text-sm font-semibold text-zinc-100">Request Details</h2>
              <p className="text-xs text-zinc-500 mt-0.5">Selected request information</p>
            </div>
            <div className="p-4 border-b border-zinc-800">
              <div className="space-y-4">
                <div>
                  <h3 className="text-xs font-medium text-zinc-400 mb-1">URL</h3>
                  <div className="text-xs text-zinc-300 font-mono break-all">
                    {selectedRequest.url}
                  </div>
                </div>
                <div>
                  <h3 className="text-xs font-medium text-zinc-400 mb-1">Headers</h3>
                  <div className="text-xs font-mono">
                    <JSONViewer data={selectedRequest.headers} initialExpanded={true} />
                  </div>
                </div>
                {selectedRequest.body && (
                  <div>
                    <h3 className="text-xs font-medium text-zinc-400 mb-1">Body</h3>
                    <div className="text-xs font-mono">
                      <JSONViewer data={selectedRequest.body} initialExpanded={true} />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </>
        )}

        {selectedResponse && (
          <>
            <div className="p-4 border-b border-zinc-800">
              <h2 className="text-sm font-semibold text-zinc-100">Response Details</h2>
              <p className="text-xs text-zinc-500 mt-0.5">Response information</p>
            </div>
            <div className="p-4">
              <div className="space-y-4">
                <div>
                  <h3 className="text-xs font-medium text-zinc-400 mb-1">Status</h3>
                  <div className="text-xs text-zinc-300 font-mono">{selectedResponse.status}</div>
                </div>
                <div>
                  <h3 className="text-xs font-medium text-zinc-400 mb-1">Headers</h3>
                  <div className="text-xs font-mono">
                    <JSONViewer data={selectedResponse.headers} initialExpanded={true} />
                  </div>
                </div>
                {selectedResponse.body && (
                  <div>
                    <h3 className="text-xs font-medium text-zinc-400 mb-1">Body</h3>
                    <div className="text-xs font-mono">
                      <JSONViewer data={selectedResponse.body} initialExpanded={true} />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
