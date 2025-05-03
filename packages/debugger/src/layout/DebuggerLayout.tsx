import { Outlet } from 'react-router-dom';
import { Sidebar } from '../components/Sidebar';

export function DebuggerLayout() {
  return (
    <div className="flex flex-col h-screen">
      <div
        className="h-9 cursor-move bg-zinc-900 border-b border-zinc-800"
        style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}
      />

      {/* Main content */}
      <div className="flex flex-1 bg-gray-950 text-white overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-hidden">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
