import { useState } from 'react';
import { cn } from '@/lib/utils';
import { JSONViewer } from '../common/JSONViewer';

type LogLevel = 'log' | 'info' | 'warn' | 'error' | 'debug';

interface ConsoleLog {
  id: string;
  level: LogLevel;
  message: string;
  timestamp: number;
  data?: any[];
  stack?: string;
}

interface ConsolePanelProps {
  logs: ConsoleLog[];
}

export function ConsolePanel({ logs }: ConsolePanelProps) {
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
        return 'text-zinc-300';
    }
  };

  const getLogLevelBg = (level: LogLevel) => {
    switch (level) {
      case 'error':
        return 'bg-red-500/10';
      case 'warn':
        return 'bg-yellow-500/10';
      case 'info':
        return 'bg-blue-500/10';
      case 'debug':
        return 'bg-purple-500/10';
      default:
        return 'bg-zinc-500/10';
    }
  };

  return (
    <div className="h-full flex bg-zinc-950">
      {/* Log List */}
      <div className="flex-1 flex flex-col">
        <div className="px-3 py-2 border-b border-zinc-800 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-zinc-100">Console</h2>
            <p className="text-[10px] text-zinc-500 mt-0.5">Application logs</p>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[10px] font-medium text-emerald-400 uppercase tracking-wider">
              Live
            </span>
          </div>
        </div>
        <div className="flex-1 overflow-auto">
          {logs.map(log => (
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
                'w-full text-left px-3 py-1.5 border-b border-zinc-800/50 transition-colors cursor-pointer',
                selectedLog?.id === log.id ? 'bg-zinc-800' : 'hover:bg-zinc-900'
              )}
            >
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
              <div
                className={cn('mt-0.5 text-xs font-mono line-clamp-2', getLogLevelColor(log.level))}
              >
                {log.message}
              </div>
              {log.data && log.data.length > 0 && (
                <div className="mt-0.5">
                  {log.data.map((item, index) => (
                    <div key={index} className="text-[10px]">
                      <JSONViewer data={item} initialExpanded={false} isLast={true} />
                    </div>
                  ))}
                </div>
              )}
              {log.stack && (
                <div className="mt-0.5 text-[10px] text-zinc-500 font-mono line-clamp-1">
                  {log.stack}
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
          <div className="p-3 overflow-auto">
            <div className="space-y-3">
              <div>
                <h3 className="text-[10px] font-medium text-zinc-400 mb-0.5">Message</h3>
                <div className={cn('text-xs font-mono', getLogLevelColor(selectedLog.level))}>
                  {selectedLog.message}
                </div>
              </div>
              {selectedLog.data && selectedLog.data.length > 0 && (
                <div>
                  <h3 className="text-[10px] font-medium text-zinc-400 mb-0.5">Data</h3>
                  <div className="text-xs font-mono">
                    {selectedLog.data.map((item, index) => (
                      <div key={index}>
                        <JSONViewer data={item} initialExpanded={true} />
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {selectedLog.stack && (
                <div>
                  <h3 className="text-[10px] font-medium text-zinc-400 mb-0.5">Stack Trace</h3>
                  <div className="text-xs font-mono text-zinc-500 whitespace-pre">
                    {selectedLog.stack}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
