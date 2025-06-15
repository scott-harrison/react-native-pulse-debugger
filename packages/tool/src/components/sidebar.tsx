import { NavLink, useNavigate } from 'react-router-dom';
import { cn } from '@/utils/styling';
import { Terminal, Database, Network, Smartphone, Circle } from 'lucide-react';
import Button from './button';
import Modal from './modal';
import SessionsWindow from './SessionsWindow';
import { useState } from 'react';
import useSessionStore from '@/store/sessionStore';
import pkg from '../../package.json';
import logo from '@/assets/logo.png';

// SessionInfo component updated to use actual session data
const SessionInfo = () => {
    const { currentSessionId, sessions } = useSessionStore(state => state);
    const session = sessions.find(s => s.id === currentSessionId);

    if (!session) {
        return (
            <div className="flex flex-col gap-2 p-3 bg-zinc-800/50 rounded-md">
                <div className="flex items-center gap-2">
                    <Circle className="w-2 h-2 fill-red-500" />
                    <span className="text-xs text-zinc-300">Disconnected</span>
                </div>
                <div className="text-xs text-zinc-500">No active session</div>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-2 p-3 bg-zinc-800/50 rounded-md">
            <div className="flex items-center gap-2">
                <Circle className="w-2 h-2 fill-green-500" />
                <span className="text-xs text-zinc-300">Connected</span>
            </div>
            <div className="flex items-center gap-2 text-zinc-400">
                <Smartphone className="w-3 h-3" />
                <span className="text-xs truncate">{session.deviceInfo.model}</span>
            </div>
            <div className="text-xs text-zinc-500">App v{session.deviceInfo.appVersion}</div>
        </div>
    );
};

const Sidebar = () => {
    const { sessions, currentSessionId, currentSession, removeCurrentSession } = useSessionStore(
        state => state
    );
    const [showSessions, setShowSessions] = useState(false);
    const navigate = useNavigate();

    const navItems = [
        {
            group: 'Debugging',
            items: [
                {
                    path: '/debugger/console',
                    label: 'Console',
                    icon: Terminal,
                    isEnabled: currentSession()?.monitoring.console,
                },
                {
                    path: '/debugger/network',
                    label: 'Network',
                    icon: Network,
                    isEnabled: currentSession()?.monitoring.network,
                },
                {
                    path: '/debugger/redux',
                    label: 'Redux',
                    icon: Database,
                    isEnabled: currentSession()?.monitoring.redux,
                },
            ],
        },
    ];

    return (
        <>
            <aside className="w-64 h-full border-r border-zinc-800 bg-gray-900/80 flex flex-col">
                <div className="p-4 border-b border-zinc-800/50 flex items-center justify-between bg-gradient-to-r from-gray-900 to-gray-900/95">
                    <div className="flex items-center gap-3">
                        <img
                            src={logo}
                            alt="Pulse Debugger Logo"
                            className="w-12 h-12 rounded-xl shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/40 hover:animate-pulse transition-shadow duration-100 cursor-pointer select-none"
                            onClick={() => {
                                removeCurrentSession();
                                navigate('/');
                            }}
                        />
                        <div className="flex flex-col">
                            <h1 className="text-xl font-bold text-white tracking-tight font-hacker">
                                Pulse Debugger
                            </h1>
                            <span className="py-1 text-xs text-zinc-300 font-medium inline-block">
                                v{pkg.version}
                            </span>
                        </div>
                    </div>
                </div>

                <nav className="p-4 flex-1">
                    {navItems.map(group => (
                        <div key={group.group} className="mb-6">
                            <h2 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2 px-3">
                                {group.group}
                            </h2>
                            <ul className="space-y-1">
                                {group.items.map(item => (
                                    <li key={item.path}>
                                        <NavLink
                                            to={item.path}
                                            className={({ isActive }) =>
                                                cn(
                                                    'flex items-center gap-3 px-3 py-2 text-sm rounded-md transition-all duration-200',
                                                    'hover:bg-zinc-800/50 hover:translate-x-1',
                                                    isActive
                                                        ? 'bg-zinc-800 text-white font-medium'
                                                        : 'text-zinc-400 hover:text-white'
                                                )
                                            }
                                        >
                                            <item.icon className="w-4 h-4" />
                                            {item.label}
                                        </NavLink>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </nav>

                <div className="p-4 border-t border-zinc-800">
                    <SessionInfo />
                    {sessions.filter(s => s.id !== currentSessionId).length > 0 && (
                        <div className="mt-4">
                            <Button
                                variant="secondary"
                                size="sm"
                                className="w-full"
                                onClick={() => setShowSessions(true)}
                            >
                                Switch Session
                            </Button>
                        </div>
                    )}
                </div>
            </aside>

            <Modal isOpen={showSessions} onClose={() => setShowSessions(false)}>
                <SessionsWindow onClose={() => setShowSessions(false)} />
            </Modal>
        </>
    );
};

export default Sidebar;
