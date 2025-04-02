import { useState } from 'react';
import { cn } from '@/lib/utils';
import { JSONViewer } from '../components/common/JSONViewer';
import { mockConsoleLogs } from '../mocks/data';

type LogLevel = 'log' | 'info' | 'warn' | 'error' | 'debug';

interface ConsoleLog {
  id: string;
  level: LogLevel;
  message: string;
  data?: any;
  stack?: string;
  timestamp: number;
}

export function ConsoleScreen() {
  const [selectedLog, setSelectedLog] = useState<ConsoleLog | null>(null);

  const getLogLevelColor = (level: LogLevel) => {
    switch (level) {
      case 'error':
        return 'text-red-400';
      case 'warn':
        return 'text-yellow-400';
      case 'info':
        return 'text-blue-400';
      case 'debug':
        return 'text-purple-400';
      default:
        return 'text-zinc-200';
    }
  };

  const getLogLevelBg = (level: LogLevel) => {
    switch (level) {
      case 'error':
        return 'bg-red-500/20';
      case 'warn':
        return 'bg-yellow-500/20';
      case 'info':
        return 'bg-blue-500/20';
      case 'debug':
        return 'bg-purple-500/20';
      default:
        return 'bg-zinc-500/20';
    }
  };

  const getDataPreview = (data: any) => {
    if (Array.isArray(data)) {
      return `[${data.length} items]`;
    }
    if (typeof data === 'object' && data !== null) {
      return `{${Object.keys(data).length} keys}`;
    }
    return String(data);
  };

  return (
    <div className="h-full flex bg-zinc-950">
      {/* Log List */}
      <div className="w-1/2 border-r border-zinc-800 flex flex-col">
        <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-zinc-100">Console</h2>
            <p className="text-xs text-zinc-500 mt-0.5">Application logs and errors</p>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[10px] font-medium text-emerald-400 uppercase tracking-wider">
              Live
            </span>
          </div>
        </div>
        <div className="flex-1 overflow-auto">
          {mockConsoleLogs.map(log => (
            <div
              key={log.id}
              onClick={() => setSelectedLog(log)}
              role="button"
              tabIndex={0}
              onKeyDown={e => {
                if (e.key === 'Enter' || e.key === ' ') {
                  setSelectedLog(log);
                }
              }}
              className={cn(
                'w-full text-left px-4 py-3 border-b border-zinc-800/50 transition-colors cursor-pointer',
                selectedLog?.id === log.id ? 'bg-zinc-800' : 'hover:bg-zinc-900'
              )}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <span
                    className={cn(
                      'text-[10px] font-medium px-1 py-0.5 rounded',
                      getLogLevelBg(log.level)
                    )}
                  >
                    {log.level.toUpperCase()}
                  </span>
                  <span className="text-[10px] text-zinc-500 tabular-nums">
                    {new Date(log.timestamp).toLocaleTimeString()}
                  </span>
                </div>
              </div>
              <div
                className={cn('mt-0.5 text-xs font-mono line-clamp-2', getLogLevelColor(log.level))}
              >
                {log.message}
              </div>
              {log.data && (
                <div className="mt-1.5 text-[10px] text-zinc-500 font-mono">
                  {Array.isArray(log.data) ? `Array[${log.data.length}]` : 'Object'}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Log Details */}
      {selectedLog && (
        <div className="w-1/2 border-l border-zinc-800 flex flex-col">
          <div className="px-3 py-2 border-b border-zinc-800">
            <h2 className="text-sm font-semibold text-zinc-100">Log Details</h2>
            <p className="text-[10px] text-zinc-500 mt-0.5">Selected log information</p>
          </div>
          <div className="flex-1 p-4 overflow-auto">
            <div className="space-y-4">
              <div>
                <h3 className="text-xs font-medium text-zinc-400 mb-1">Message</h3>
                <p className="text-sm font-mono text-zinc-200">{selectedLog.message}</p>
              </div>
              {selectedLog.data && (
                <div>
                  <h3 className="text-xs font-medium text-zinc-400 mb-1">Data</h3>
                  <JSONViewer
                    data={selectedLog.data}
                    className="text-xs"
                    initialExpanded={true}
                    level={0}
                  />
                </div>
              )}
              {selectedLog.stack && (
                <div>
                  <h3 className="text-xs font-medium text-zinc-400 mb-1">Stack Trace</h3>
                  <pre className="text-xs font-mono text-zinc-300 whitespace-pre-wrap">
                    {selectedLog.stack}
                  </pre>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
