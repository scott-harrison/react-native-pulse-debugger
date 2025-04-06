import React, { useState, useEffect, useMemo } from 'react';
import { useConnection } from '../lib/connection';
import { useReduxStore } from '../store/reduxStore';
import StateDiff from '../components/StateDiff';
import { JSONViewer } from '../components/common/JSONViewer';

export const ReduxScreen: React.FC = () => {
  const { connectionState, sendMessage } = useConnection();
  const { state, actions, clearActions } = useReduxStore();
  const [selectedAction, setSelectedAction] = useState<number | null>(null);
  const [showStateDiff, setShowStateDiff] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');

  // Debug logging
  useEffect(() => {
    console.log('Redux state updated:', state);
  }, [state]);

  useEffect(() => {
    console.log('Redux actions updated:', actions.length);
  }, [actions]);

  const handleActionClick = (index: number) => {
    setSelectedAction(index);
    setShowStateDiff(false);
  };

  const requestReduxState = () => {
    if (connectionState.status === 'connected') {
      console.log('Requesting Redux state');
      sendMessage('request-redux-state', {});
    }
  };

  useEffect(() => {
    // Request Redux state when connection is established and state is not available
    if (connectionState.status === 'connected' && !state) {
      requestReduxState();
    }
  }, [connectionState.status, state]);

  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString();
  };

  const formatValue = (value: any): string => {
    if (value === null) return 'null';
    if (value === undefined) return 'undefined';
    if (typeof value === 'string') return `"${value}"`;
    if (typeof value === 'object') {
      return JSON.stringify(value, null, 2);
    }
    return String(value);
  };

  // Get unique action types for filter dropdown
  const actionTypes = useMemo(() => {
    const types = new Set<string>();
    actions.forEach(action => {
      types.add(action.type);
    });
    return Array.from(types).sort();
  }, [actions]);

  // Filter actions based on search term and filter type
  const filteredActions = useMemo(() => {
    return actions.filter(action => {
      const matchesSearch =
        searchTerm === '' ||
        action.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
        JSON.stringify(action.payload).toLowerCase().includes(searchTerm.toLowerCase());

      const matchesFilter = filterType === 'all' || action.type === filterType;

      return matchesSearch && matchesFilter;
    });
  }, [actions, searchTerm, filterType]);

  // Auto-select the most recent action when actions change
  useEffect(() => {
    if (filteredActions.length > 0 && selectedAction === null) {
      setSelectedAction(0);
    } else if (filteredActions.length === 0) {
      setSelectedAction(null);
    }
  }, [filteredActions, selectedAction]);

  return (
    <div className="h-full flex flex-col bg-zinc-900 text-white">
      <div className="p-4 flex justify-between items-center border-b border-zinc-800">
        <h2 className="text-lg font-semibold">Redux Debugger</h2>
        <div className="flex space-x-2">
          <button
            onClick={requestReduxState}
            disabled={connectionState.status !== 'connected'}
            className={`px-3 py-1 rounded text-sm ${
              connectionState.status === 'connected'
                ? 'bg-zinc-700 hover:bg-zinc-600'
                : 'bg-zinc-800 text-gray-500 cursor-not-allowed'
            }`}
          >
            Refresh State
          </button>
          <button
            onClick={clearActions}
            disabled={actions.length === 0}
            className={`px-3 py-1 rounded text-sm ${
              actions.length > 0
                ? 'bg-zinc-700 hover:bg-zinc-600'
                : 'bg-zinc-800 text-gray-500 cursor-not-allowed'
            }`}
          >
            Clear
          </button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* State Tree Panel (Left) */}
        <div className="w-1/2 border-r border-zinc-800 overflow-auto">
          <div className="p-4 border-b border-zinc-800">
            <h3 className="font-semibold">State Tree</h3>
            <p className="text-xs text-gray-400 mt-1">Latest Redux state from the connected app</p>
          </div>
          <div className="p-4">
            {!state && connectionState.status === 'connected' ? (
              <div className="flex justify-center items-center h-32">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
              </div>
            ) : !state ? (
              <div className="text-center text-gray-500">
                {connectionState.status === 'connected'
                  ? 'No Redux state available. Click "Refresh State" to request the current state.'
                  : 'Not connected to a React Native app.'}
              </div>
            ) : (
              <div className="font-mono text-sm">
                <JSONViewer data={state} initialExpanded={true} />
              </div>
            )}
          </div>
        </div>

        {/* Action History and Details Panel (Right) */}
        <div className="w-1/2 flex flex-col overflow-hidden">
          <div className="p-4 border-b border-zinc-800">
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-semibold">Action History</h3>
              <span className="text-xs text-gray-400">{filteredActions.length} actions</span>
            </div>

            {/* Search and Filter Controls */}
            <div className="flex space-x-2">
              <div className="flex-1">
                <input
                  type="text"
                  placeholder="Search actions..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="w-full px-3 py-1 bg-zinc-800 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <select
                value={filterType}
                onChange={e => setFilterType(e.target.value)}
                className="px-3 py-1 bg-zinc-800 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="all">All Types</option>
                {actionTypes.map(type => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Action List with Inline Details */}
            <div className="overflow-auto flex-1">
              <div className="divide-y divide-zinc-800">
                {filteredActions.length === 0 ? (
                  <div className="p-4 text-gray-500">No actions match your search criteria</div>
                ) : (
                  filteredActions.map((action, index) => {
                    const originalIndex = actions.findIndex(a => a === action);
                    const isSelected = selectedAction === originalIndex;
                    const hasStateDiff = action.stateDiff !== undefined;

                    return (
                      <div key={index} className="border-b border-zinc-800">
                        {/* Action Header */}
                        <div
                          className={`p-3 cursor-pointer hover:bg-zinc-800/50 flex items-center ${
                            isSelected ? 'bg-zinc-800' : ''
                          }`}
                          onClick={() => handleActionClick(originalIndex)}
                        >
                          <div className="flex-1">
                            <div className="flex items-center">
                              <div className="font-medium text-gray-200 flex-1">{action.type}</div>
                              {hasStateDiff && (
                                <div className="text-xs bg-blue-500/10 text-blue-400 border border-blue-500/20 px-1.5 py-0.5 rounded-full">
                                  State Changed
                                </div>
                              )}
                            </div>
                            <div className="flex items-center space-x-4 mt-1">
                              <div className="text-xs text-zinc-500">
                                {formatTimestamp(action.timestamp)}
                              </div>
                              <div className="text-xs text-zinc-500">
                                {action.payload && typeof action.payload === 'object'
                                  ? `${Object.keys(action.payload).length} properties`
                                  : 'Simple payload'}
                              </div>
                            </div>
                          </div>
                          <div
                            className={`ml-2 transform transition-transform ${isSelected ? 'rotate-180' : ''}`}
                          >
                            <svg
                              width="12"
                              height="12"
                              viewBox="0 0 12 12"
                              fill="none"
                              xmlns="http://www.w3.org/2000/svg"
                            >
                              <path
                                d="M2.5 4.5L6 8L9.5 4.5"
                                stroke="currentColor"
                                strokeWidth="1.5"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                            </svg>
                          </div>
                        </div>

                        {/* Expanded Details */}
                        {isSelected && (
                          <div className="border-t border-zinc-700/50">
                            <div className="p-4 bg-zinc-800/50">
                              {/* Action Details */}
                              <div className="space-y-4">
                                <div>
                                  <div className="text-sm text-zinc-400 mb-2">Payload</div>
                                  <div className="bg-zinc-900/50 rounded-md overflow-hidden border border-zinc-800">
                                    <JSONViewer
                                      data={action.payload}
                                      initialExpanded={true}
                                      level={0}
                                      className="p-2"
                                    />
                                  </div>
                                </div>

                                {/* State Changes */}
                                {action.stateDiff && (
                                  <div className="pt-4 border-t border-zinc-700/50">
                                    <div className="flex items-center justify-between mb-4">
                                      <h3 className="font-semibold text-white">State Changes</h3>
                                    </div>

                                    <StateDiff
                                      before={action.stateDiff.before}
                                      after={action.stateDiff.after}
                                    />
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
