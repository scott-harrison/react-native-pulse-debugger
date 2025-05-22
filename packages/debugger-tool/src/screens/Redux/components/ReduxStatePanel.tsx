import React from 'react';
import JSONViewer from '@/components/JSONViewer/JSONViewer';
import { JSONValue } from '@/components/JSONViewer/JSONViewer.types';

interface ReduxStatePanelProps {
	reduxState?: {
		state: JSONValue;
		sessionId: string;
	};
}

const ReduxStatePanel: React.FC<ReduxStatePanelProps> = ({ reduxState }) => {
	return (
		<div className="flex flex-col flex-1">
			<div className="p-4 border-b border-zinc-800 items-center justify-between h-20">
				<div>
					<h2 className="text-sm font-semibold text-zinc-100">Redux State Tree</h2>
					<p className="text-xs text-zinc-500 mt-0.5">
						Explore the current structure and values of the Redux state tree for better insight into
						your application's state management.
					</p>
				</div>
			</div>
			<div className="flex-1 h-full bg-gray-950 overflow-auto">
				{!reduxState ? (
					<div className="text-center text-xs font-mono text-gray-500 mt-4">
						No Redux state available.
					</div>
				) : (
					<div className="font-mono text-sm">
						<JSONViewer data={reduxState.state} />
					</div>
				)}
			</div>
		</div>
	);
};

export default ReduxStatePanel;
