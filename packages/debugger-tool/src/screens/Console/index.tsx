import React, { useTransition } from 'react';
import { useConsoleStore } from '@/store/consoleStore';
import useSessionStore from '@/store/sessionStore';
import { IEvent } from '@pulse/shared-types';
import { cn } from '@/utils/styling';
import ReactJson from 'react-json-view';

const ConsoleScreen: React.FC = () => {
	const { currentSessionId: sessionId } = useSessionStore(state => state);
	const { logs: allLogs, clearConsoleBySessionId } = useConsoleStore(state => state);
	const logs = allLogs.filter((log: IEvent<'console_event'>) => log.sessionId === sessionId);

	// Use useTransition to keep UI responsive during potentially expensive rendering
	// of the JSON viewer in the details panel. Switch to useState alone if data is
	// always small and rendering is fast (test with large data to confirm).
	const [selectedLog, setSelectedLog] = React.useState<IEvent<'console_event'> | null>(null);
	const [isPending, startTransition] = useTransition();

	const handleSelectLog = (log: IEvent<'console_event'>) => {
		startTransition(() => {
			setSelectedLog(log);
		});
	};

	const handleClearLogs = () => {
		if (!sessionId) return;
		clearConsoleBySessionId(sessionId);
		setSelectedLog(null); // Clear selected log when logs are cleared
	};

	return (
		<div className="h-full flex overflow-y-auto bg-gray-900/80">
			{/* Log List */}
			<div className="w-1/2 border-r border-zinc-800 flex flex-col">
				<div className="p-4 border-b h-15 border-zinc-800 flex items-center justify-between">
					<div>
						<h2 className="text-sm font-semibold text-zinc-100">Console</h2>
						<p className="text-xs text-zinc-500 mt-0.5">Application logs and errors</p>
					</div>
					<button
						onClick={handleClearLogs}
						disabled={logs.length < 1}
						className="px-2 py-1 text-xs font-medium text-zinc-400 hover:text-zinc-200 bg-zinc-800 hover:bg-zinc-700 rounded disabled:cursor-not-allowed transition-colors"
					>
						Clear Logs
					</button>
				</div>
				<div className="flex-1 overflow-y-auto p-4">
					{logs.length === 0 ? (
						<div className="w-full justify-center items-center text-center">
							<p className="inline px-4 py-1 text-xs text-gray-500">No logs available</p>
						</div>
					) : (
						logs.map((log: IEvent<'console_event'>) => (
							<div className="py-2 border-b border-zinc-800">
								<div
									key={log.id}
									onClick={() => handleSelectLog(log)}
									className={`px-4 py-4 text-sm font-mono text-zinc-200 cursor-pointer rounded ${
										selectedLog?.id === log.id ? 'bg-gray-700' : 'hover:bg-gray-700/20'
									}`}
								>
									<div className="flex items-center justify-between mb-4">
										<span
											className={cn('px-1.5 py-0.5 text-xs rounded-sm font-semibold', {
												'bg-white text-black': log.payload.level === 'log',
												'bg-yellow-500 text-black': log.payload.level === 'warn',
												'bg-red-500 text-white': log.payload.level === 'error',
												'bg-blue-500 text-white': log.payload.level === 'info',
												'bg-purple-500 text-white': log.payload.level === 'debug',
											})}
										>
											{log.payload.level.toUpperCase()}
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

			{/* Log Details */}
			<div className="w-1/2 flex flex-col">
				{selectedLog && (
					<div className="px-3 py-2 h-15 border-b border-zinc-800">
						<h2 className="text-sm font-semibold text-zinc-100">Log details</h2>
						<p className="text-[10px] text-zinc-500 mt-0.5">Additional log information</p>
					</div>
				)}
				<div className="flex-1 p-4 overflow-auto">
					{isPending ? (
						<p className="text-sm text-zinc-500">Loading log details...</p>
					) : selectedLog ? (
						<div className="space-y-4">
							<div>
								<h3 className="text-xs font-medium text-zinc-400 mb-1">Message</h3>
								<p className="text-sm font-mono text-zinc-200">{selectedLog.payload.message}</p>
							</div>
							<div>
								{selectedLog.payload?.data &&
									typeof selectedLog.payload.data === 'object' &&
									(!Array.isArray(selectedLog.payload.data) ||
										selectedLog.payload.data.length > 0) && (
										<>
											<h3 className="text-xs font-medium text-zinc-400 mb-1">Data</h3>
											<ReactJson
												src={selectedLog.payload.data}
												theme="ocean"
												collapsed={2}
												enableClipboard={false}
												displayDataTypes={false}
												name={false}
											/>
										</>
									)}
							</div>
							<div>
								{selectedLog.payload?.stack && (
									<>
										<h3 className="text-xs font-medium text-zinc-400 mb-1">Error Stack</h3>
										<p className="text-xs font-mono wrap-break-word">
											{selectedLog.payload.stack.toString()}
										</p>
									</>
								)}
							</div>
						</div>
					) : (
						<p className="text-xs text-zinc-500">Select a log to view details</p>
					)}
				</div>
			</div>
		</div>
	);
};

export default ConsoleScreen;
