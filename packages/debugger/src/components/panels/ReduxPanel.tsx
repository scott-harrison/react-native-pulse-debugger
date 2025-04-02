import { useState } from 'react'
import { cn } from '@/lib/utils'
import { JSONViewer } from '../common/JSONViewer'

interface ReduxState {
  [key: string]: any
}

interface ReduxAction {
  type: string
  payload?: any
  timestamp: number
}

interface ReduxPanelProps {
  state: ReduxState
  actions: ReduxAction[]
}

export function ReduxPanel({ state, actions }: ReduxPanelProps) {
  const [selectedAction, setSelectedAction] = useState<ReduxAction | null>(null)
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
            <span className="text-[10px] font-medium text-emerald-400 uppercase tracking-wider">Live</span>
          </div>
        </div>
        <div className="flex-1 p-4 overflow-auto font-mono">
          <JSONViewer 
            data={state} 
            initialExpanded={true} 
          />
        </div>
      </div>

      {/* Action History */}
      <div className="w-1/2 flex flex-col">
        <div className="p-4 border-b border-zinc-800">
          <h2 className="text-sm font-semibold text-zinc-100">Action History</h2>
          <p className="text-xs text-zinc-500 mt-0.5">Recent dispatched actions</p>
        </div>
        <div className="flex-1 overflow-auto">
          {actions.map((action, index) => (
            <div
              key={index}
              onClick={() => setSelectedAction(action)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  setSelectedAction(action)
                }
              }}
              className={cn(
                "w-full text-left px-4 py-3 border-b border-zinc-800/50 transition-colors cursor-pointer",
                selectedAction === action 
                  ? "bg-zinc-800" 
                  : "hover:bg-zinc-900"
              )}
            >
              <div className="flex items-start justify-between">
                <div className="font-mono text-xs text-zinc-300">{action.type}</div>
                <div className="text-[10px] tabular-nums text-zinc-500">
                  {new Date(action.timestamp).toLocaleTimeString()}
                </div>
              </div>
              {action.payload && (
                <div className="mt-1.5 text-zinc-500">
                  <JSONViewer 
                    data={action.payload} 
                    initialExpanded={selectedAction === action}
                    objectKey="payload"
                    isLast={true}
                  />
                </div>
              )}
            </div>
          ))}
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
                  timestamp: selectedAction.timestamp
                }}
                initialExpanded={true}
                isLast={true}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  )
} 