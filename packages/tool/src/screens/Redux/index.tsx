import React, { useState } from 'react';
import ResizablePanel from '@/components/ResizeablePanel';
import JSONViewer from '@/components/JsonViewer';
import Modal from '@/components/modal';
import { useReduxStore } from '@/store/reduxStore';
import useSessionStore from '@/store/sessionStore';
import { JSONValue, PulseEvent } from '@react-native-pulse-debugger/types';
import { cn } from '@/utils/styling';
import { Trash2, Clock, Zap, Database, ExternalLink, Activity } from 'lucide-react';

const ReduxScreen: React.FC = () => {
    const sessionId = useSessionStore(state => state.currentSessionId);
    const { states, actions, clearReduxBySessionId, removeReduxAction } = useReduxStore(
        state => state
    );
    const reduxState = states.find(a => a.sessionId === sessionId);
    const reduxActions = actions
        .filter(a => a.sessionId === sessionId)
        .sort((a, b) => b.timestamp - a.timestamp);

    const [selectedAction, setSelectedAction] = useState<PulseEvent<'redux'> | null>(null);
    const [expandedAction, setExpandedAction] = useState<PulseEvent<'redux'> | null>(null);
    const [isJsonExpanded, setIsJsonExpanded] = useState<boolean>(true);
    const [isStateJsonExpanded, setIsStateJsonExpanded] = useState<boolean>(false);

    const handleClearActions = () => {
        if (!sessionId) return;
        clearReduxBySessionId(sessionId);
        setSelectedAction(null);
        setExpandedAction(null);
    };

    const handleRemoveAction = (action: PulseEvent<'redux'>) => {
        removeReduxAction(action.eventId);
        if (selectedAction?.eventId === action.eventId) {
            setSelectedAction(null);
        }
        if (expandedAction?.eventId === action.eventId) {
            setExpandedAction(null);
        }
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

    const handleToggleStateJsonExpansion = () => {
        setIsStateJsonExpanded(!isStateJsonExpanded);
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

    const renderLineByLineDiff = (prev: unknown, next: unknown) => {
        const lines: React.ReactElement[] = [];

        const renderObjectDiff = (
            objName: string,
            prevObj: unknown,
            nextObj: unknown,
            indent: number = 0
        ) => {
            if (
                typeof prevObj !== 'object' ||
                typeof nextObj !== 'object' ||
                prevObj === null ||
                nextObj === null
            ) {
                return null;
            }

            const prevKeys = Object.keys(prevObj as Record<string, unknown>);
            const nextKeys = Object.keys(nextObj as Record<string, unknown>);
            const allKeys = [...new Set([...prevKeys, ...nextKeys])];

            const objectLines: React.ReactElement[] = [];
            const indentStr = '  '.repeat(indent);

            objectLines.push(
                <div key={`${objName}-start`} className="flex items-start">
                    <div className="w-8 h-5 bg-zinc-500/20 flex items-center justify-center flex-shrink-0 border-r border-zinc-600/50">
                        <span className="text-zinc-400 text-xs"> </span>
                    </div>
                    <div className="flex-1 min-w-0 pl-4">
                        <code className="text-zinc-300 font-mono text-sm">
                            {indentStr}
                            {objName}: {'{'}
                        </code>
                    </div>
                </div>
            );

            allKeys.forEach(key => {
                const prevValue = (prevObj as Record<string, unknown>)[key];
                const nextValue = (nextObj as Record<string, unknown>)[key];
                const hasPrev = prevKeys.includes(key);
                const hasNext = nextKeys.includes(key);
                const isModified =
                    hasPrev && hasNext && JSON.stringify(prevValue) !== JSON.stringify(nextValue);

                if (!hasPrev && hasNext) {
                    // Added property
                    objectLines.push(
                        <div key={`${objName}-${key}-added`} className="flex items-start">
                            <div className="w-8 h-5 bg-green-500/20 flex items-center justify-center flex-shrink-0 border-r border-zinc-600/50">
                                <span className="text-green-400 text-xs font-bold">+</span>
                            </div>
                            <div className="flex-1 pl-8 bg-green-500/10">
                                <code className="text-green-300 font-mono text-sm">
                                    {indentStr} <span className="text-green-400">{key}</span>
                                    <span className="text-zinc-400">: </span>
                                    <span className="text-green-300">
                                        {JSON.stringify(nextValue)}
                                    </span>
                                </code>
                            </div>
                        </div>
                    );
                } else if (hasPrev && !hasNext) {
                    // Removed property
                    objectLines.push(
                        <div key={`${objName}-${key}-removed`} className="flex items-start">
                            <div className="w-8 h-5 bg-red-500/20 flex items-center justify-center flex-shrink-0 border-r border-zinc-600/50">
                                <span className="text-red-400 text-xs font-bold">-</span>
                            </div>
                            <div className="flex-1 pl-8 bg-red-500/10">
                                <code className="text-red-300 font-mono text-sm">
                                    {indentStr} <span className="text-red-400">{key}</span>
                                    <span className="text-zinc-400">: </span>
                                    <span className="text-red-300">
                                        {JSON.stringify(prevValue)}
                                    </span>
                                </code>
                            </div>
                        </div>
                    );
                } else if (isModified) {
                    // Modified property
                    objectLines.push(
                        <div key={`${objName}-${key}-modified`}>
                            <div className="flex items-start">
                                <div className="w-8 h-5 bg-red-500/20 flex items-center justify-center flex-shrink-0 border-r border-zinc-600/50">
                                    <span className="text-red-400 text-xs font-bold">-</span>
                                </div>
                                <div className="flex-1 pl-8 bg-red-500/10">
                                    <code className="text-red-300 font-mono text-sm">
                                        {indentStr} <span className="text-red-400">{key}</span>
                                        <span className="text-zinc-400">: </span>
                                        <span className="text-red-300">
                                            {JSON.stringify(prevValue)}
                                        </span>
                                    </code>
                                </div>
                            </div>
                            <div className="flex items-start">
                                <div className="w-8 h-5 bg-green-500/20 flex items-center justify-center flex-shrink-0 border-r border-zinc-600/50">
                                    <span className="text-green-400 text-xs font-bold">+</span>
                                </div>
                                <div className="flex-1 pl-8 bg-green-500/10">
                                    <code className="text-green-300 font-mono text-sm">
                                        {indentStr} <span className="text-green-400">{key}</span>
                                        <span className="text-zinc-400">: </span>
                                        <span className="text-green-300">
                                            {JSON.stringify(nextValue)}
                                        </span>
                                    </code>
                                </div>
                            </div>
                        </div>
                    );
                } else {
                    // Unchanged property
                    objectLines.push(
                        <div key={`${objName}-${key}-unchanged`} className="flex items-start">
                            <div className="w-8 h-5 bg-zinc-500/20 flex items-center justify-center flex-shrink-0 border-r border-zinc-600/50">
                                <span className="text-zinc-400 text-xs"> </span>
                            </div>
                            <div className="flex-1 pl-8">
                                <code className="text-zinc-400 font-mono text-sm">
                                    {indentStr} {key}: {JSON.stringify(prevValue)}
                                </code>
                            </div>
                        </div>
                    );
                }
            });

            objectLines.push(
                <div key={`${objName}-end`} className="flex items-start">
                    <div className="w-8 h-5 bg-zinc-500/20 flex items-center justify-center flex-shrink-0 border-r border-zinc-600/50">
                        <span className="text-zinc-400 text-xs"> </span>
                    </div>
                    <div className="flex-1 pl-4 py-1">
                        <code className="text-zinc-300 font-mono text-sm">
                            {indentStr}
                            {'}'}
                        </code>
                    </div>
                </div>
            );

            return objectLines;
        };

        // Find top-level objects that have changes
        if (
            typeof prev === 'object' &&
            typeof next === 'object' &&
            prev !== null &&
            next !== null
        ) {
            const prevKeys = Object.keys(prev as Record<string, unknown>);
            const nextKeys = Object.keys(next as Record<string, unknown>);
            const allKeys = [...new Set([...prevKeys, ...nextKeys])];

            allKeys.forEach(key => {
                const prevValue = (prev as Record<string, unknown>)[key];
                const nextValue = (next as Record<string, unknown>)[key];
                const hasPrev = prevKeys.includes(key);
                const hasNext = nextKeys.includes(key);
                const isModified =
                    hasPrev && hasNext && JSON.stringify(prevValue) !== JSON.stringify(nextValue);

                if (isModified || !hasPrev || !hasNext) {
                    const objectDiff = renderObjectDiff(key, prevValue, nextValue);
                    if (objectDiff) {
                        lines.push(...objectDiff);
                    }
                }
            });
        }

        if (lines.length === 0) {
            return (
                <div className="text-center py-6">
                    <span className="text-xs text-zinc-500 font-medium">No changes detected</span>
                </div>
            );
        }

        return (
            <div className="overflow-hidden">
                <div className="font-mono text-sm">{lines}</div>
            </div>
        );
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

                            <div className="space-y-3 pb-3 min-w-0">
                                {reduxActions.length > 0 ? (
                                    reduxActions.map(action => (
                                        <div
                                            key={action.eventId}
                                            className={cn(
                                                'group relative bg-zinc-800/50 border border-zinc-700/50 rounded-lg overflow-hidden transition-all duration-200 hover:border-zinc-600/50 hover:bg-zinc-800/70 min-w-0 z-10',
                                                selectedAction?.eventId === action.eventId &&
                                                    'border-purple-500/50 bg-purple-500/10'
                                            )}
                                        >
                                            <div className="w-full h-2 bg-purple-600 rounded-full opacity-0 group-hover:opacity-80 transition-opacity transition-height absolute top-[-6px] left-0 blur-xl z-20" />

                                            <div
                                                onClick={() => {
                                                    if (
                                                        selectedAction?.eventId === action.eventId
                                                    ) {
                                                        setSelectedAction(null);
                                                    } else {
                                                        setSelectedAction(action);
                                                    }
                                                }}
                                                className="p-4 cursor-pointer min-w-0"
                                            >
                                                <div className="flex items-center justify-between min-w-0">
                                                    <div className="flex flex-shrink-0">
                                                        <div className="px-2 py-1 text-xs font-medium bg-zinc-700 text-zinc-300 rounded-l-md border border-r-0 border-zinc-600">
                                                            Slice
                                                        </div>
                                                        <div className="text-xs text-zinc-500 bg-zinc-800/50 px-2 py-1 rounded-r-md border border-l-0 border-zinc-700/50">
                                                            {getSliceName(
                                                                action.payload.action.type
                                                            )}
                                                        </div>
                                                    </div>
                                                    <div className="text-xs text-zinc-400 flex items-center gap-1">
                                                        <Clock className="w-3 h-3 flex-shrink-0" />
                                                        <span className="truncate">
                                                            {formatTimestamp(action.timestamp)}
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2 mt-2">
                                                    <div className="flex flex-shrink-0 max-w-48">
                                                        <div className="px-2 py-1 text-xs font-medium bg-zinc-700 text-zinc-300 rounded-l-md border border-r-0 border-zinc-600">
                                                            Action
                                                        </div>
                                                        <div
                                                            className="px-2 py-1 text-xs font-medium rounded-r-md border border-l-0 flex-shrink-0 bg-blue-400/30 text-slate-400 border-slate-500/30"
                                                            title={formatActionType(
                                                                action.payload.action.type
                                                            )}
                                                        >
                                                            <span className="block truncate">
                                                                {formatActionType(
                                                                    action.payload.action.type
                                                                )}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            {selectedAction?.eventId === action.eventId && (
                                                <div className="mb-2">
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
                                                    <div className="border-t border-b border-zinc-700/50 bg-zinc-900/50 p-4 min-w-0">
                                                        <div className="flex items-center gap-2 mb-3 min-w-0">
                                                            <h4 className="text-xs font-medium text-zinc-300 flex-shrink-0">
                                                                State Changes
                                                            </h4>
                                                            <div className="flex-1 h-px bg-zinc-700/50" />
                                                        </div>
                                                        <div className="bg-zinc-900/30 rounded-lg p-3 border border-zinc-700/30 min-w-0 overflow-hidden">
                                                            {renderLineByLineDiff(
                                                                selectedAction.payload.state.prev,
                                                                selectedAction.payload.state.next
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                            <div className="flex justify-between items-center px-4 pb-3 pt-1">
                                                <button
                                                    onClick={e => {
                                                        e.stopPropagation();
                                                        handleRemoveAction(action);
                                                    }}
                                                    className="text-zinc-400 hover:text-zinc-200 hover:bg-zinc-700/50 rounded transition-colors opacity-50 group-hover:opacity-100 cursor-pointer"
                                                    title="Expand action details"
                                                >
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </button>
                                                <button
                                                    onClick={e => {
                                                        e.stopPropagation();
                                                        handleExpandAction(action);
                                                    }}
                                                    className="text-zinc-400 hover:text-zinc-200 hover:bg-zinc-700/50 rounded transition-colors opacity-50 group-hover:opacity-100 cursor-pointer"
                                                    title="Expand action details"
                                                >
                                                    <ExternalLink className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
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
                        <div className="h-full bg-gray-900/30 p-4 min-w-0 overflow-y-auto">
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
                                            <div className="flex items-center justify-end mb-3">
                                                <button
                                                    onClick={handleToggleStateJsonExpansion}
                                                    className="text-xs text-zinc-400 hover:text-zinc-200 px-2 py-1 rounded bg-zinc-800/50 hover:bg-zinc-700/50 transition-colors cursor-pointer"
                                                >
                                                    {isStateJsonExpanded
                                                        ? 'Collapse All'
                                                        : 'Expand All'}
                                                </button>
                                            </div>
                                            <div className="overflow-auto">
                                                <JSONViewer
                                                    key={`state-json-${isStateJsonExpanded}`}
                                                    data={reduxState.state as JSONValue}
                                                    defaultExpanded={isStateJsonExpanded}
                                                    defaultExpandedLevels={
                                                        isStateJsonExpanded ? 10 : 1
                                                    }
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
                        <div className="bg-gradient-to-br from-zinc-900/95 to-zinc-800/95 border border-zinc-600/50 rounded-2xl shadow-2xl max-h-[85vh] overflow-hidden backdrop-blur-xl">
                            <div className="p-8 border-b border-zinc-600/40 bg-gradient-to-r from-zinc-900/80 to-zinc-800/80">
                                <div className="flex items-center justify-between mb-6">
                                    <h3 className="text-xl font-bold text-zinc-100 bg-gradient-to-r from-zinc-100 to-zinc-300 bg-clip-text text-transparent">
                                        Action Details
                                    </h3>
                                    <button
                                        onClick={handleCloseModal}
                                        className="text-zinc-400 hover:text-zinc-200 p-2 rounded-lg transition-all duration-200 cursor-pointer hover:bg-zinc-700/50"
                                    >
                                        <svg
                                            className="w-6 h-6"
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
                                <div className="space-y-5">
                                    <div className="flex items-center gap-4">
                                        <div className="flex flex-shrink-0">
                                            <div className="px-4 py-2 text-sm font-semibold bg-gradient-to-r from-zinc-700/80 to-zinc-600/80 text-zinc-200 rounded-l-lg border border-r-0 border-zinc-500/50 shadow-sm">
                                                Slice
                                            </div>
                                            <div className="text-sm text-zinc-300 bg-gradient-to-r from-zinc-800/80 to-zinc-700/80 px-4 py-2 rounded-r-lg border border-l-0 border-zinc-600/50 shadow-sm font-medium">
                                                {getSliceName(expandedAction.payload.action.type)}
                                            </div>
                                        </div>
                                        <div className="text-sm text-zinc-400 flex items-center gap-2 bg-zinc-800/50 px-4 py-2 rounded-lg border border-zinc-600/30">
                                            <Clock className="w-3.5 h-3.5 flex-shrink-0" />
                                            <span className="truncate font-medium">
                                                {formatTimestamp(expandedAction.timestamp)}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className="flex flex-shrink-0">
                                            <div className="px-4 py-2 text-sm font-semibold bg-gradient-to-r from-zinc-700/80 to-zinc-600/80 text-zinc-200 rounded-l-lg border border-r-0 border-zinc-500/50 shadow-sm">
                                                Action
                                            </div>
                                            <div className="px-4 py-2 text-sm font-semibold rounded-r-lg border border-l-0 flex-shrink-0 shadow-lg bg-blue-400/30 text-slate-400 border-slate-500/30">
                                                {formatActionType(
                                                    expandedAction.payload.action.type
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="p-8 overflow-auto max-h-[40vh]">
                                <div className="flex items-center justify-between mb-6">
                                    <h4 className="text-base font-bold text-zinc-200 flex items-center gap-2">
                                        <Activity className="w-5 h-5 text-purple-400" />
                                        Action Payload
                                    </h4>
                                    <button
                                        onClick={handleToggleJsonExpansion}
                                        className="text-sm text-zinc-300 hover:text-zinc-100 px-4 py-2 rounded-lg bg-gradient-to-r from-zinc-800/80 to-zinc-700/80 hover:from-zinc-700/90 hover:to-zinc-600/90 transition-all duration-200 border border-zinc-600/50 hover:border-zinc-500/50 cursor-pointer shadow-lg font-medium"
                                    >
                                        {isJsonExpanded ? 'Collapse All' : 'Expand All'}
                                    </button>
                                </div>
                                <div className="bg-gradient-to-br from-zinc-900/60 to-zinc-800/60 rounded-xl p-5 border border-zinc-600/40 shadow-lg backdrop-blur-sm">
                                    <JSONViewer
                                        key={`json-${isJsonExpanded}`}
                                        data={expandedAction.payload.action as JSONValue}
                                        defaultExpanded={isJsonExpanded}
                                        defaultExpandedLevels={isJsonExpanded ? 10 : 1}
                                    />
                                </div>
                            </div>
                            <div className="p-8 border-t border-zinc-600/40 overflow-auto max-h-[40vh]">
                                <div className="flex items-center justify-between mb-6">
                                    <h4 className="text-base font-bold text-zinc-200 flex items-center gap-2">
                                        <Database className="w-5 h-5 text-blue-400" />
                                        State Changes
                                    </h4>
                                </div>
                                <div className="bg-gradient-to-br from-zinc-900/60 to-zinc-800/60 rounded-xl p-5 border border-zinc-600/40 shadow-lg backdrop-blur-sm">
                                    {renderLineByLineDiff(
                                        expandedAction.payload.state.prev,
                                        expandedAction.payload.state.next
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </Modal>
            </div>
        </div>
    );
};

export default ReduxScreen;
