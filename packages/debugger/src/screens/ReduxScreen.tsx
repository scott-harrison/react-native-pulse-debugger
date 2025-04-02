import { useState } from 'react';
import { cn } from '@/lib/utils';
import { JSONViewer } from '../components/common/JSONViewer';
import { mockReduxState, mockActions } from '../mocks/data';

interface ReduxState {
  [key: string]: any;
}

interface ReduxAction {
  type: string;
  payload?: any;
  timestamp: number;
}

export function ReduxScreen() {
  const [selectedAction, setSelectedAction] = useState<ReduxAction | null>(null);

  return (
    <div className="h-full flex bg-zinc-950">
      {/* State Tree */}
      <div className="w-1/2 border-r border-zinc-800 flex flex-col">
        <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-zinc-100">State Tree</h2>
            <p className="text-xs text-zinc-500 mt-0.5">Current application state</p>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[10px] font-medium text-emerald-400 uppercase tracking-wider">
              Live
            </span>
          </div>
        </div>
        <div className="flex-1 p-4 overflow-auto font-mono">
          <JSONViewer data={mockReduxState} initialExpanded={true} />
        </div>
      </div>

      {/* Action History */}
      <div className="w-1/2 flex flex-col">
        <div className="p-4 border-b border-zinc-800">
          <h2 className="text-sm font-semibold text-zinc-100">Action History</h2>
          <p className="text-xs text-zinc-500 mt-0.5">Recent dispatched actions</p>
        </div>
        <div className="flex-1 overflow-auto">
          <div className="space-y-1 p-2">
            {mockActions.map((action, index) => (
              <div
                key={index}
                className={cn(
                  'p-2 rounded-md cursor-pointer hover:bg-zinc-800/50 transition-colors',
                  selectedAction === action && 'bg-zinc-800'
                )}
                onClick={() => setSelectedAction(action)}
              >
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-zinc-200">{action.type}</span>
                  <span className="text-xs text-zinc-400">
                    {new Date(action.timestamp).toLocaleTimeString()}
                  </span>
                </div>
                {action.payload && (
                  <div className="mt-1.5">
                    <JSONViewer data={action.payload} className="text-xs" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Action Details */}
        {selectedAction && (
          <div className="border-t border-zinc-800">
            <div className="p-4 border-b border-zinc-800">
              <h3 className="text-sm font-semibold text-zinc-100">Action Details</h3>
              <p className="text-xs text-zinc-500 mt-0.5">Selected action payload</p>
            </div>
            <div className="p-4 max-h-[300px] overflow-auto font-mono">
              <JSONViewer
                data={{
                  type: selectedAction.type,
                  payload: selectedAction.payload,
                  timestamp: selectedAction.timestamp,
                }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
