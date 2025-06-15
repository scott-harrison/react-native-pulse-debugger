import JSONViewer from '@/components/JsonViewer';
import ResizablePanel from '@/components/ResizeablePanel';
import { useNetworkStore } from '@/store/networkStore';
import useSessionStore from '@/store/sessionStore';
import { cn } from '@/utils/styling';
import { NetworkPayload, PulseEvent } from '@react-native-pulse-debugger/types';
import React, { useState } from 'react';

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

function generateCurlCommand(requestPayload: NetworkPayload): string {
    let curl = `curl '${requestPayload.url}'`;

    // Add method if not GET
    if (requestPayload.method !== 'GET') {
        curl += ` -X ${requestPayload.method}`;
    }

    // Add headers
    Object.entries(requestPayload.headers).forEach(([key, value]) => {
        // Skip empty headers
        if (!value) return;
        // Escape single quotes and special characters in header values
        const escapedValue = value.replace(/'/g, "'\\''").replace(/\n/g, '\\n');
        curl += ` \\\n  -H '${key}: ${escapedValue}'`;
    });

    // Add body if present
    if (requestPayload.body) {
        let bodyStr = '';
        const contentType =
            (requestPayload.headers as Record<string, string>)['content-type'] ||
            (requestPayload.headers as Record<string, string>)['Content-Type'];

        // Handle different content types
        if (typeof requestPayload.body === 'string') {
            bodyStr = requestPayload.body;
        } else if (contentType?.includes('application/x-www-form-urlencoded')) {
            // Handle form data
            bodyStr = new URLSearchParams(requestPayload.body as Record<string, string>).toString();
        } else {
            // Default to JSON
            bodyStr = JSON.stringify(requestPayload.body);
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

const NetworkScreen: React.FC = () => {
    const sessionId = useSessionStore(state => state.currentSessionId);
    const { requests: allRequests, clearNetworkRequestsBySessionId } = useNetworkStore(
        state => state
    );
    const [copiedTimeout, setCopiedTimeout] = useState<ReturnType<typeof setTimeout> | null>(null);
    const [isCopied, setIsCopied] = useState(false);
    const [selectedRequest, setSelectedRequest] = useState<PulseEvent<'network'> | null>(null);
    const requests = allRequests.filter(request => request.sessionId === sessionId);

    const handleClear = () => {
        if (!sessionId) return;
        setSelectedRequest(null);
        clearNetworkRequestsBySessionId(sessionId);
    };

    const handleCopyCurl = async (requestPayload: NetworkPayload) => {
        await copyToClipboard(generateCurlCommand(requestPayload));
        setIsCopied(true);

        if (copiedTimeout) {
            clearTimeout(copiedTimeout);
        }

        const timeout = setTimeout(() => {
            setIsCopied(false);
        }, 2000);

        setCopiedTimeout(timeout);
    };

    const leftPanel = (
        <>
            <div className="p-4 border-b h-15 border-zinc-800 flex items-center justify-between">
                <div>
                    <h2 className="text-sm font-semibold text-zinc-100">Network Requests</h2>
                    <p className="text-xs text-zinc-500 mt-0.5">Recent network activity</p>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={handleClear}
                        className="text-xs text-zinc-400 hover:text-zinc-200 px-3 py-1.5 cursor-pointer rounded-md bg-zinc-800 hover:bg-zinc-700 transition-colors border border-zinc-700/50 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-zinc-800 disabled:hover:text-zinc-400 flex items-center gap-1.5"
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
            <div className="flex-1 overflow-auto p-4">
                {requests.length > 0 ? (
                    requests.map(request => (
                        <div key={request.eventId} className="py-2 border-b border-zinc-800">
                            <div
                                onClick={() => setSelectedRequest(request)}
                                role="button"
                                tabIndex={0}
                                onKeyDown={e => {
                                    if (e.key === 'Enter' || e.key === ' ') {
                                        setSelectedRequest(request);
                                    }
                                }}
                                className={cn(
                                    'w-full text-left px-4 py-3 rounded transition-colors cursor-pointer',
                                    selectedRequest?.eventId === request.eventId
                                        ? 'bg-gray-700'
                                        : 'hover:bg-gray-700/20'
                                )}
                            >
                                <div className="flex items-start justify-between">
                                    <div className="flex items-center gap-2 flex-1 min-w-0">
                                        <span
                                            className={cn(
                                                'text-xs font-medium px-1.5 py-0.5 rounded shrink-0',
                                                getMethodColor(request.payload.method)
                                            )}
                                        >
                                            {request.payload.method}
                                        </span>
                                        <span className="text-xs text-zinc-300 truncate flex-1">
                                            {request.payload.url}
                                        </span>
                                    </div>
                                    <div className="text-[10px] tabular-nums text-zinc-500 shrink-0 ml-2">
                                        {new Date(request.payload.startTime).toLocaleTimeString()}
                                    </div>
                                </div>
                                {request.payload.response && (
                                    <div className="mt-1.5 flex items-center gap-2">
                                        <span
                                            className={cn(
                                                'text-xs font-medium px-1.5 py-0.5 rounded',
                                                getStatusColor(request.payload.response.status)
                                            )}
                                        >
                                            {request.payload.response.status}
                                        </span>
                                        <span className="text-[10px] text-zinc-500">
                                            {new Date(
                                                request.payload.response.startTime
                                            ).toLocaleTimeString()}
                                        </span>
                                        {request.payload.response.duration && (
                                            <span className="text-[10px] text-zinc-500">
                                                ({request.payload.response.duration}ms)
                                            </span>
                                        )}
                                    </div>
                                )}
                                {request.payload.requestStatus === 'rejected' && (
                                    <div className="mt-1.5">
                                        <span className="text-xs text-red-400">Request failed</span>
                                    </div>
                                )}
                                {request.payload.requestStatus === 'pending' && (
                                    <div className="mt-1.5 flex items-center gap-2">
                                        <div className="animate-spin h-3 w-3 border-2 border-zinc-500 border-t-zinc-200 rounded-full" />
                                        <span className="text-xs text-yellow-400">Pending...</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="text-center text-zinc-500 text-sm mt-4">
                        Waiting for network requests...
                    </div>
                )}
            </div>
        </>
    );

    const rightPanel = selectedRequest && (
        <>
            <div className="px-3 py-2 h-15 border-b border-zinc-800">
                <h2 className="text-sm font-semibold text-zinc-100">Details</h2>
                <p className="text-[10px] text-zinc-500 mt-0.5">Request information</p>
            </div>
            <div className="flex-1 p-4 overflow-auto">
                <div className="space-y-4">
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <h3 className="text-xs font-medium text-zinc-400">Request</h3>
                            <button
                                onClick={() => handleCopyCurl(selectedRequest.payload)}
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
                                <p className="text-xs font-mono text-zinc-200">
                                    {selectedRequest.payload.method}
                                </p>
                            </div>
                            <div>
                                <span className="text-[10px] text-zinc-500">URL</span>
                                <p className="text-xs font-mono text-zinc-200 break-all">
                                    {selectedRequest.payload.url}
                                </p>
                            </div>
                            {typeof selectedRequest.payload.headers === 'object' &&
                                Object.keys(selectedRequest.payload.headers).length > 0 && (
                                    <div>
                                        <span className="text-[10px] text-zinc-500">Headers</span>
                                        <div className="bg-zinc-900 p-2 rounded-md mt-1">
                                            <JSONViewer data={selectedRequest.payload.headers} />
                                        </div>
                                    </div>
                                )}

                            {selectedRequest.payload.body && (
                                <div>
                                    <span className="text-[10px] text-zinc-500">Body</span>
                                    <div className="bg-zinc-900 p-2 rounded-md mt-1">
                                        {(() => {
                                            try {
                                                const data =
                                                    typeof selectedRequest.payload.body === 'string'
                                                        ? JSON.parse(selectedRequest.payload.body)
                                                        : selectedRequest.payload.body;
                                                return <JSONViewer data={data} />;
                                            } catch (error) {
                                                const bodyString = String(
                                                    typeof selectedRequest.payload.body === 'string'
                                                        ? selectedRequest.payload.body
                                                        : JSON.stringify(
                                                              selectedRequest.payload.body,
                                                              null,
                                                              2
                                                          )
                                                );
                                                return (
                                                    <pre className="text-xs text-red-500">
                                                        {bodyString}
                                                    </pre>
                                                );
                                            }
                                        })()}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {selectedRequest.payload.response && (
                        <div>
                            <h3 className="text-xs font-medium text-zinc-400 mb-1">Response</h3>
                            <div className="space-y-2">
                                <div>
                                    <span className="text-[10px] text-zinc-500">Status</span>
                                    <p className="text-xs font-mono text-zinc-200">
                                        {selectedRequest.payload.response.status}
                                    </p>
                                </div>
                                {(() => {
                                    const headers = selectedRequest?.payload?.response?.headers;
                                    if (
                                        !headers ||
                                        (typeof headers === 'object' &&
                                            Object.keys(headers).length === 0)
                                    ) {
                                        return null;
                                    }
                                    return (
                                        <div>
                                            <span className="text-[10px] text-zinc-500">
                                                Headers
                                            </span>
                                            <div className="bg-zinc-900 p-2 rounded-md mt-1">
                                                <JSONViewer data={headers} />
                                            </div>
                                        </div>
                                    );
                                })()}
                                {(() => {
                                    const body = selectedRequest?.payload?.response?.body;
                                    if (!body) return null;

                                    let data;
                                    if (typeof body === 'string') {
                                        try {
                                            data = JSON.parse(body);
                                        } catch {
                                            return (
                                                <div>
                                                    <span className="text-[10px] text-zinc-500">
                                                        Body
                                                    </span>
                                                    <div className="bg-zinc-900 p-2 rounded-md mt-1 overflow-x-auto">
                                                        <pre className="text-xs text-zinc-200">
                                                            {body}
                                                        </pre>
                                                    </div>
                                                </div>
                                            );
                                        }
                                    } else {
                                        data = body;
                                    }

                                    // Don't render if empty object
                                    if (
                                        data &&
                                        typeof data === 'object' &&
                                        Object.keys(data).length === 0
                                    ) {
                                        return null;
                                    }

                                    return (
                                        <div>
                                            <span className="text-[10px] text-zinc-500">Body</span>
                                            <div className="bg-zinc-900 p-2 rounded-md mt-1">
                                                <JSONViewer data={data} />
                                            </div>
                                        </div>
                                    );
                                })()}
                                {selectedRequest.payload.response.duration && (
                                    <div>
                                        <span className="text-[10px] text-zinc-500">Duration</span>
                                        <p className="text-xs font-mono text-zinc-200">
                                            {selectedRequest.payload.response.duration}ms
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </>
    );

    return (
        <div className="flex flex-1 h-full overflow-y-auto bg-gray-900/80">
            <ResizablePanel
                leftPanel={leftPanel}
                rightPanel={rightPanel}
                minLeftPanelWidth={400}
                maxLeftPanelWidth={800}
            />
        </div>
    );
};

export default NetworkScreen;
