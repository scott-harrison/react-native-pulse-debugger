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
import { useState, useEffect } from 'react';

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

interface SidebarProps {
  isConnected: boolean;
}

export function Sidebar({ isConnected }: SidebarProps) {
  const location = useLocation();
  const [connectionTime, setConnectionTime] = useState<string>('');
  const [deviceInfo, setDeviceInfo] = useState<{ name: string; platform: string } | null>(null);

  useEffect(() => {
    if (isConnected) {
      const now = new Date();
      setConnectionTime(now.toLocaleTimeString());

      // In a real app, you would get this from your RN app
      setDeviceInfo({
        name: 'iPhone 14 Pro',
        platform: 'iOS 17.2',
      });
    } else {
      setConnectionTime('');
      setDeviceInfo(null);
    }
  }, [isConnected]);

  return (
    <div className="w-[240px] h-screen bg-zinc-900 border-r border-zinc-800 flex flex-col">
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

      <nav className="flex-1 p-2">
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

      <div className="border-t border-zinc-800">
        {isConnected && deviceInfo && (
          <div className="px-4 py-2 border-b border-zinc-800">
            <div className="flex items-center gap-2 bg-zinc-800/50 rounded-md p-2">
              <Smartphone className="w-3.5 h-3.5 text-zinc-400" />
              <div className="flex-1 min-w-0">
                <div className="text-xs font-medium text-zinc-200 truncate">{deviceInfo.name}</div>
                <div className="text-[10px] text-zinc-500 font-medium">{deviceInfo.platform}</div>
              </div>
            </div>
          </div>
        )}

        <div className="px-4 py-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div
                className={cn(
                  'w-2 h-2 rounded-full',
                  isConnected ? 'bg-emerald-400 animate-pulse' : 'bg-red-400'
                )}
              />
              <span
                className={cn(
                  'text-xs font-medium',
                  isConnected ? 'text-emerald-400' : 'text-red-400'
                )}
              >
                {isConnected ? 'Connected' : 'Disconnected'}
              </span>
            </div>
            {isConnected && (
              <div className="text-[10px] text-zinc-500 font-medium">{connectionTime}</div>
            )}
          </div>
        </div>
      </div>

      <div className="p-3 border-t border-zinc-800">
        <div className="text-[10px] uppercase tracking-wider text-zinc-500 font-medium">
          React Native Pulse Debugger
        </div>
      </div>
    </div>
  );
}
