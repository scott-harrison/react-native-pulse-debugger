import React, { useState } from 'react';
import ResizablePanel from '@/components/ResizeablePanel';
import JSONViewer from '@/components/JsonViewer';
import Modal from '@/components/modal';
import { useReduxStore } from '@/store/reduxStore';
import useSessionStore from '@/store/sessionStore';
import { JSONValue, PulseEvent } from '@react-native-pulse-debugger/types';
import { cn } from '@/utils/styling';
import { Trash2, Clock, Zap, Database, ExternalLink } from 'lucide-react';

const ReduxScreen: React.FC = () => {
    const sessionId = useSessionStore(state => state.currentSessionId);
    const { states, actions, clearReduxBySessionId } = useReduxStore(state => state);
    const reduxState = states.find(a => a.sessionId === sessionId);
    const reduxActions = actions
        .filter(a => a.sessionId === sessionId)
        .sort((a, b) => b.timestamp - a.timestamp);

    const [selectedAction, setSelectedAction] = useState<PulseEvent<'redux'> | null>(null);
    const [expandedAction, setExpandedAction] = useState<PulseEvent<'redux'> | null>(null);
    const [isJsonExpanded, setIsJsonExpanded] = useState<boolean>(true);

    const handleClearActions = () => {
        if (!sessionId) return;
        clearReduxBySessionId(sessionId);
        setSelectedAction(null);
        setExpandedAction(null);
    };

    const handleExpandAction = (action: PulseEvent<'redux'>) => {
        setExpandedAction(action);
        setIsJsonExpanded(true);
    };

    const handleCloseModal = () => {
        setExpandedAction(null);
        setIsJsonExpanded(true);
    };

    const handleToggleJsonExpansion = () => {
        setIsJsonExpanded(!isJsonExpanded);
    };

    const getActionTypeColor = (actionType: string) => {
        if (actionType.includes('increment'))
            return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
        if (actionType.includes('decrement')) return 'bg-red-500/20 text-red-400 border-red-500/30';
        if (actionType.includes('async')) return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
        if (actionType.includes('complex'))
            return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
        return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
    };

    const formatActionType = (actionType: string): string => {
        const parts = actionType.split('/');
        return parts[parts.length - 1] || actionType;
    };

    const getSliceName = (actionType: string): string => {
        const parts = actionType.split('/');
        return parts[0] || 'unknown';
    };

    const formatTimestamp = (timestamp: number): string => {
        const date = new Date(timestamp);
        const now = new Date();
        const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

        if (diffInMinutes < 1) return 'Just now';
        if (diffInMinutes < 60) return `${diffInMinutes}m ago`;

        const diffInHours = Math.floor(diffInMinutes / 60);
        if (diffInHours < 24) return `${diffInHours}h ago`;

        return date.toLocaleDateString();
    };

    return (
        <div className="flex flex-1 h-full overflow-y-auto bg-gray-900/80">
            <div className="flex flex-col flex-1 min-w-0">
                <div className="p-4 border-b h-15 border-zinc-800 flex items-center justify-between min-w-0">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div className="p-2 bg-purple-500/20 rounded-lg flex-shrink-0">
                            <Database className="w-5 h-5 text-purple-400" />
                        </div>
                        <div className="min-w-0 flex-1">
                            <h2 className="text-sm font-semibold text-zinc-100 truncate">Redux</h2>
                            <p className="text-xs text-zinc-500 mt-0.5 truncate">
                                State and actions monitoring
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={handleClearActions}
                        disabled={reduxActions.length < 1}
                        className="text-xs text-zinc-400 hover:text-zinc-200 px-3 py-1.5 rounded-md cursor-pointer bg-zinc-800 hover:bg-zinc-700 transition-colors border border-zinc-700/50 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-zinc-800 disabled:hover:text-zinc-400 flex items-center gap-1.5 flex-shrink-0"
                    >
                        <Trash2 className="h-3.5 w-3.5" />
                        <span className="hidden sm:inline">Clear</span>
                    </button>
                </div>

                <ResizablePanel
                    leftPanel={
                        <div className="h-full bg-gray-900/50 p-4 min-w-0">
                            <div className="flex items-center justify-between mb-6 min-w-0">
                                <h3 className="text-sm font-semibold text-zinc-100 flex items-center gap-2 min-w-0 flex-1">
                                    <Zap className="w-4 h-4 text-purple-400 flex-shrink-0" />
                                    <span className="truncate">Actions</span>
                                </h3>
                                <span className="text-xs text-zinc-500 bg-zinc-800 px-2 py-1 rounded-full flex-shrink-0">
                                    {reduxActions.length}
                                </span>
                            </div>

                            <div className="space-y-3 min-w-0">
                                {reduxActions.length > 0 ? (
                                    reduxActions.map(action => (
                                        <div
                                            key={action.eventId}
                                            className={cn(
                                                'group relative bg-zinc-800/50 border border-zinc-700/50 rounded-lg overflow-hidden transition-all duration-200 hover:border-zinc-600/50 hover:bg-zinc-800/70 min-w-0',
                                                selectedAction?.eventId === action.eventId &&
                                                    'border-purple-500/50 bg-purple-500/10'
                                            )}
                                        >
                                            <div
                                                onClick={() => {
                                                    setSelectedAction(action);
                                                }}
                                                className="p-4 cursor-pointer min-w-0"
                                            >
                                                <div className="flex items-start justify-between mb-3 min-w-0">
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex flex-wrap items-center gap-2 mb-2 min-w-0">
                                                            <span className="text-xs text-zinc-500 bg-zinc-800/50 px-2 py-1 rounded flex-shrink-0">
                                                                {getSliceName(
                                                                    action.payload.action.type
                                                                )}
                                                            </span>
                                                            <span
                                                                className={cn(
                                                                    'px-2 py-1 text-xs font-medium rounded-md border flex-shrink-0 max-w-48',
                                                                    getActionTypeColor(
                                                                        action.payload.action.type
                                                                    )
                                                                )}
                                                                title={formatActionType(
                                                                    action.payload.action.type
                                                                )}
                                                            >
                                                                <span className="block truncate">
                                                                    {formatActionType(
                                                                        action.payload.action.type
                                                                    )}
                                                                </span>
                                                            </span>
                                                        </div>
                                                        <div className="flex items-center gap-2 text-xs text-zinc-400 min-w-0">
                                                            <Clock className="w-3 h-3 flex-shrink-0" />
                                                            <span className="truncate">
                                                                {formatTimestamp(action.timestamp)}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <div className="flex-shrink-0 ml-3 flex items-center gap-2">
                                                        <button
                                                            onClick={e => {
                                                                e.stopPropagation();
                                                                handleExpandAction(action);
                                                            }}
                                                            className="p-1.5 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-700/50 rounded transition-colors opacity-0 group-hover:opacity-100 cursor-pointer"
                                                            title="Expand action details"
                                                        >
                                                            <ExternalLink className="w-3.5 h-3.5" />
                                                        </button>
                                                        <div className="w-2 h-2 bg-purple-400 rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
                                                    </div>
                                                </div>
                                            </div>

                                            {selectedAction?.eventId === action.eventId && (
                                                <div className="border-t border-zinc-700/50 bg-zinc-900/50 p-4 min-w-0">
                                                    <div className="flex items-center gap-2 mb-3 min-w-0">
                                                        <h4 className="text-xs font-medium text-zinc-300 flex-shrink-0">
                                                            Action Details
                                                        </h4>
                                                        <div className="flex-1 h-px bg-zinc-700/50" />
                                                    </div>
                                                    <div className="bg-zinc-900/30 rounded-lg p-3 border border-zinc-700/30 min-w-0 overflow-hidden">
                                                        <div className="overflow-auto max-h-96">
                                                            <JSONViewer
                                                                data={
                                                                    selectedAction.payload
                                                                        .action as JSONValue
                                                                }
                                                                defaultExpanded={false}
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    ))
                                ) : (
                                    <div className="flex flex-col items-center justify-center py-12 text-center min-w-0">
                                        <div className="w-16 h-16 bg-zinc-800/50 rounded-full flex items-center justify-center mb-4 flex-shrink-0">
                                            <Zap className="w-8 h-8 text-zinc-500" />
                                        </div>
                                        <h4 className="text-sm font-medium text-zinc-300 mb-2 truncate">
                                            No actions recorded
                                        </h4>
                                        <p className="text-xs text-zinc-500 max-w-xs truncate">
                                            Actions will appear here when you dispatch Redux actions
                                            in your app
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                    }
                    rightPanel={
                        <div className="h-full bg-gray-900/30 p-4 min-w-0">
                            <div className="flex items-center gap-2 mb-6 min-w-0">
                                <h3 className="text-sm font-semibold text-zinc-100 flex-shrink-0">
                                    State
                                </h3>
                                {reduxState?.state !== undefined && (
                                    <span className="text-xs text-zinc-500 bg-zinc-800 px-2 py-1 rounded-full flex-shrink-0">
                                        Live
                                    </span>
                                )}
                            </div>
                            <div className="space-y-2 min-w-0">
                                <div className="text-xs text-zinc-400 min-w-0">
                                    {reduxState?.state ? (
                                        <div className="bg-zinc-900/30 rounded-lg p-3 border border-zinc-700/30 min-w-0 overflow-hidden">
                                            <div className="overflow-auto max-h-96">
                                                <JSONViewer
                                                    data={reduxState.state as JSONValue}
                                                    defaultExpanded={false}
                                                />
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="flex flex-col items-center justify-center py-12 text-center min-w-0">
                                            <div className="w-16 h-16 bg-zinc-800/50 rounded-full flex items-center justify-center mb-4 flex-shrink-0">
                                                <Database className="w-8 h-8 text-zinc-500" />
                                            </div>
                                            <h4 className="text-sm font-medium text-zinc-300 mb-2 truncate">
                                                No state data
                                            </h4>
                                            <p className="text-xs text-zinc-500 max-w-xs truncate">
                                                Trigger an action to see the current Redux state
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    }
                />

                <Modal isOpen={!!expandedAction} onClose={handleCloseModal}>
                    {expandedAction && (
                        <div className="bg-zinc-900 border border-zinc-700 rounded-lg shadow-xl max-h-[80vh] overflow-hidden">
                            <div className="p-6 border-b border-zinc-700">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-lg font-semibold text-zinc-100">
                                        Action Details
                                    </h3>
                                    <button
                                        onClick={handleCloseModal}
                                        className="text-zinc-400 hover:text-zinc-200 p-1 rounded transition-colors cursor-pointer"
                                    >
                                        <svg
                                            className="w-5 h-5"
                                            fill="none"
                                            viewBox="0 0 24 24"
                                            stroke="currentColor"
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
                                <div className="space-y-4">
                                    <div className="flex items-center gap-3">
                                        <span className="text-sm text-zinc-500 bg-zinc-800/50 px-3 py-1 rounded">
                                            {getSliceName(expandedAction.payload.action.type)}
                                        </span>
                                        <span className="text-sm text-zinc-400">
                                            {formatTimestamp(expandedAction.timestamp)}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span
                                            className={cn(
                                                'px-3 py-1 text-sm font-medium rounded-md border',
                                                getActionTypeColor(
                                                    expandedAction.payload.action.type
                                                )
                                            )}
                                        >
                                            {formatActionType(expandedAction.payload.action.type)}
                                        </span>
                                    </div>
                                </div>
                            </div>
                            <div className="p-6 overflow-auto max-h-[60vh]">
                                <div className="flex items-center justify-between mb-4">
                                    <h4 className="text-sm font-medium text-zinc-300">
                                        Action Payload
                                    </h4>
                                    <button
                                        onClick={handleToggleJsonExpansion}
                                        className="text-xs text-zinc-400 hover:text-zinc-200 px-2 py-1 rounded bg-zinc-800/50 hover:bg-zinc-700/50 transition-colors cursor-pointer"
                                    >
                                        {isJsonExpanded ? 'Collapse All' : 'Expand All'}
                                    </button>
                                </div>
                                <JSONViewer
                                    key={`json-${isJsonExpanded}`}
                                    data={expandedAction.payload.action as JSONValue}
                                    defaultExpanded={isJsonExpanded}
                                    defaultExpandedLevels={isJsonExpanded ? 10 : 1}
                                />
                            </div>
                        </div>
                    )}
                </Modal>
            </div>
        </div>
    );
};

export default ReduxScreen;
