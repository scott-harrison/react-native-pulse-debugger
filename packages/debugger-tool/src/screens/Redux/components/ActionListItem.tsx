import React from 'react';
import { IEvent } from '@pulse/shared-types';
import ActionDetails from './ActionDetails';

interface ActionListItemProps {
	actionEvent: IEvent<'redux_action_event'>;
	isSelected: boolean;
	onSelect: () => void;
}

const ActionListItem: React.FC<ActionListItemProps> = ({ actionEvent, isSelected, onSelect }) => {
	const { type, payload } = actionEvent.payload.action;
	const timestamp = new Date(actionEvent.timestamp).toLocaleTimeString();

	return (
		<div className="bg-zinc-900/50">
			<div
				onClick={onSelect}
				className={`p-4 cursor-pointer hover:bg-zinc-800/50 transition-colors ${
					isSelected ? 'bg-zinc-800/50' : ''
				}`}
			>
				<div className="flex items-center justify-between">
					<div className="flex-1">
						<div className="flex items-center gap-2">
							<span className="text-sm font-medium text-zinc-100">{type}</span>
							<span className="text-xs text-zinc-500">{timestamp}</span>
						</div>
						{payload ? (
							<pre className="mt-1 text-xs text-zinc-400 overflow-x-auto">
								{JSON.stringify(payload, null, 2)}
							</pre>
						) : null}
					</div>
				</div>
			</div>
			{isSelected && <ActionDetails actionEvent={actionEvent} />}
		</div>
	);
};

export default ActionListItem;
