import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { JSONViewer } from '../components/common/JSONViewer';
import { useNetworkStore } from '../store/networkStore';
import { LibToDebuggerEventType } from '@pulse/shared-types';

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

function generateCurlCommand(request: NetworkRequest): string {
  let curl = `curl '${request.url}'`;

  // Add method if not GET
  if (request.method !== 'GET') {
    curl += ` -X ${request.method}`;
  }

  // Add headers
  Object.entries(request.headers).forEach(([key, value]) => {
    // Skip empty headers
    if (!value) return;
    // Escape single quotes and special characters in header values
    const escapedValue = value.replace(/'/g, "'\\''").replace(/\n/g, '\\n');
    curl += ` \\\n  -H '${key}: ${escapedValue}'`;
  });

  // Add body if present
  if (request.body) {
    let bodyStr = '';
    const contentType = request.headers['content-type'] || request.headers['Content-Type'];

    // Handle different content types
    if (typeof request.body === 'string') {
      bodyStr = request.body;
    } else if (contentType?.includes('application/x-www-form-urlencoded')) {
      // Handle form data
      bodyStr = new URLSearchParams(request.body as Record<string, string>).toString();
    } else {
      // Default to JSON
      bodyStr = JSON.stringify(request.body);
    }

    // Escape single quotes and special characters in body
    bodyStr = bodyStr.replace(/'/g, "'\\''").replace(/\n/g, '\\n');

    if (contentType?.includes('application/x-www-form-urlencoded')) {
      curl += ` \\\n  --data-urlencode '${bodyStr}'`;
    } else {
      curl += ` \\\n  -d '${bodyStr}'`;
    }
  }

  // Add common curl options for better compatibility
  curl += ' \\\n  --compressed'; // Add compression support
  curl += ' \\\n  --location'; // Follow redirects

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

function RequestBody({ body }: { body: unknown }) {
  if (!body) return null;

  return (
    <div>
      <span className="text-[10px] text-zinc-500">Body</span>
      <div className="bg-zinc-900 p-2 rounded-md mt-1">
        {(() => {
          try {
            const data = typeof body === 'string' ? JSON.parse(body) : body;
            return <JSONViewer data={data as Record<string, unknown>} className="text-xs" />;
          } catch (error) {
            const bodyString = String(
              typeof body === 'string' ? body : JSON.stringify(body, null, 2)
            );
            return <pre className="text-xs text-red-500">{bodyString}</pre>;
          }
        })()}
      </div>
    </div>
  );
}

function Spinner() {
  return (
    <div className="animate-spin h-3 w-3 border-2 border-zinc-500 border-t-zinc-200 rounded-full" />
  );
}

export function NetworkScreen() {
  const { requests, selectedRequestId, addRequest, selectRequest, clear } = useNetworkStore();
  const [copiedTimeout, setCopiedTimeout] = useState<NodeJS.Timeout | null>(null);
  const [isCopied, setIsCopied] = useState(false);
  const selectedRequest = selectedRequestId ? requests.find(r => r.id === selectedRequestId) : null;

  // Clear the copied timeout on unmount
  useEffect(() => {
    return () => {
      if (copiedTimeout) {
        clearTimeout(copiedTimeout);
      }
    };
  }, [copiedTimeout]);

  useEffect(() => {
    const handleNetworkRequest = (event: CustomEvent<NetworkRequest>) => {
      addRequest(event.detail);
    };

    // Listen for network request events
    window.addEventListener(
      LibToDebuggerEventType.NETWORK_REQUEST,
      handleNetworkRequest as EventListener
    );

    return () => {
      window.removeEventListener(
        LibToDebuggerEventType.NETWORK_REQUEST,
        handleNetworkRequest as EventListener
      );
    };
  }, [addRequest]);

  const handleClear = () => {
    clear();
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
              className="text-xs text-zinc-400 hover:text-zinc-200 px-3 py-1.5 rounded-md bg-zinc-800 hover:bg-zinc-700 transition-colors border border-zinc-700/50 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-zinc-800 disabled:hover:text-zinc-400 flex items-center gap-1.5"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-3.5 w-3.5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                />
              </svg>
              Clear
            </button>
          </div>
        </div>
        <div className="flex-1 overflow-auto">
          {requests.map(request => (
            <div
              key={request.id}
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
                  {new Date(request.startTime).toLocaleTimeString()}
                </div>
              </div>
              {request.response && (
                <div className="mt-1.5 flex items-center gap-2">
                  <span
                    className={cn(
                      'text-xs font-medium px-1.5 py-0.5 rounded',
                      getStatusColor(request.response.status)
                    )}
                  >
                    {request.response.status}
                  </span>
                  <span className="text-[10px] text-zinc-500">
                    {new Date(request.response.startTime).toLocaleTimeString()}
                  </span>
                  {request.response.duration && (
                    <span className="text-[10px] text-zinc-500">
                      ({request.response.duration}ms)
                    </span>
                  )}
                </div>
              )}
              {request.status === 'rejected' && (
                <div className="mt-1.5">
                  <span className="text-xs text-red-400">Request failed</span>
                </div>
              )}
              {request.status === 'pending' && (
                <div className="mt-1.5 flex items-center gap-2">
                  <Spinner />
                  <span className="text-xs text-yellow-400">Pending...</span>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {selectedRequest && (
        <div className="w-1/2 border-l border-zinc-800 flex flex-col">
          <div className="px-3 py-2 border-b border-zinc-800">
            <h2 className="text-sm font-semibold text-zinc-100">Details</h2>
            <p className="text-[10px] text-zinc-500 mt-0.5">Request information</p>
          </div>
          <div className="flex-1 p-4 overflow-auto">
            <div className="space-y-4">
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
                  <RequestBody body={selectedRequest.body} />
                </div>
              </div>

              {selectedRequest.response && (
                <div>
                  <h3 className="text-xs font-medium text-zinc-400 mb-1">Response</h3>
                  <div className="space-y-2">
                    <div>
                      <span className="text-[10px] text-zinc-500">Status</span>
                      <p className="text-xs font-mono text-zinc-200">
                        {selectedRequest.response.status}
                      </p>
                    </div>
                    <div>
                      <span className="text-[10px] text-zinc-500">Headers</span>
                      <div className="bg-zinc-900 p-2 rounded-md mt-1">
                        <JSONViewer
                          data={selectedRequest.response.headers}
                          initialExpanded={true}
                          level={0}
                          className="text-xs"
                        />
                      </div>
                    </div>
                    {selectedRequest.response.body && (
                      <div>
                        <span className="text-[10px] text-zinc-500">Body</span>
                        <div className="bg-zinc-900 p-2 rounded-md mt-1">
                          <JSONViewer
                            data={selectedRequest.response.body}
                            initialExpanded={true}
                            level={0}
                            className="text-xs"
                          />
                        </div>
                      </div>
                    )}
                    {selectedRequest.response.duration && (
                      <div>
                        <span className="text-[10px] text-zinc-500">Duration</span>
                        <p className="text-xs font-mono text-zinc-200">
                          {selectedRequest.response.duration}ms
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
