import React, { ReactNode } from 'react';

interface WindowLayoutProps {
  children: ReactNode;
}

const WindowLayout: React.FC<WindowLayoutProps> = ({ children }) => {
  return (
    <div className="h-screen flex flex-col bg-gray-900">
      {/* Status bar with drag region */}
      <div
        className="p-2 backdrop-blur-md items-center justify-center flex"
        style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}
      >
        <span className="text-xs leading-loose">Pulse Debugger</span>
      </div>

      {/* App content with no-drag region */}
      <div
        className="flex-1 text-white"
        style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
      >
        {children}
      </div>
    </div>
  );
};

export default WindowLayout;
