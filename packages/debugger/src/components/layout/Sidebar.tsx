import { cn } from '@/lib/utils';
import {
  RefreshCw,
  Network,
  HardDrive,
  Zap,
  Terminal,
  Activity,
  Clock,
  Smartphone,
} from 'lucide-react';
import { NavLink, useLocation } from 'react-router-dom';
import { useConnection } from '@/lib/connection';

type Tool = {
  id: string;
  name: string;
  icon: React.ReactNode;
};

const tools: Tool[] = [
  { id: 'console', name: 'Console', icon: <Terminal className="w-4 h-4" /> },
  { id: 'redux', name: 'Redux', icon: <RefreshCw className="w-4 h-4" /> },
  { id: 'network', name: 'Network', icon: <Network className="w-4 h-4" /> },
  { id: 'storage', name: 'Storage', icon: <HardDrive className="w-4 h-4" /> },
  { id: 'performance', name: 'Performance', icon: <Zap className="w-4 h-4" /> },
];

export function Sidebar() {
  const location = useLocation();
  const { connectionState } = useConnection();

  return (
    <div className="w-[240px] h-[calc(100vh-36px)] bg-zinc-900 border-r border-zinc-800 flex flex-col">
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
              <span className="text-[10px] text-zinc-500 font-medium">v0.1.0</span>
            </div>
          </div>
        </div>
      </div>

      <nav className="overflow-y-auto p-2">
        {tools.map(tool => (
          <NavLink
            key={tool.id}
            to={`/debugger/${tool.id}`}
            className={({ isActive }) =>
              cn(
                'w-full flex items-center gap-2.5 px-3 py-2 rounded-md mb-1 text-sm transition-all duration-150',
                isActive
                  ? 'bg-zinc-800 text-zinc-100 shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/50'
              )
            }
          >
            <span className="opacity-80">{tool.icon}</span>
            <span className="font-medium">{tool.name}</span>
          </NavLink>
        ))}
      </nav>

      <div className="mt-auto border-t border-zinc-800">
        {connectionState.appInfo && (
          <div className="px-4 py-2 border-b border-zinc-800">
            <div className="flex items-center gap-2 bg-zinc-800/50 rounded-md p-2">
              <Smartphone className="w-3.5 h-3.5 text-zinc-400" />
              <div className="flex-1 min-w-0">
                <div className="text-xs font-medium text-zinc-200 truncate">
                  {connectionState.appInfo.name}
                </div>
                <div className="text-[10px] text-zinc-500 font-medium">
                  {connectionState.appInfo.platform} {connectionState.appInfo.version}
                </div>
              </div>
            </div>
          </div>
        )}

        {connectionState.status === 'connected' && (
          <div className="px-4 py-2">
            <div className="flex items-center gap-2 text-zinc-500">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
              <div className="text-[10px] font-medium">
                Connected at {connectionState.connectedAt}
              </div>
            </div>
          </div>
        )}
        {connectionState.status !== 'connected' && connectionState.connectedAt && (
          <div className="px-4 py-2">
            <div className="flex items-center gap-2 text-zinc-500">
              <div className="w-2 h-2 rounded-full bg-amber-500"></div>
              <div className="text-[10px] font-medium">
                Last connected at {connectionState.connectedAt}
              </div>
            </div>
          </div>
        )}
        {connectionState.status !== 'connected' && !connectionState.connectedAt && (
          <div className="px-4 py-2">
            <div className="flex items-center gap-2 text-zinc-500">
              <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></div>
              <div className="text-[10px] font-medium">Waiting for connection...</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
