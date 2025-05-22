import React, { useState } from 'react';
import { IEvent } from '@pulse/shared-types';
import ActionSearchBar from './ActionSearchBar';
import ActionListItem from './ActionListItem';
import { useReduxActionFilters } from '@/hooks/useReduxActionFilters';

interface ActionHistoryPanelProps {
	actions: IEvent<'redux_action_event'>[];
	onClearActions: () => void;
}

const ActionHistoryPanel: React.FC<ActionHistoryPanelProps> = ({ actions, onClearActions }) => {
	const [selectedActionEvent, setSelectedActionEvent] =
		useState<IEvent<'redux_action_event'> | null>(null);
	const { searchTerm, setSearchTerm, filterType, setFilterType, filteredActions, actionTypes } =
		useReduxActionFilters(actions);

	return (
		<div className="w-1/2 flex flex-col overflow-hidden">
			<div className="p-4 border-b border-zinc-800 h-20">
				<div className="flex justify-between items-center">
					<div>
						<h2 className="text-sm font-semibold text-zinc-100">Action History</h2>
						<p className="text-xs text-zinc-500 mt-0.5">{actions.length} actions</p>
					</div>
					<button
						onClick={onClearActions}
						className="text-xs text-zinc-400 hover:text-zinc-200 px-3 py-1.5 rounded-md bg-zinc-800 hover:bg-zinc-700 transition-colors border border-zinc-700/50"
					>
						Clear
					</button>
				</div>
			</div>

			<ActionSearchBar
				searchTerm={searchTerm}
				setSearchTerm={setSearchTerm}
				filterType={filterType}
				setFilterType={setFilterType}
				actionTypes={actionTypes}
			/>

			<div className="flex-1 flex flex-col overflow-x-hidden">
				<div className="divide-y divide-zinc-800">
					{filteredActions.map((actionEvent: IEvent<'redux_action_event'>, index: number) => (
						<ActionListItem
							key={index}
							actionEvent={actionEvent}
							isSelected={actionEvent.id === selectedActionEvent?.id}
							onSelect={() => setSelectedActionEvent(actionEvent)}
						/>
					))}
				</div>
			</div>
		</div>
	);
};

export default ActionHistoryPanel;
