import { useEffect } from 'react';
import { IEvent } from '@pulse/shared-types';
import { useConsoleStore } from '@/store/consoleStore';
import { useNetworkStore } from '@/store/networkStore';
import { useReduxStore } from '@/store/reduxStore';

export const useWebSocketListener = () => {
	const addConsole = useConsoleStore(state => state.addConsole);
	const addNetworkRequest = useNetworkStore(state => state.addNetworkRequest);
	const addReduxAction = useReduxStore(state => state.addReduxAction);
	const addReduxState = useReduxStore(state => state.addReduxState);

	const eventHandler = (event: IEvent) => {
		try {
			// Validate event structure
			if (
				!event ||
				typeof event !== 'object' ||
				!('id' in event) ||
				!('type' in event) ||
				!('payload' in event) ||
				!('timestamp' in event) ||
				typeof event.id !== 'string' ||
				typeof event.type !== 'string' ||
				typeof event.timestamp !== 'string'
			) {
				console.warn('Invalid event structure:', event);
				return;
			}

			switch (event.type) {
				case 'console_event':
					addConsole(event as IEvent<'console_event'>);
					break;
				case 'network_event':
					addNetworkRequest(event as IEvent<'network_event'>);
					break;
				case 'redux_action_event':
					addReduxAction(event as IEvent<'redux_action_event'>);
					break;
				case 'redux_state_event':
					addReduxState(event as IEvent<'redux_state_event'>);
					break;

				default:
					console.warn('Unrecognized event type:', event.type as never);
			}
		} catch (error) {
			console.warn('Unexpected error occured', error);
		}
	};

	useEffect(() => {
		const { ipcRenderer } = window.electron;

		const handlePulseEvent = (event: IEvent) => {
			try {
				const eventParsed = typeof event === 'string' ? JSON.parse(event) : event;
				console.table({
					type: eventParsed.type,
					payload: eventParsed.payload,
					id: eventParsed.id,
					timestamp: eventParsed.timestamp,
				});
				eventHandler(eventParsed);
			} catch (error) {
				console.warn('Unexpected error occured', error);
			}
		};

		ipcRenderer.on('pulse-event', handlePulseEvent);

		return () => {
			ipcRenderer.removeAllListeners('pulse-event');
		};
	}, []);
};
