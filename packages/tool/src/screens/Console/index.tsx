import React, { useTransition } from 'react';
import { PulseEvent } from '@react-native-pulse-debugger/types';
import { cn } from '@/utils/styling';
import JSONViewer from '@/components/JsonViewer';
import useConsoleStore from '@/store/consoleStore';
import useSessionStore from '@/store/sessionStore';

const ConsoleScreen: React.FC = () => {
    const { currentSessionId: sessionId } = useSessionStore(state => state);
    const { logs: allLogs, clearConsoleBySessionId } = useConsoleStore(state => state);
    const logs = allLogs.filter((log: PulseEvent<'console'>) => log.sessionId === sessionId);

    const [selectedLog, setSelectedLog] = React.useState<PulseEvent<'console'> | null>(null);
    const [isPending, startTransition] = useTransition();

    const handleSelectLog = (log: PulseEvent<'console'>) => {
        startTransition(() => {
            setSelectedLog(log);
        });
    };

    const handleClearLogs = () => {
        if (!sessionId) return;
        clearConsoleBySessionId(sessionId);
        setSelectedLog(null);
    };

    return (
        <div className="flex flex-1 h-full overflow-y-auto bg-gray-900/80">
            <div className="flex flex-col flex-1">
                <div className="p-4 border-b h-15 border-zinc-800 flex items-center justify-between">
                    <div>
                        <h2 className="text-sm font-semibold text-zinc-100">Console</h2>
                        <p className="text-xs text-zinc-500 mt-0.5">Application logs and errors</p>
                    </div>
                    <button
                        onClick={handleClearLogs}
                        disabled={logs.length < 1}
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
                <div className="flex-1 overflow-y-auto p-4">
                    {logs.length === 0 ? (
                        <div className="w-full justify-center items-center text-center">
                            <p className="inline px-4 py-1 text-xs text-gray-500">
                                No logs available
                            </p>
                        </div>
                    ) : (
                        logs.map((log: PulseEvent<'console'>) => (
                            <div key={log.eventId} className="py-2 border-b border-zinc-800">
                                <div
                                    onClick={() => handleSelectLog(log)}
                                    className={cn(
                                        'px-4 py-3 text-sm font-mono text-zinc-200 cursor-pointer rounded',
                                        selectedLog?.eventId === log.eventId
                                            ? 'bg-gray-700'
                                            : 'hover:bg-gray-700/20'
                                    )}
                                >
                                    <div className="flex items-center justify-between mb-4">
                                        <span
                                            className={cn(
                                                'px-1.5 py-0.5 text-xs rounded-sm font-semibold',
                                                {
                                                    'bg-white text-black':
                                                        log.payload.type === 'log',
                                                    'bg-yellow-500 text-black':
                                                        log.payload.type === 'warn',
                                                    'bg-red-500 text-white':
                                                        log.payload.type === 'error',
                                                    'bg-blue-500 text-white':
                                                        log.payload.type === 'info',
                                                    'bg-purple-500 text-white':
                                                        log.payload.type === 'debug',
                                                }
                                            )}
                                        >
                                            {log.payload.type.toUpperCase()}
                                        </span>
                                        <span className="text-xs text-zinc-400">
                                            {new Intl.DateTimeFormat('en-US', {
                                                year: 'numeric',
                                                month: 'short',
                                                day: '2-digit',
                                                hour: '2-digit',
                                                minute: '2-digit',
                                                second: '2-digit',
                                                hour12: true,
                                            }).format(new Date(log.timestamp))}
                                        </span>
                                    </div>
                                    <div>{log.payload.message}</div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {selectedLog && (
                <div className="border-l border-zinc-800 flex flex-col flex-1 overflow-y-auto shrink">
                    <div className="px-3 py-2 h-15 border-b border-zinc-800">
                        <h2 className="text-sm font-semibold text-zinc-100">Log details</h2>
                        <p className="text-[10px] text-zinc-500 mt-0.5">
                            Additional log information
                        </p>
                    </div>
                    <div className="flex-1 p-4 overflow-auto">
                        {isPending ? (
                            <p className="text-sm text-zinc-500">Loading log details...</p>
                        ) : (
                            <div className="space-y-4">
                                <div>
                                    <h3 className="text-xs font-medium text-zinc-400 mb-1">
                                        Message
                                    </h3>
                                    <p className="text-sm font-mono text-zinc-200">
                                        {selectedLog.payload.message}
                                    </p>
                                </div>
                                <div>
                                    {selectedLog.payload?.data &&
                                        typeof selectedLog.payload.data === 'object' &&
                                        (!Array.isArray(selectedLog.payload.data) ||
                                            selectedLog.payload.data.length > 0) && (
                                            <>
                                                <h3 className="text-xs font-medium text-zinc-400 mb-1">
                                                    Data
                                                </h3>
                                                <JSONViewer data={selectedLog.payload.data} />
                                            </>
                                        )}
                                </div>
                                <div>
                                    {selectedLog.payload?.stack && (
                                        <>
                                            <h3 className="text-xs font-medium text-zinc-400 mb-1">
                                                Error Stack
                                            </h3>
                                            <pre
                                                className="text-xs font-mono bg-zinc-900 text-red-300 rounded-md p-3 overflow-x-auto whitespace-nowrap"
                                                style={{
                                                    overflowY: 'auto',
                                                    whiteSpace: 'pre-wrap',
                                                    wordBreak: 'break-all',
                                                }}
                                            >
                                                {String(selectedLog.payload.stack)}
                                            </pre>
                                        </>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default ConsoleScreen;
