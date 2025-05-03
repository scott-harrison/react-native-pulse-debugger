import React, { useState, useEffect, useMemo } from 'react';
import { useWebSocket } from '@/context/WebSocketContext';
import { useReduxStore } from '@/store/reduxStore';
import { cn } from '@/utils/styling';
// import StateDiff from '@/ui/components/StateDiff';
import { JSONViewer } from '@/components/JSONViewer';
import ActionDetailsPanel from './ActionDetailsPanel';
import ActionHistoryPanel from './ActionHistoryPanel';
// import { RefreshCcwIcon } from 'lucide-react';

export const ReduxScreen: React.FC = () => {
  const { state } = useWebSocket();
  const { reduxState, reduxActions, clearReduxActions } = useReduxStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [selectedActionEvent, setSelectedActionEvent] = useState(null);

  // Get unique action types for filter dropdown
  const actionTypes = useMemo(() => {
    const types = new Set<string>();
    reduxActions.forEach(action => {
      types.add(action.type);
    });
    return Array.from(types).sort();
  }, [reduxActions]);

  return (
    <div className="h-full flex bg-zinc-950">
      {/* Redux State Tree */}
      <div className="w-1/2 border-r border-zinc-800 flex flex-col">
        <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-zinc-100">Redux State Tree</h2>
            <p className="text-xs text-zinc-500 mt-0.5">
              Explore the current structure and values of the Redux state tree for better insight
              into your application's state management.
            </p>
          </div>
          <div className="flex gap-2">
            {/* <button
              onClick={requestReduxState}
              className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-zinc-200 px-3 py-1.5 rounded-md bg-zinc-800 hover:bg-zinc-700 transition-colors border cursor-pointer border-zinc-700/50 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-zinc-800 disabled:hover:text-zinc-400 whitespace-nowrap"
            >
              <RefreshCcwIcon className="w-4 h-4" />
              Refresh State
            </button> */}
          </div>
        </div>
        <div className="flex-1 overflow-auto">
          {!reduxState ? (
            <div className="text-center text-xs font-mono text-gray-500 mt-4">
              {state.isConnected
                ? 'No Redux state available. Click "Refresh State" to request the current state.'
                : 'Not connected to a React Native app.'}
            </div>
          ) : (
            <div className="font-mono text-sm">
              <JSONViewer data={reduxState} initialExpanded={true} level={0} />
            </div>
          )}
        </div>
      </div>
      <div className="w-1/2 flex flex-col overflow-hidden">
        <div className="p-4 border-b border-zinc-800">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-sm font-semibold text-zinc-100">Action History</h2>
              <p className="text-xs text-zinc-500 mt-0.5">{reduxActions.length} actions</p>
            </div>
            <button
              onClick={clearReduxActions}
              disabled={reduxActions.length === 0}
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
        <div className="overflow-auto">
          <div className="flex items-center gap-3 p-4 border-b border-zinc-800 bg-zinc-900/30">
            <div className="flex-1 relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4 text-zinc-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </div>
              <input
                type="text"
                placeholder="Search actions..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-3 py-2 bg-zinc-800 rounded-md border border-zinc-700/50 text-sm text-zinc-200 placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div className="relative">
              <select
                value={filterType}
                onChange={e => setFilterType(e.target.value)}
                className="appearance-none pl-3 pr-8 py-2 bg-zinc-800 rounded-md border border-zinc-700/50 text-sm text-zinc-200 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Types</option>
                {actionTypes.map(type => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4 text-zinc-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </div>
            </div>
          </div>
        </div>
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Action History */}
          <div className="divide-y divide-zinc-800">
            <ActionHistoryPanel events={reduxActions} />
          </div>
          {/* Action List with Inline Details */}
          {selectedActionEvent && (
            <div className="overflow-auto flex-1">
              <div className="divide-y divide-zinc-800">
                <ActionDetailsPanel event={selectedActionEvent} />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
