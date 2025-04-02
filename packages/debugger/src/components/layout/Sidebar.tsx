import { cn } from '@/lib/utils';
import { RefreshCw, Network, HardDrive, Zap, Terminal } from 'lucide-react';

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
  selectedTool: string;
  onToolSelect: (toolId: string) => void;
  isConnected: boolean;
}

export function Sidebar({ selectedTool, onToolSelect, isConnected }: SidebarProps) {
  return (
    <div className="w-[240px] h-screen bg-zinc-900 border-r border-zinc-800 flex flex-col">
      <div className="p-4 border-b border-zinc-800">
        <h1 className="text-lg font-semibold text-zinc-100">Debugger</h1>
        <div
          className={cn(
            'mt-2 text-sm flex items-center gap-2',
            isConnected ? 'text-emerald-400' : 'text-red-400'
          )}
        >
          <div
            className={cn(
              'w-1.5 h-1.5 rounded-full animate-pulse',
              isConnected ? 'bg-emerald-400' : 'bg-red-400'
            )}
          />
          <span className="text-xs font-medium">{isConnected ? 'Connected' : 'Disconnected'}</span>
        </div>
      </div>

      <nav className="flex-1 p-2">
        {tools.map(tool => (
          <button
            key={tool.id}
            onClick={() => onToolSelect(tool.id)}
            className={cn(
              'w-full flex items-center gap-2.5 px-3 py-2 rounded-md mb-1 text-sm transition-all duration-150',
              selectedTool === tool.id
                ? 'bg-zinc-800 text-zinc-100 shadow-sm'
                : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/50'
            )}
          >
            <span className="opacity-80">{tool.icon}</span>
            <span className="font-medium">{tool.name}</span>
          </button>
        ))}
      </nav>

      <div className="p-3 border-t border-zinc-800">
        <div className="text-[10px] uppercase tracking-wider text-zinc-500 font-medium">
          React Native Pulse Debugger
        </div>
      </div>
    </div>
  );
}
