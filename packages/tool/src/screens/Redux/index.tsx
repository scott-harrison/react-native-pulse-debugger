import React, { useState } from 'react';
import ResizablePanel from '@/components/ResizeablePanel';
import JSONViewer from '@/components/JsonViewer';
import { useReduxStore } from '@/store/reduxStore';
import useSessionStore from '@/store/sessionStore';
import { JSONValue, PulseEvent } from '@react-native-pulse-debugger/types';
import { cn } from '@/utils/styling';

const ReduxScreen: React.FC = () => {
    const sessionId = useSessionStore(state => state.currentSessionId);
    const { states, actions, clearReduxBySessionId } = useReduxStore(state => state);
    const reduxState = states.find(a => a.sessionId === sessionId);
    const reduxActions = actions
        .filter(a => a.sessionId === sessionId)
        .sort((a, b) => b.timestamp - a.timestamp);

    const [selectedAction, setSelectedAction] = useState<PulseEvent<'redux'> | null>(null);

    const handleClearActions = () => {
        if (!sessionId) return;
        clearReduxBySessionId(sessionId);
        setSelectedAction(null);
    };

    return (
        <div className="flex flex-1 h-full overflow-y-auto bg-gray-900/80">
            <div className="flex flex-col flex-1">
                <div className="p-4 border-b h-15 border-zinc-800 flex items-center justify-between">
                    <div>
                        <h2 className="text-sm font-semibold text-zinc-100">Redux</h2>
                        <p className="text-xs text-zinc-500 mt-0.5">Redux state and actions</p>
                    </div>
                    <button
                        onClick={handleClearActions}
                        disabled={reduxActions.length < 1}
                        className="text-xs text-zinc-400 hover:text-zinc-200 px-3 py-1.5 rounded-md cursor-pointer bg-zinc-800 hover:bg-zinc-700 transition-colors border border-zinc-700/50 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-zinc-800 disabled:hover:text-zinc-400 flex items-center gap-1.5"
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

                <ResizablePanel
                    leftPanel={
                        <div className="h-full bg-gray-900/50 p-4">
                            <h3 className="text-sm font-semibold text-zinc-100 mb-4">Actions</h3>
                            {/* Actions list will go here */}
                            <div className="space-y-2">
                                {reduxActions.length > 0 ? (
                                    reduxActions.map(action => (
                                        <div
                                            className="border-b border-zinc-800"
                                            key={action.eventId}
                                        >
                                            <div
                                                onClick={() => setSelectedAction(action)}
                                                className={cn(
                                                    'px-4 text-sm font-mono text-zinc-200 cursor-pointer rounded-md',
                                                    selectedAction?.eventId === action.eventId
                                                        ? 'bg-slate-800'
                                                        : 'hover:bg-gray-700/20'
                                                )}
                                            >
                                                <div className="flex py-4 justify-between mb-2 items-center">
                                                    <span className="px-1.5 py-0.5 text-xs rounded-sm font-semibold bg-purple-500 text-white">
                                                        {action.payload.action.type}
                                                    </span>
                                                    <span className="text-xs text-zinc-400">
                                                        {new Date(
                                                            action.timestamp
                                                        ).toLocaleTimeString()}
                                                    </span>
                                                </div>
                                            </div>
                                            {selectedAction?.eventId === action.eventId && (
                                                <div className="px-4 py-2 rounded-md">
                                                    <h4 className="text-xs font-medium text-zinc-400 mb-2">
                                                        Action Details
                                                    </h4>
                                                    <JSONViewer
                                                        data={
                                                            selectedAction?.payload
                                                                .action as JSONValue
                                                        }
                                                    />
                                                </div>
                                            )}
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-xs text-zinc-400">No actions recorded yet</p>
                                )}
                            </div>
                        </div>
                    }
                    rightPanel={
                        <div className="h-full bg-gray-900/30 p-4">
                            <h3 className="text-sm font-semibold text-zinc-100 mb-4">State</h3>
                            <div className="space-y-2">
                                <div className="text-xs text-zinc-400">
                                    {reduxState?.state ? (
                                        <JSONViewer
                                            data={reduxState?.state as JSONValue}
                                            defaultExpanded={false}
                                        />
                                    ) : (
                                        <p className="text-xs text-zinc-400">
                                            Please trigger action to update state
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>
                    }
                />
            </div>
        </div>
    );
};

export default ReduxScreen;
