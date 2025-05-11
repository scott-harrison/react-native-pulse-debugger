import React from 'react';
import { IEvent } from '@pulse/shared-types';
import JSONViewer from '@/components/JSONViewer/JSONViewer';

interface ActionDetailsProps {
	actionEvent: IEvent<'redux_action_event'>;
}

const ActionDetails: React.FC<ActionDetailsProps> = ({ actionEvent }) => {
	const { action, nextState, prevState } = actionEvent.payload;
	const { type, payload } = action;
	const timestamp = new Date(actionEvent.timestamp).toLocaleTimeString();

	return (
		<div className="border-t border-zinc-800 bg-zinc-900/80">
			<div className="p-4">
				<div className="space-y-4">
					<div>
						<h3 className="text-xs font-medium text-zinc-400">Action Type</h3>
						<p className="mt-1 text-sm text-zinc-100">{type}</p>
					</div>

					<div>
						<h3 className="text-xs font-medium text-zinc-400">Timestamp</h3>
						<p className="mt-1 text-sm text-zinc-100">{timestamp}</p>
					</div>

					{payload ? (
						<div>
							<h3 className="text-xs font-medium text-zinc-400">Payload</h3>
							<div className="mt-1">
								<JSONViewer data={payload} />
							</div>
						</div>
					) : null}

					{nextState && prevState ? (
						<div>
							<h3 className="text-xs font-medium text-zinc-400">State Diff</h3>
							<div className="mt-1">
								<JSONViewer data={prevState} compareData={nextState} />
							</div>
						</div>
					) : null}
				</div>
			</div>
		</div>
	);
};

export default ActionDetails;
