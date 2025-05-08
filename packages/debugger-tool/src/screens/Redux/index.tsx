import { useReduxStore } from '@/store/reduxStore';
import useSessionStore from '@/store/sessionStore';
import { IEvent } from '@pulse/shared-types';
import React, { useMemo, useState } from 'react';
import ReactJson from 'react-json-view';

const ReduxScreen: React.FC = () => {
	const sessionId = useSessionStore(state => state.currentSessionId);
	const { states, actions, clearReduxBySessionId } = useReduxStore();
	const reduxState = states.find(s => s.sessionId === sessionId);
	const reduxActions = actions.filter(a => a.sessionId === sessionId);
	// console.log('state', states);
	const [searchTerm, setSearchTerm] = useState('');
	const [filterType, setFilterType] = useState<string>('all');
	const [selectedActionEvent, setSelectedActionEvent] =
		useState<IEvent<'redux_action_event'> | null>(null);

	const filteredActions = useMemo(() => {
		return actions.filter(action => {
			const matchesSearch =
				searchTerm === '' ||
				action.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
				JSON.stringify(action.payload.action?.payload || {})
					.toLowerCase()
					.includes(searchTerm.toLowerCase());

			const matchesFilter = filterType === 'all' || action.type === filterType;

			return matchesSearch && matchesFilter;
		});
	}, [actions, searchTerm, filterType]);

	const handleActionClick = (actionEvent: IEvent<'redux_action_event'>) => {
		setSelectedActionEvent(actionEvent);
	};

	const clearReduxActions = () => {
		if (!sessionId) return;

		clearReduxBySessionId(sessionId);
	};

	// Get unique action types for filter dropdown
	const actionTypes = useMemo(() => {
		const types = new Set<string>();
		reduxActions.forEach((event: IEvent<'redux_action_event'>) => {
			types.add(event.payload.action.type);
		});
		return Array.from(types).sort();
	}, [reduxActions]);

	return (
		<div className="h-full flex overflow-y-auto bg-gray-900/80">
			<div className="w-1/2 border-r border-zinc-800 flex flex-col">
				<div className="p-4 border-b border-zinc-800 flex items-center justify-between">
					<div>
						<h2 className="text-sm font-semibold text-zinc-100">Redux State Tree</h2>
						<p className="text-xs text-zinc-500 mt-0.5">
							Explore the current structure and values of the Redux state tree for better insight
							into your application's state management.
						</p>
					</div>
					<div className="flex gap-2">{/* Buttons */}</div>
				</div>
				<div className="flex-1 overflow-auto">
					{!reduxState ? (
						<div className="text-center text-xs font-mono text-gray-500 mt-4">
							No Redux state available. Click "Refresh State" to request the current state.
						</div>
					) : (
						<div className="font-mono text-sm">
							<ReactJson
								src={reduxState}
								theme="ocean"
								collapsed={false}
								enableClipboard
								style={{ backgroundColor: '#101828', padding: 20 }}
							/>
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
						{filteredActions.length === 0 ? (
							<div className="font-mono text-xs text-zinc-500 p-4">
								No actions match your search criteria
							</div>
						) : (
							filteredActions.map((actionEvent, index) => {
								const isSelected = actionEvent.id === selectedActionEvent?.id;

								return (
									<div key={index} className="border-b border-zinc-800">
										<div
											className={`p-3 cursor-pointer hover:bg-zinc-800/50 flex items-center ${
												isSelected ? 'bg-zinc-800' : ''
											}`}
											onClick={() => handleActionClick(actionEvent)}
										>
											<div className="flex-1">
												<div className="flex items-center">
													<div className="font-medium text-gray-200 flex-1">
														{actionEvent.payload.action.type}
													</div>
													{/* {hasStateDiff && (
														<div className="text-xs bg-blue-500/10 text-blue-400 border border-blue-500/20 px-1.5 py-0.5 rounded-full">
															State Changed
														</div>
													)} */}
												</div>
												<div className="flex items-center space-x-4 mt-1">
													<div className="text-xs text-zinc-500">
														{new Date(actionEvent.timestamp).toLocaleString()}
													</div>
													<div className="text-xs text-zinc-500">
														{actionEvent.payload.action.payload &&
														typeof actionEvent.payload.action.payload === 'object'
															? `${Object.keys(actionEvent.payload.action.payload).length} properties`
															: ''}
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
													xmlns="http:www.w3.org/2000/svg"
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

										{isSelected && (
											<div className="border-t border-zinc-700/50">
												<div className="p-4 bg-zinc-800/50">
													{/* Action Details */}
													<div className="space-y-4">
														{/* {actionEvent.payload.action.payload !== undefined && (
															<div>
																<div className="text-sm text-zinc-400 mb-2">Payload</div>
																<div className="bg-zinc-900/50 rounded-md overflow-hidden border border-zinc-800">
																	<ReactJson
																		src={actionEvent.payload.action.payload || {}}
																		theme="ocean"
																		collapsed={false}
																		enableClipboard
																	/>
																</div>
															</div>
														)} */}

														{actionEvent.payload.nextState && actionEvent.payload.prevState && (
															<div className="pt-4 border-t border-zinc-700/50">
																<div className="flex items-center justify-between mb-4">
																	<h3 className="font-semibold text-white">State Changes</h3>
																</div>
																<div className="bg-zinc-900/50 rounded-md overflow-hidden border border-zinc-800">
																	{/* compare diff of nextState and prevState */}
																</div>
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
					{/* Action List with Inline Details */}
					{selectedActionEvent && (
						<div className="overflow-auto flex-1">
							<div className="divide-y divide-zinc-800">
								{/* <ActionDetailsPanel event={selectedActionEvent} /> */}
							</div>
						</div>
					)}
				</div>
			</div>
		</div>
	);
};

export default ReduxScreen;
