import { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';
import { JSONViewer } from '../components/common/JSONViewer';
import { useConnection } from '@/lib/connection';
import { useNetworkStore } from '../store/networkStore';

interface NetworkRequest {
  id: string;
  method: string;
  url: string;
  headers: Record<string, string>;
  body?: any;
  timestamp: number;
  status?: 'pending' | 'completed' | 'error';
}

interface NetworkResponse {
  id: string;
  status: number;
  headers: Record<string, string>;
  body?: any;
  timestamp: number;
  duration?: number;
}

interface BatchEvent {
  type: string;
  payload: any;
  timestamp: number;
}

function generateCurlCommand(request: NetworkRequest): string {
  let curl = `curl '${request.url}'`;

  // Add method if not GET
  if (request.method !== 'GET') {
    curl += ` -X ${request.method}`;
  }

  // Add headers
  Object.entries(request.headers).forEach(([key, value]) => {
    // Escape single quotes in header values
    const escapedValue = value.replace(/'/g, "'\\''");
    curl += ` \\\n  -H '${key}: ${escapedValue}'`;
  });

  // Add body if present
  if (request.body) {
    let bodyStr = typeof request.body === 'string' ? request.body : JSON.stringify(request.body);
    // Escape single quotes in body
    bodyStr = bodyStr.replace(/'/g, "'\\''");
    curl += ` \\\n  -d '${bodyStr}'`;
  }

  return curl;
}

async function copyToClipboard(text: string) {
  try {
    await navigator.clipboard.writeText(text);
    console.log('Copied to clipboard');
  } catch (err) {
    console.error('Failed to copy:', err);
  }
}

export function NetworkScreen() {
  const { connectionState, sendMessage } = useConnection();
  const {
    requests,
    responses,
    selectedRequestId,
    selectedResponseId,
    addRequest,
    addResponse,
    updateRequestStatus,
    selectRequest,
    getResponseForRequest,
    clear,
  } = useNetworkStore();
  const [copiedTimeout, setCopiedTimeout] = useState<NodeJS.Timeout | null>(null);
  const [isCopied, setIsCopied] = useState(false);

  const selectedRequest = selectedRequestId ? requests.find(r => r.id === selectedRequestId) : null;
  const selectedResponse = selectedResponseId
    ? responses.find(r => r.id === selectedResponseId)
    : null;

  // Use a ref to persist the processed events set between renders
  const processedEventsRef = useRef<Set<string>>(new Set());

  // Clear the processed events set when the component mounts
  useEffect(() => {
    processedEventsRef.current.clear();
  }, []);

  // Clear the copied timeout on unmount
  useEffect(() => {
    return () => {
      if (copiedTimeout) {
        clearTimeout(copiedTimeout);
      }
    };
  }, [copiedTimeout]);

  useEffect(() => {
    if (connectionState.status === 'connected') {
      // Request initial network data
      sendMessage('get_network_data');
    }
  }, [connectionState.status, sendMessage]);

  useEffect(() => {
    const handleBatchEvents = (data: { events: BatchEvent[] }) => {
      // Process each event in the batch, filtering duplicates by timestamp and id
      data.events.forEach(event => {
        const eventKey = `${event.type}_${event.timestamp}_${event.payload?.id}`;
        if (processedEventsRef.current.has(eventKey)) {
          console.log('Skipping duplicate event:', eventKey);
          return;
        }
        processedEventsRef.current.add(eventKey);

        switch (event.type) {
          case 'network_request':
            addRequest(event.payload);
            break;
          case 'network_response':
            addResponse(event.payload);
            break;
          case 'network_error':
            updateRequestStatus(event.payload.id, 'error');
            break;
        }
      });
    };

    const handleMessage = (_event: any, data: any) => {
      console.log('Network message received:', data);
      if (data.type === 'batch' && Array.isArray(data.events)) {
        handleBatchEvents(data);
      } else {
        // For single events, check if we've already processed this exact event
        const eventKey = `${data.type}_${data.timestamp}_${data.payload?.id}`;
        if (processedEventsRef.current.has(eventKey)) {
          console.log('Skipping duplicate single event:', eventKey);
          return;
        }
        processedEventsRef.current.add(eventKey);

        switch (data.type) {
          case 'network_request':
            addRequest(data.payload);
            break;
          case 'network_response':
            addResponse(data.payload);
            break;
          case 'network_error':
            updateRequestStatus(data.payload.id, 'error');
            break;
        }
      }
    };

    // Subscribe to WebSocket messages through Electron IPC
    window.electron.ipcRenderer.on('ws-message', handleMessage);

    return () => {
      window.electron.ipcRenderer.removeListener('ws-message', handleMessage);
    };
  }, [addRequest, addResponse, updateRequestStatus]);

  const handleClear = () => {
    clear();
    processedEventsRef.current.clear();
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

  const handleCopyCurl = async (request: NetworkRequest) => {
    await copyToClipboard(generateCurlCommand(request));
    setIsCopied(true);

    if (copiedTimeout) {
      clearTimeout(copiedTimeout);
    }

    const timeout = setTimeout(() => {
      setIsCopied(false);
    }, 2000);

    setCopiedTimeout(timeout);
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
          <div className="flex items-center gap-2">
            <button
              onClick={handleClear}
              className="text-xs text-zinc-400 hover:text-zinc-200 px-2 py-1 rounded bg-zinc-800 hover:bg-zinc-700 transition-colors"
            >
              Clear
            </button>
          </div>
        </div>
        <div className="flex-1 overflow-auto">
          {requests.map(request => {
            const response = getResponseForRequest(request.id);
            const uniqueKey = `${request.id}_${request.timestamp}`;
            return (
              <div
                key={uniqueKey}
                onClick={() => selectRequest(request.id)}
                role="button"
                tabIndex={0}
                onKeyDown={e => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    selectRequest(request.id);
                  }
                }}
                className={cn(
                  'w-full text-left px-4 py-3 border-b border-zinc-800/50 transition-colors cursor-pointer',
                  selectedRequestId === request.id ? 'bg-zinc-800' : 'hover:bg-zinc-900'
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
                    {response.duration && (
                      <span className="text-[10px] text-zinc-500">({response.duration}ms)</span>
                    )}
                  </div>
                )}
                {request.status === 'error' && (
                  <div className="mt-1.5">
                    <span className="text-xs text-red-400">Request failed</span>
                  </div>
                )}
                {request.status === 'pending' && (
                  <div className="mt-1.5">
                    <span className="text-xs text-yellow-400">Pending...</span>
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
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-xs font-medium text-zinc-400">Request</h3>
                    <button
                      onClick={() => handleCopyCurl(selectedRequest)}
                      className={cn(
                        'text-xs px-2 py-1 rounded transition-colors',
                        isCopied
                          ? 'bg-emerald-900/50 text-emerald-400'
                          : 'bg-zinc-800 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-700'
                      )}
                    >
                      {isCopied ? 'Copied!' : 'Copy as cURL'}
                    </button>
                  </div>
                  <div className="space-y-2">
                    <div>
                      <span className="text-[10px] text-zinc-500">Method</span>
                      <p className="text-xs font-mono text-zinc-200">{selectedRequest.method}</p>
                    </div>
                    <div>
                      <span className="text-[10px] text-zinc-500">URL</span>
                      <p className="text-xs font-mono text-zinc-200 break-all">
                        {selectedRequest.url}
                      </p>
                    </div>
                    <div>
                      <span className="text-[10px] text-zinc-500">Headers</span>
                      <div className="bg-zinc-900 p-2 rounded-md mt-1">
                        <JSONViewer data={selectedRequest.headers} className="text-xs" />
                      </div>
                    </div>
                    {selectedRequest.body && (
                      <div>
                        <span className="text-[10px] text-zinc-500">Body</span>
                        <div className="bg-zinc-900 p-2 rounded-md mt-1">
                          <JSONViewer
                            data={
                              typeof selectedRequest.body === 'string'
                                ? JSON.parse(selectedRequest.body)
                                : selectedRequest.body
                            }
                            className="text-xs"
                          />
                        </div>
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
                      <div className="bg-zinc-900 p-2 rounded-md mt-1">
                        <JSONViewer data={selectedResponse.headers} className="text-xs" />
                      </div>
                    </div>
                    {selectedResponse.body && (
                      <div>
                        <span className="text-[10px] text-zinc-500">Body</span>
                        <div className="bg-zinc-900 p-2 rounded-md mt-1">
                          <JSONViewer
                            data={
                              typeof selectedResponse.body === 'string'
                                ? JSON.parse(selectedResponse.body)
                                : selectedResponse.body
                            }
                            className="text-xs"
                          />
                        </div>
                      </div>
                    )}
                    {selectedResponse.duration && (
                      <div>
                        <span className="text-[10px] text-zinc-500">Duration</span>
                        <p className="text-xs font-mono text-zinc-200">
                          {selectedResponse.duration}ms
                        </p>
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
