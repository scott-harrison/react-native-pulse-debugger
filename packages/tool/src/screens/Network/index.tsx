import JSONViewer from '@/components/JsonViewer';
import Modal from '@/components/modal';
import ResizablePanel from '@/components/ResizeablePanel';
import { useNetworkStore } from '@/store/networkStore';
import useSessionStore from '@/store/sessionStore';
import { cn } from '@/utils/styling';
import { JSONValue, NetworkPayload, PulseEvent } from '@react-native-pulse-debugger/types';
import { Network } from 'lucide-react';
import React, { useState, useMemo } from 'react';

const getMethodColor = (method: string) => {
    switch (method) {
        case 'GET':
            return 'bg-blue-300/20 text-blue-300 border-blue-300/30';
        case 'POST':
            return 'bg-emerald-300/20 text-emerald-300 border-emerald-300/30';
        case 'PUT':
            return 'bg-amber-300/20 text-amber-300 border-amber-300/30';
        case 'DELETE':
            return 'bg-rose-300/20 text-rose-300 border-rose-300/30';
        case 'PATCH':
            return 'bg-purple-300/20 text-purple-300 border-purple-300/30';
        case 'HEAD':
            return 'bg-slate-300/20 text-slate-300 border-slate-300/30';
        case 'OPTIONS':
            return 'bg-indigo-300/20 text-indigo-300 border-indigo-300/30';
        default:
            return 'bg-zinc-300/20 text-zinc-300 border-zinc-300/30';
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
        } else if (contentType.includes('application/x-www-form-urlencoded')) {
            // Handle form data
            bodyStr = new URLSearchParams(requestPayload.body as Record<string, string>).toString();
        } else {
            // Default to JSON
            bodyStr = JSON.stringify(requestPayload.body);
        }

        // Escape single quotes and special characters in body
        bodyStr = bodyStr.replace(/'/g, "'\\''").replace(/\n/g, '\\n');

        if (contentType.includes('application/x-www-form-urlencoded')) {
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

    // Filter state
    const [filters, setFilters] = useState({
        method: '',
        status: '',
        url: '',
        showPending: true,
        showCompleted: true,
        showFailed: true,
    });

    // URL blacklist state
    const [urlBlacklist, setUrlBlacklist] = useState<string[]>([]);
    const [blacklistInput, setBlacklistInput] = useState('');
    const [isBlacklistModalOpen, setIsBlacklistModalOpen] = useState(false);
    const [isFiltersCollapsed, setIsFiltersCollapsed] = useState(true);

    const allSessionRequests = allRequests
        .filter(request => request.sessionId === sessionId)
        .sort((a, b) => b.payload.startTime - a.payload.startTime);

    // Apply filters
    const requests = useMemo(() => {
        return allSessionRequests.filter(request => {
            // URL blacklist filter
            if (
                urlBlacklist.some(blacklistedUrl =>
                    request.payload.url.toLowerCase().includes(blacklistedUrl.toLowerCase())
                )
            ) {
                return false;
            }

            // Method filter
            if (filters.method && request.payload.method !== filters.method) {
                return false;
            }

            // Status filter
            if (filters.status && request.payload.response?.status !== parseInt(filters.status)) {
                return false;
            }

            // URL filter
            if (
                filters.url &&
                !request.payload.url.toLowerCase().includes(filters.url.toLowerCase())
            ) {
                return false;
            }

            // Status type filters
            if (request.payload.requestStatus === 'pending' && !filters.showPending) {
                return false;
            }
            if (request.payload.requestStatus === 'fulfilled' && !filters.showCompleted) {
                return false;
            }
            if (request.payload.requestStatus === 'rejected' && !filters.showFailed) {
                return false;
            }

            return true;
        });
    }, [allSessionRequests, filters, urlBlacklist]);

    // Get unique methods and statuses for filter options
    const uniqueMethods = useMemo(() => {
        const methods = new Set(allSessionRequests.map(req => req.payload.method));
        return Array.from(methods).sort();
    }, [allSessionRequests]);

    const uniqueStatuses = useMemo(() => {
        const statuses = new Set(
            allSessionRequests
                .map(req => req.payload.response?.status)
                .filter((status): status is number => status !== undefined)
        );
        return Array.from(statuses).sort((a, b) => a - b);
    }, [allSessionRequests]);

    const handleClear = () => {
        if (!sessionId) return;
        setSelectedRequest(null);
        clearNetworkRequestsBySessionId(sessionId);
    };

    const handleClearFilters = () => {
        setFilters({
            method: '',
            status: '',
            url: '',
            showPending: true,
            showCompleted: true,
            showFailed: true,
        });
    };

    const handleAddToBlacklist = () => {
        if (blacklistInput.trim() && !urlBlacklist.includes(blacklistInput.trim())) {
            setUrlBlacklist(prev => [...prev, blacklistInput.trim()]);
            setBlacklistInput('');
        }
    };

    const handleRemoveFromBlacklist = (urlToRemove: string) => {
        setUrlBlacklist(prev => prev.filter(url => url !== urlToRemove));
    };

    const handleClearBlacklist = () => {
        setUrlBlacklist([]);
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
            <div className="px-4 py-3 border-b border-zinc-800 bg-gradient-to-r from-zinc-900/50 to-zinc-800/30">
                <div className="flex items-center justify-between min-w-0">
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                        <div className="p-1.5 bg-blue-500/10 rounded-lg flex-shrink-0">
                            <Network className={`w-4 h-4 text-blue-400`} />
                        </div>
                        <div className="min-w-0 flex-1">
                            <h2 className="text-sm font-semibold text-zinc-100 truncate">
                                Network Requests
                            </h2>
                            <p className="text-xs text-zinc-400 mt-0.5 truncate">
                                {requests.length} of {allSessionRequests.length} requests
                                {requests.length !== allSessionRequests.length && (
                                    <span className="text-blue-400 ml-1">• filtered</span>
                                )}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                        <button
                            onClick={handleClear}
                            className="text-xs text-zinc-400 hover:text-zinc-200 px-2 py-1.5 cursor-pointer rounded-md bg-zinc-800/50 hover:bg-zinc-700/50 transition-all duration-200 border border-zinc-700/50 hover:border-zinc-600/50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
                        >
                            <svg
                                className="w-3.5 h-3.5"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                />
                            </svg>
                            <span className="hidden sm:inline">Clear All</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Filters Section */}
            <div className="border-b border-zinc-800 bg-gradient-to-b from-purple-900/20 to-purple-800/5">
                {/* Filters Header */}
                <div className="p-4 border-b border-zinc-700/50">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-1.5 bg-purple-500/10 rounded-md">
                                <svg
                                    className="w-4 h-4 text-purple-400"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.207A1 1 0 013 6.5V4z"
                                    />
                                </svg>
                            </div>
                            <h3 className="text-sm font-medium text-zinc-200">Filters</h3>
                            {(filters.method ||
                                filters.status ||
                                filters.url ||
                                !filters.showPending ||
                                !filters.showCompleted ||
                                !filters.showFailed ||
                                urlBlacklist.length > 0) && (
                                <span className="text-xs bg-purple-500/20 text-purple-400 px-2 py-0.5 rounded-full font-medium">
                                    Active
                                </span>
                            )}
                        </div>
                        <button
                            onClick={() => setIsFiltersCollapsed(!isFiltersCollapsed)}
                            className="text-zinc-400 hover:text-zinc-200 p-1.5 rounded-md hover:bg-zinc-700/30 transition-all duration-200"
                        >
                            <svg
                                className={`w-4 h-4 transition-transform duration-200 ${isFiltersCollapsed ? 'rotate-180' : ''}`}
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M19 9l-7 7-7-7"
                                />
                            </svg>
                        </button>
                    </div>
                </div>

                {/* Filters Content */}
                {!isFiltersCollapsed && (
                    <div className="p-6 space-y-4">
                        {/* Method and Status filters */}
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-xs font-medium text-zinc-400 mb-2">
                                    Method
                                </label>
                                <div className="relative">
                                    <select
                                        value={filters.method}
                                        onChange={e =>
                                            setFilters(prev => ({
                                                ...prev,
                                                method: e.target.value,
                                            }))
                                        }
                                        className="w-full text-sm bg-gradient-to-r from-zinc-800/80 to-zinc-700/80 border border-zinc-600/50 rounded-lg px-3 py-2.5 pr-8 text-zinc-200 focus:outline-none focus:border-zinc-500 focus:ring-2 focus:ring-zinc-500/50 transition-all duration-200 appearance-none cursor-pointer hover:border-zinc-500/50"
                                    >
                                        <option value="" className="bg-zinc-800 text-zinc-200">
                                            All Methods
                                        </option>
                                        {uniqueMethods.map(method => (
                                            <option
                                                key={method}
                                                value={method}
                                                className="bg-zinc-800 text-zinc-200"
                                            >
                                                {method}
                                            </option>
                                        ))}
                                    </select>
                                    <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                                        <svg
                                            className="w-4 h-4 text-zinc-400"
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M19 9l-7 7-7-7"
                                            />
                                        </svg>
                                    </div>
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-zinc-400 mb-2">
                                    Status
                                </label>
                                <div className="relative">
                                    <select
                                        value={filters.status}
                                        onChange={e =>
                                            setFilters(prev => ({
                                                ...prev,
                                                status: e.target.value,
                                            }))
                                        }
                                        className="w-full text-sm bg-gradient-to-r from-zinc-800/80 to-zinc-700/80 border border-zinc-600/50 rounded-lg px-3 py-2.5 pr-8 text-zinc-200 focus:outline-none focus:border-zinc-500 focus:ring-2 focus:ring-zinc-500/50 transition-all duration-200 appearance-none cursor-pointer hover:border-zinc-500/50"
                                    >
                                        <option value="" className="bg-zinc-800 text-zinc-200">
                                            All Statuses
                                        </option>
                                        {uniqueStatuses.map(status => (
                                            <option
                                                key={status}
                                                value={status}
                                                className="bg-zinc-800 text-zinc-200"
                                            >
                                                {status}
                                            </option>
                                        ))}
                                    </select>
                                    <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                                        <svg
                                            className="w-4 h-4 text-zinc-400"
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M19 9l-7 7-7-7"
                                            />
                                        </svg>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* URL filter */}
                        <div>
                            <label className="block text-xs font-medium text-zinc-400 mb-2">
                                URL Pattern
                            </label>
                            <input
                                type="text"
                                placeholder="Filter by URL content..."
                                value={filters.url}
                                onChange={e =>
                                    setFilters(prev => ({ ...prev, url: e.target.value }))
                                }
                                className="w-full text-sm bg-gradient-to-r from-zinc-800/80 to-zinc-700/80 border border-zinc-600/50 rounded-lg px-3 py-2.5 text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-zinc-500 focus:ring-2 focus:ring-zinc-500/50 transition-all duration-200 hover:border-zinc-500/50"
                            />
                        </div>

                        {/* Status type toggles */}
                        <div>
                            <label className="block text-xs font-medium text-zinc-400 mb-3">
                                Request Status
                            </label>
                            <div className="flex gap-4">
                                <label className="flex items-center gap-2 text-sm text-zinc-300 cursor-pointer group">
                                    <input
                                        type="checkbox"
                                        checked={filters.showPending}
                                        onChange={e =>
                                            setFilters(prev => ({
                                                ...prev,
                                                showPending: e.target.checked,
                                            }))
                                        }
                                        className="w-4 h-4 text-yellow-600 bg-zinc-800 border-zinc-700 rounded focus:ring-yellow-500 focus:ring-2 transition-all duration-200"
                                    />
                                    <span className="group-hover:text-zinc-200 transition-colors">
                                        Pending
                                    </span>
                                </label>
                                <label className="flex items-center gap-2 text-sm text-zinc-300 cursor-pointer group">
                                    <input
                                        type="checkbox"
                                        checked={filters.showCompleted}
                                        onChange={e =>
                                            setFilters(prev => ({
                                                ...prev,
                                                showCompleted: e.target.checked,
                                            }))
                                        }
                                        className="w-4 h-4 text-green-600 bg-zinc-800 border-zinc-700 rounded focus:ring-green-500 focus:ring-2 transition-all duration-200"
                                    />
                                    <span className="group-hover:text-zinc-200 transition-colors">
                                        Completed
                                    </span>
                                </label>
                                <label className="flex items-center gap-2 text-sm text-zinc-300 cursor-pointer group">
                                    <input
                                        type="checkbox"
                                        checked={filters.showFailed}
                                        onChange={e =>
                                            setFilters(prev => ({
                                                ...prev,
                                                showFailed: e.target.checked,
                                            }))
                                        }
                                        className="w-4 h-4 text-red-600 bg-zinc-800 border-zinc-700 rounded focus:ring-red-500 focus:ring-2 transition-all duration-200"
                                    />
                                    <span className="group-hover:text-zinc-200 transition-colors">
                                        Failed
                                    </span>
                                </label>
                            </div>
                        </div>

                        {/* Buttons */}
                        <div className="border-t border-zinc-700/50 pt-4">
                            {urlBlacklist.length > 0 && (
                                <div className="text-xs text-zinc-500 bg-zinc-800/50 px-2 py-1 rounded-md mb-4 inline-block">
                                    {urlBlacklist.length} rule in blacklist
                                </div>
                            )}
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={handleClearFilters}
                                        className="text-sm text-zinc-400 hover:text-zinc-200 px-3 py-1.5 cursor-pointer rounded-lg bg-zinc-800/50 hover:bg-zinc-700/50 transition-all duration-200 border border-zinc-700/50 hover:border-zinc-600/50 flex items-center gap-2"
                                    >
                                        <svg
                                            className="w-3.5 h-3.5"
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.207A1 1 0 013 6.5V4z"
                                            />
                                        </svg>
                                        Clear
                                    </button>
                                    <button
                                        onClick={() => setIsBlacklistModalOpen(true)}
                                        className="text-sm text-zinc-400 hover:text-zinc-200 px-3 py-1.5 cursor-pointer rounded-lg bg-zinc-800/50 hover:bg-zinc-700/50 transition-all duration-200 border border-zinc-700/50 hover:border-zinc-600/50 flex items-center gap-2"
                                    >
                                        <svg
                                            className="w-3 h-3"
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                                            />
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                                            />
                                        </svg>
                                        Manage Blacklist
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <div className="flex-1 overflow-auto p-6">
                {requests.length > 0 ? (
                    <div className="space-y-2">
                        {requests.map(request => (
                            <div
                                key={request.eventId}
                                onClick={() => {
                                    setSelectedRequest(request);
                                }}
                                role="button"
                                tabIndex={0}
                                onKeyDown={e => {
                                    if (e.key === 'Enter' || e.key === ' ') {
                                        setSelectedRequest(request);
                                    }
                                }}
                                className={cn(
                                    'w-full text-left p-4 rounded-lg transition-all duration-200 cursor-pointer border border-transparent',
                                    selectedRequest?.eventId === request.eventId
                                        ? 'bg-zinc-800/80 border-zinc-600/50 shadow-lg'
                                        : 'hover:bg-zinc-800/40 hover:border-zinc-700/50'
                                )}
                            >
                                <div className="flex items-start justify-between mb-2">
                                    <div className="flex items-center gap-3 flex-1 min-w-0">
                                        <span
                                            className={cn(
                                                'text-xs font-semibold px-2 py-1 rounded-md shrink-0 border',
                                                getMethodColor(request.payload.method)
                                            )}
                                        >
                                            {request.payload.method}
                                        </span>
                                        <span className="text-sm text-zinc-200 truncate flex-1 font-mono">
                                            {request.payload.url}
                                        </span>
                                    </div>
                                    <div className="text-xs tabular-nums text-zinc-500 shrink-0 ml-3">
                                        {new Date(request.payload.startTime).toLocaleTimeString()}
                                    </div>
                                </div>

                                {request.payload.response && (
                                    <div className="flex items-center gap-3">
                                        <span
                                            className={cn(
                                                'text-xs font-semibold px-2 py-1 rounded-md border',
                                                getStatusColor(request.payload.response.status)
                                            )}
                                        >
                                            {request.payload.response.status}
                                        </span>
                                        <span className="text-xs text-zinc-500">
                                            {new Date(
                                                request.payload.response.startTime
                                            ).toLocaleTimeString()}
                                        </span>
                                        {request.payload.response.duration && (
                                            <span className="text-xs text-zinc-500 bg-zinc-800/50 px-2 py-0.5 rounded">
                                                {request.payload.response.duration}ms
                                            </span>
                                        )}
                                    </div>
                                )}

                                {request.payload.requestStatus === 'rejected' && (
                                    <div className="flex items-center gap-2 mt-2">
                                        <div className="w-2 h-2 bg-red-400 rounded-full"></div>
                                        <span className="text-xs text-red-400 font-medium">
                                            Request failed
                                        </span>
                                    </div>
                                )}

                                {request.payload.requestStatus === 'pending' && (
                                    <div className="flex items-center gap-2 mt-2">
                                        <div className="animate-spin h-3 w-3 border-2 border-yellow-500 border-t-transparent rounded-full" />
                                        <span className="text-xs text-yellow-400 font-medium">
                                            Pending...
                                        </span>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-12">
                        <div className="p-4 bg-zinc-800/30 rounded-lg border border-zinc-700/50 max-w-sm mx-auto">
                            <Network
                                className={`w-10 h-10 text-zinc-400 mb-2 mx-auto ${allSessionRequests.length === 0 ? 'animate-pulse' : ''}`}
                            />
                            <p className="text-sm text-zinc-400 mb-1">
                                {allSessionRequests.length === 0
                                    ? 'Waiting for network requests...'
                                    : 'No requests match the current filters'}
                            </p>
                            {allSessionRequests.length > 0 && (
                                <p className="text-xs text-zinc-500">Try adjusting your filters</p>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </>
    );

    const rightPanel = selectedRequest && (
        <>
            <div className="px-4 py-3 border-b border-zinc-800 bg-gradient-to-r from-zinc-900/50 to-zinc-800/30">
                <div className="flex items-center gap-2 min-w-0">
                    <div className="p-1.5 bg-green-500/10 rounded-lg flex-shrink-0">
                        <svg
                            className="w-4 h-4 text-green-400"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                            />
                        </svg>
                    </div>
                    <div className="min-w-0 flex-1">
                        <h2 className="text-sm font-semibold text-zinc-100 truncate">
                            Request Details
                        </h2>
                        <p className="text-xs text-zinc-400 mt-0.5 truncate">
                            Complete request and response information
                        </p>
                    </div>
                </div>
            </div>
            <div className="flex-1 p-6 overflow-auto">
                <div className="space-y-6">
                    <div>
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2">
                                <div className="p-1.5 bg-blue-500/10 rounded-md">
                                    <svg
                                        className="w-4 h-4 text-blue-400"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M13 10V3L4 14h7v7l9-11h-7z"
                                        />
                                    </svg>
                                </div>
                                <h3 className="text-sm font-semibold text-zinc-200">Request</h3>
                            </div>
                            <button
                                onClick={() => handleCopyCurl(selectedRequest.payload)}
                                className={cn(
                                    'text-sm px-3 py-1.5 rounded-lg transition-all duration-200 flex items-center gap-2',
                                    isCopied
                                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                        : 'bg-zinc-800/50 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-700/50 border border-zinc-700/50 hover:border-zinc-600/50'
                                )}
                            >
                                <svg
                                    className="w-4 h-4"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                                    />
                                </svg>
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
                                            <JSONViewer
                                                data={selectedRequest.payload.headers as JSONValue}
                                            />
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
                                    const headers = selectedRequest.payload.response.headers;
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
                                    const body = selectedRequest.payload.response.body;
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
            <div className="flex flex-col flex-1 min-w-0">
                <ResizablePanel
                    leftPanel={leftPanel}
                    rightPanel={rightPanel}
                    minLeftPanelWidth={400}
                    maxLeftPanelWidth={800}
                />
            </div>

            {/* URL Blacklist Modal */}
            <Modal isOpen={isBlacklistModalOpen} onClose={() => setIsBlacklistModalOpen(false)}>
                <div className="bg-gradient-to-br from-zinc-900/95 to-zinc-800/95 border border-zinc-600/50 rounded-2xl shadow-2xl max-h-[85vh] overflow-hidden backdrop-blur-xl">
                    <div className="p-8 border-b border-zinc-600/40 bg-gradient-to-r from-zinc-900/80 to-zinc-800/80">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-bold text-zinc-100 bg-gradient-to-r from-zinc-100 to-zinc-300 bg-clip-text text-transparent">
                                URL Blacklist
                            </h2>
                            <button
                                onClick={() => setIsBlacklistModalOpen(false)}
                                className="text-zinc-400 hover:text-zinc-200 p-2 rounded-lg transition-all duration-200 cursor-pointer hover:bg-zinc-700/50"
                            >
                                <svg
                                    className="w-6 h-6"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M6 18L18 6M6 6l12 12"
                                    />
                                </svg>
                            </button>
                        </div>
                        <p className="text-sm text-zinc-400">
                            Block URLs containing these patterns from appearing in the network
                            requests
                        </p>
                    </div>

                    <div className="p-8 overflow-auto max-h-[60vh]">
                        {/* Add to blacklist */}
                        <div className="mb-8">
                            <label className="block text-sm font-semibold text-zinc-200 mb-3">
                                Add URL Pattern
                            </label>
                            <div className="flex gap-3">
                                <input
                                    type="text"
                                    placeholder="e.g., analytics, googleapis.com, /api/metrics"
                                    value={blacklistInput}
                                    onChange={e => setBlacklistInput(e.target.value)}
                                    onKeyDown={e => {
                                        if (e.key === 'Enter') {
                                            handleAddToBlacklist();
                                        }
                                    }}
                                    className="flex-1 bg-gradient-to-r from-zinc-800/80 to-zinc-700/80 border border-zinc-600/50 rounded-lg px-4 py-3 text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-zinc-500 focus:ring-2 focus:ring-zinc-500/50 transition-all duration-200"
                                />
                                <button
                                    onClick={handleAddToBlacklist}
                                    disabled={!blacklistInput.trim()}
                                    className="px-6 py-3 text-sm text-zinc-300 hover:text-zinc-100 cursor-pointer rounded-lg bg-gradient-to-r from-zinc-800/80 to-zinc-700/80 hover:from-zinc-700/90 hover:to-zinc-600/90 transition-all duration-200 border border-zinc-600/50 hover:border-zinc-500/50 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg font-medium"
                                >
                                    Add
                                </button>
                            </div>
                        </div>

                        {/* Blacklist items */}
                        <div>
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-base font-bold text-zinc-200">
                                    Blocked Patterns ({urlBlacklist.length})
                                </h3>
                                {urlBlacklist.length > 0 && (
                                    <button
                                        onClick={handleClearBlacklist}
                                        className="text-sm text-red-400 hover:text-red-300 px-4 py-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 transition-all duration-200 border border-red-500/20 hover:border-red-500/30"
                                    >
                                        Clear All
                                    </button>
                                )}
                            </div>

                            {urlBlacklist.length > 0 ? (
                                <div className="space-y-3 max-h-64 overflow-y-auto">
                                    {urlBlacklist.map(url => (
                                        <div
                                            key={url}
                                            className="flex items-center justify-between bg-gradient-to-r from-zinc-800/60 to-zinc-700/60 rounded-lg px-4 py-3 border border-zinc-600/40 hover:border-zinc-500/50 transition-all duration-200"
                                        >
                                            <span className="text-sm text-zinc-200 flex-1 font-mono">
                                                {url}
                                            </span>
                                            <button
                                                onClick={() => handleRemoveFromBlacklist(url)}
                                                className="text-red-400 hover:text-red-300 ml-4 p-2 rounded-lg hover:bg-red-500/10 transition-all duration-200"
                                            >
                                                <svg
                                                    className="w-4 h-4"
                                                    fill="none"
                                                    stroke="currentColor"
                                                    viewBox="0 0 24 24"
                                                >
                                                    <path
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                        strokeWidth={2}
                                                        d="M6 18L18 6M6 6l12 12"
                                                    />
                                                </svg>
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-12">
                                    <div className="w-16 h-16 bg-zinc-800/50 rounded-full flex items-center justify-center mb-4 mx-auto">
                                        <svg
                                            className="w-8 h-8 text-zinc-500"
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={1.5}
                                                d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728L18.364 5.636M5.636 18.364l12.728-12.728"
                                            />
                                        </svg>
                                    </div>
                                    <h4 className="text-sm font-medium text-zinc-300 mb-2">
                                        No blocked patterns yet
                                    </h4>
                                    <p className="text-xs text-zinc-500">
                                        Add patterns above to hide matching URLs
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default NetworkScreen;
