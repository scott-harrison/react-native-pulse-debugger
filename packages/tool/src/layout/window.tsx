import React, { ReactNode } from 'react';

interface WindowLayoutProps {
    children: ReactNode;
}

const WindowLayout: React.FC<WindowLayoutProps> = ({ children }) => {
    return (
        <div className="h-screen flex flex-col">
            <div
                className="w-full h-9 backdrop-blur-md flex items-center justify-center select-none z-10 bg-gray-900/80 border-b border-gray-800/50"
                style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}
            >
                <span className="text-xs leading-loose text-white">Pulse Debugger</span>
            </div>
            {/* App content, starting at top */}
            <div
                className="flex-1 overflow-hidden text-white"
                style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
            >
                {children}
            </div>
        </div>
    );
};

export default WindowLayout;
