import { useEffect } from 'react';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { JSONViewer } from '../components/common/JSONViewer';
import { useConsoleStore } from '../store/consoleStore';

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
  const { logs, selectedLogId, selectLog, addLog, clear } = useConsoleStore();

  useEffect(() => {
    const handleConsoleLog = (event: CustomEvent<ConsoleLog>) => {
      console.log('[Pulse Debugger] ConsoleScreen received console_log event:', event.detail);

      // Add more detailed debugging
      console.log('[Pulse Debugger] Log details:', {
        id: event.detail.id,
        level: event.detail.level,
        message: event.detail.message,
        hasData: !!event.detail.data,
        hasStack: !!event.detail.stack,
        timestamp: event.detail.timestamp,
      });

      // Check if the log is valid
      if (!event.detail.id || !event.detail.level || !event.detail.message) {
        console.error('[Pulse Debugger] Invalid log format:', event.detail);
        return;
      }

      addLog(event.detail);
    };

    window.addEventListener('console_log', handleConsoleLog as EventListener);
    return () => {
      window.removeEventListener('console_log', handleConsoleLog as EventListener);
    };
  }, [addLog]);

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
    if (!data) return null;

    if (Array.isArray(data)) {
      return `[${data.length} items]`;
    }
    if (typeof data === 'object' && data !== null) {
      if (data instanceof Error || 'message' in data) {
        return data.message;
      }
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
          <button
            onClick={clear}
            className="px-2 py-1 text-xs font-medium text-zinc-400 hover:text-zinc-200 bg-zinc-800 hover:bg-zinc-700 rounded transition-colors"
          >
            Clear Logs
          </button>
        </div>
        <div className="flex-1 overflow-auto">
          {logs.map(log => (
            <div
              key={log.id}
              onClick={() => selectLog(log.id)}
              role="button"
              tabIndex={0}
              onKeyDown={e => {
                if (e.key === 'Enter' || e.key === ' ') {
                  selectLog(log.id);
                }
              }}
              className={cn(
                'w-full text-left px-4 py-3 border-b border-zinc-800/50 transition-colors cursor-pointer',
                selectedLogId === log.id ? 'bg-zinc-800' : 'hover:bg-zinc-900'
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
                  {getDataPreview(log.data)}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Log Details */}
      {selectedLogId && (
        <div className="w-1/2 border-l border-zinc-800 flex flex-col">
          <div className="px-3 py-2 border-b border-zinc-800">
            <h2 className="text-sm font-semibold text-zinc-100">Log Details</h2>
            <p className="text-[10px] text-zinc-500 mt-0.5">Selected log information</p>
          </div>
          <div className="flex-1 p-4 overflow-auto">
            <div className="space-y-4">
              <div>
                <h3 className="text-xs font-medium text-zinc-400 mb-1">Message</h3>
                <p className="text-sm font-mono text-zinc-200">
                  {logs.find(log => log.id === selectedLogId)?.message}
                </p>
              </div>
              {logs.find(log => log.id === selectedLogId)?.data && (
                <div>
                  <h3 className="text-xs font-medium text-zinc-400 mb-1">Data</h3>
                  <JSONViewer
                    data={logs.find(log => log.id === selectedLogId)?.data}
                    className="text-xs"
                    initialExpanded={true}
                    level={0}
                  />
                </div>
              )}
              {logs.find(log => log.id === selectedLogId)?.stack && (
                <div>
                  <h3 className="text-xs font-medium text-zinc-400 mb-1">Stack Trace</h3>
                  <pre className="text-xs font-mono text-zinc-300 whitespace-pre-wrap">
                    {logs.find(log => log.id === selectedLogId)?.stack}
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
