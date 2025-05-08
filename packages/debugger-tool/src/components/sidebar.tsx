import useSessionStore from '@/store/sessionStore';
import React, { useState } from 'react';
import Modal from '@/components/modal';
import { Activity, ArrowLeftRight, ChevronRight, Smartphone } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import pkg from '../../package.json';

const Sidebar: React.FC = () => {
	const sessionId = useSessionStore(state => state.currentSessionId);
	const session = useSessionStore(state => state.sessions.find(s => s.sessionId === sessionId));
	const setCurrentSession = useSessionStore(state => state.setCurrentSession);
	const [isModalOpen, setModalOpen] = useState(false);

	return (
		<aside className="min-w-64 bg-gray-800 text-white flex flex-col rounded-tr-2xl">
			<div className="p-4 border-b border-zinc-800">
				<div className="flex items-center gap-2">
					<div className="p-1.5 bg-blue-500/10 rounded-lg">
						<Activity className="w-5 h-5 text-blue-400" />
					</div>
					<div>
						<h1 className="text-lg font-semibold text-zinc-100">Pulse Debugger</h1>
						<div className="flex items-center justify-between">
							<p className="text-[10px] text-zinc-500 font-medium tracking-wider uppercase">
								React Native
							</p>
							<span className="text-[10px] text-zinc-500 font-medium">
								{pkg.version || 'v0.0.0'}
							</span>
						</div>
					</div>
				</div>
			</div>
			<nav className="flex-1 p-2">
				<ul className="space-y-1">
					<li>
						<NavLink
							to="/debugger/console"
							className={({ isActive }) =>
								`block text-sm px-4 py-2 rounded ${isActive ? 'bg-purple-600' : 'hover:bg-gray-700'}`
							}
						>
							Console
						</NavLink>
					</li>
					<li>
						<NavLink
							to="/debugger/redux"
							className={({ isActive }) =>
								`block text-sm px-4 py-2 rounded ${isActive ? 'bg-purple-600' : 'hover:bg-gray-700'}`
							}
						>
							Redux
						</NavLink>
					</li>
					<li>
						<NavLink
							to="/debugger/network"
							className={({ isActive }) =>
								`block text-sm px-4 py-2 rounded ${isActive ? 'bg-purple-600' : 'hover:bg-gray-700'}`
							}
						>
							Network
						</NavLink>
					</li>
				</ul>
			</nav>

			{session && (
				<div className="p-3 border-t border-zinc-700">
					<div className="bg-zinc-100 px-2 py-3 rounded-lg shadow-md">
						<div className="flex items-center">
							<div className="flex-shrink-0 flex items-center justify-center w-8 h-8 bg-blue-500/10 rounded-full">
								<Smartphone className="w-4 h-4 text-blue-400" />
							</div>
							<div className="ml-3">
								<p className="text-xs font-medium text-zinc-800">
									Device: {session.deviceInfo.model || 'Unknown'}
								</p>
								<p className="text-xs text-zinc-500">
									OS: {session.deviceInfo.systemVersion || 'Unknown'}
								</p>
								<p className="text-xs text-zinc-500">
									App Version: {session.deviceInfo.appVersion || 'Unknown'}
								</p>
							</div>
						</div>
					</div>
					{useSessionStore.getState().sessions.length > 1 && (
						<button
							className="mt-3 w-full flex items-center justify-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white text-sm font-medium rounded"
							onClick={() => setModalOpen(true)}
						>
							<ArrowLeftRight className="w-4 h-4" />
						</button>
					)}
					{isModalOpen && (
						<Modal visible={isModalOpen} title="Change Session" onClose={() => setModalOpen(false)}>
							<ul className="mt-6 space-y-4">
								{useSessionStore.getState().sessions.map(session => (
									<li key={session.id}>
										<button
											className="w-full bg-zinc-100 px-4 py-4 rounded-lg shadow-md flex items-center justify-between"
											onClick={() => {
												setCurrentSession(session.id);
												setModalOpen(false);
											}}
										>
											<div className="flex items-center">
												<div className="flex-shrink-0 flex items-center justify-center w-10 h-10 bg-blue-500/10 rounded-full">
													<Smartphone className="w-5 h-5 text-blue-400" />
												</div>
												<div className="ml-4 text-left">
													<p className="text-sm font-medium text-zinc-800">
														Device: {session.deviceInfo.model || 'Unknown'}
													</p>
													<p className="text-xs text-zinc-500">
														OS: {session.deviceInfo.systemVersion || 'Unknown'}
													</p>
													<p className="text-xs text-zinc-500">
														App Version: {session.deviceInfo.appVersion || 'Unknown'}
													</p>
												</div>
											</div>
											<ChevronRight className="w-5 h-5 text-gray-700" />
										</button>
									</li>
								))}
							</ul>
						</Modal>
					)}
				</div>
			)}
		</aside>
	);
};

export default Sidebar;
