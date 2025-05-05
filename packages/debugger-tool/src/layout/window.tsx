import React, { ReactNode } from 'react';

interface WindowLayoutProps {
	children: ReactNode;
}

const WindowLayout: React.FC<WindowLayoutProps> = ({ children }) => {
	return (
		<div className="h-screen flex flex-col bg-gray-900">
			{/* Status bar with blur effect */}
			<div
				className="w-full h-9 backdrop-blur-xs flex items-center justify-center select-none bg-gray-900/80"
				style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}
			>
				<span className="text-xs leading-loose text-white">Pulse Debugger</span>
			</div>

			{/* App content, starting at top */}
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
