import { useState, useMemo } from 'react';
import { IEvent } from '@pulse/shared-types';

export const useReduxActionFilters = (actions: IEvent<'redux_action_event'>[]) => {
	const [searchTerm, setSearchTerm] = useState('');
	const [filterType, setFilterType] = useState<string>('all');

	const filteredActions = useMemo(() => {
		return actions.filter(action => {
			const matchesSearch =
				searchTerm === '' ||
				action.payload.action.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
				JSON.stringify(action.payload.action.payload || {})
					.toLowerCase()
					.includes(searchTerm.toLowerCase());

			const matchesFilter = filterType === 'all' || action.payload.action.type === filterType;

			return matchesSearch && matchesFilter;
		});
	}, [actions, searchTerm, filterType]);

	const actionTypes = useMemo(() => {
		const types = new Set<string>();
		actions.forEach((event: IEvent<'redux_action_event'>) => {
			types.add(event.payload.action.type);
		});
		return Array.from(types).sort();
	}, [actions]);

	return {
		searchTerm,
		setSearchTerm,
		filterType,
		setFilterType,
		filteredActions,
		actionTypes,
	};
};
