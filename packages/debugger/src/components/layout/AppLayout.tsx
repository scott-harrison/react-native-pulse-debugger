import { ReactNode } from 'react';

interface AppLayoutProps {
  children: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  return (
    <div className="flex flex-col w-full h-full bg-gradient-to-br from-black to-purple-950">
      {/* Transparent draggable top bar */}
      <div className="h-8 cursor-move" style={{ WebkitAppRegion: 'drag' } as React.CSSProperties} />

      {/* Main content */}
      <div className="flex-1 flex">{children}</div>
    </div>
  );
}
