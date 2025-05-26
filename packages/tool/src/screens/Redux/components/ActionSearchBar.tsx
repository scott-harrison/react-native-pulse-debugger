import React from 'react';

interface ActionSearchBarProps {
	searchTerm: string;
	setSearchTerm: (term: string) => void;
	filterType: string;
	setFilterType: (type: string) => void;
	actionTypes: string[];
}

const ActionSearchBar: React.FC<ActionSearchBarProps> = ({
	searchTerm,
	setSearchTerm,
	filterType,
	setFilterType,
	actionTypes,
}) => {
	return (
		<div className="p-4 border-b border-zinc-800">
			<div className="flex gap-2">
				<input
					type="text"
					value={searchTerm}
					onChange={e => setSearchTerm(e.target.value)}
					placeholder="Search actions..."
					className="flex-1 px-3 py-1.5 bg-zinc-800/50 border border-zinc-700/50 rounded-md text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-zinc-600"
				/>
				<select
					value={filterType}
					onChange={e => setFilterType(e.target.value)}
					className="px-3 py-1.5 bg-zinc-800/50 border border-zinc-700/50 rounded-md text-sm text-zinc-100 focus:outline-none focus:border-zinc-600"
				>
					<option value="all">All Actions</option>
					{actionTypes.map(type => (
						<option key={type} value={type}>
							{type}
						</option>
					))}
				</select>
			</div>
		</div>
	);
};

export default ActionSearchBar;
