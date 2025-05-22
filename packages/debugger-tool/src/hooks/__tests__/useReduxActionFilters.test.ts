import { renderHook, act } from '@testing-library/react';
import { useReduxActionFilters } from '../useReduxActionFilters';
import { IEvent } from '@pulse/shared-types';

// Define the type for our mock actions to help TypeScript
type ReduxActionEvent = IEvent<'redux_action_event'>;

// Define a more specific type for the payload structure
interface ActionPayload {
	text: string;
}

describe('useReduxActionFilters', () => {
	const mockActions: ReduxActionEvent[] = [
		{
			id: '1',
			type: 'redux_action_event',
			timestamp: '2024-03-20T10:00:00Z',
			sessionId: 'session1',
			payload: {
				action: {
					type: 'ADD_TODO',
					payload: { text: 'Drink' },
				},
				nextState: {},
				prevState: {},
			},
		},
		{
			id: '2',
			type: 'redux_action_event',
			timestamp: '2024-03-20T10:01:00Z',
			sessionId: 'session1',
			payload: {
				action: {
					type: 'REMOVE_TODO',
					payload: { id: 1 },
				},
				nextState: {},
				prevState: {},
			},
		},
		{
			id: '3',
			type: 'redux_action_event',
			timestamp: '2024-03-20T10:02:00Z',
			sessionId: 'session1',
			payload: {
				action: {
					type: 'ADD_TODO',
					payload: { text: 'Eat' },
				},
				nextState: {},
				prevState: {},
			},
		},
		// Add an action with undefined payload to test the fallback
		{
			id: '4',
			type: 'redux_action_event',
			timestamp: '2024-03-20T10:03:00Z',
			sessionId: 'session1',
			payload: {
				action: {
					type: 'NULL_PAYLOAD',
					payload: undefined,
				},
				nextState: {},
				prevState: {},
			},
		},
	];

	it('should initialize with empty search term and "all" filter type', () => {
		const { result } = renderHook(() => useReduxActionFilters(mockActions));

		expect(result.current.searchTerm).toBe('');
		expect(result.current.filterType).toBe('all');
		expect(result.current.filteredActions).toEqual(mockActions);
	});

	it('should filter actions by search term', () => {
		const { result } = renderHook(() => useReduxActionFilters(mockActions));

		act(() => {
			result.current.setSearchTerm('Drink');
		});

		expect(result.current.filteredActions).toHaveLength(1);
		const action = result.current.filteredActions[0] as ReduxActionEvent;
		const payload = action.payload.action.payload as ActionPayload;
		expect(payload.text).toBe('Drink');
	});

	it('should filter actions by action type', () => {
		const { result } = renderHook(() => useReduxActionFilters(mockActions));

		act(() => {
			result.current.setFilterType('ADD_TODO');
		});

		expect(result.current.filteredActions).toHaveLength(2);
		expect(
			result.current.filteredActions.every(
				action => (action as ReduxActionEvent).payload.action.type === 'ADD_TODO'
			)
		).toBe(true);
	});

	it('should combine search term and action type filters', () => {
		const { result } = renderHook(() => useReduxActionFilters(mockActions));

		act(() => {
			result.current.setFilterType('ADD_TODO');
			result.current.setSearchTerm('Eat');
		});

		expect(result.current.filteredActions).toHaveLength(1);
		const action = result.current.filteredActions[0] as ReduxActionEvent;
		const payload = action.payload.action.payload as ActionPayload;
		expect(payload.text).toBe('Eat');
	});

	it('should generate sorted list of unique action types', () => {
		const { result } = renderHook(() => useReduxActionFilters(mockActions));

		expect(result.current.actionTypes).toEqual(['ADD_TODO', 'NULL_PAYLOAD', 'REMOVE_TODO']);
	});

	it('should handle case-insensitive search', () => {
		const { result } = renderHook(() => useReduxActionFilters(mockActions));

		act(() => {
			result.current.setSearchTerm('drink');
		});

		expect(result.current.filteredActions).toHaveLength(1);
		const action = result.current.filteredActions[0] as ReduxActionEvent;
		const payload = action.payload.action.payload as ActionPayload;
		expect(payload.text).toBe('Drink');
	});

	it('should handle empty actions array', () => {
		const { result } = renderHook(() => useReduxActionFilters([]));

		expect(result.current.filteredActions).toEqual([]);
		expect(result.current.actionTypes).toEqual([]);
	});

	it('should handle null or undefined payload', () => {
		const { result } = renderHook(() => useReduxActionFilters(mockActions));

		act(() => {
			result.current.setFilterType('NULL_PAYLOAD');
		});

		expect(result.current.filteredActions).toHaveLength(1);
		const action = result.current.filteredActions[0] as ReduxActionEvent;
		expect(action.payload.action.type).toBe('NULL_PAYLOAD');
		expect(action.payload.action.payload).toBeUndefined();

		// Test searching for undefined payload - since stringifying undefined becomes '{}'
		act(() => {
			result.current.setFilterType('all');
			result.current.setSearchTerm('undefinedterm');
		});

		// The term 'undefinedterm' shouldn't match any action
		expect(result.current.filteredActions).toHaveLength(0);

		// Now test with a term that does exist in action type
		act(() => {
			result.current.setSearchTerm('NULL');
		});

		// Should find the NULL_PAYLOAD action when searching for "NULL" in the action type
		expect(result.current.filteredActions).toHaveLength(1);
		expect(result.current.filteredActions[0].payload.action.type).toBe('NULL_PAYLOAD');
	});
});
