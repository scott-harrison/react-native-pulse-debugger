import { useEffect } from 'react';
import { ISession, IEvent } from '@pulse/shared-types';
import { useConsoleStore } from '@/store/consoleStore';
import { useNetworkStore } from '@/store/networkStore';
import { useReduxStore } from '@/store/reduxStore';
import useSessionStore from '@/store/sessionStore';

export const useWebSocketListener = () => {
	const { addConsole } = useConsoleStore(state => state);
	const { addNetworkRequest } = useNetworkStore(state => state);
	const { addReduxAction, setReduxState } = useReduxStore(state => state);
	const { addSession, clearSessionById } = useSessionStore(state => state);

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
					// setReduxState(event.sessionId, event.payload.nextState);
					break;
				case 'redux_state_event':
					// addReduxState(event as IEvent<'redux_state_event'>);
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

		const handlePulseConnection = (sessionData: ISession) => {
			// Check if session id already exists in sessionStore
			const existingSession = useSessionStore
				.getState()
				.sessions.find(session => session.sessionId === sessionData.sessionId);

			if (existingSession) {
				console.warn(`Session with id ${sessionData.sessionId} already exists. Updating session.`);
			}

			// Create new session or update existing session
			addSession(sessionData);
		};

		const handlePulseDisconnection = (sessionId: string) => {
			// Clear session
			clearSessionById(sessionId);
			// Clear all events that contain sessionId
		};

		const handlePulseEvent = (event: IEvent) => {
			try {
				const eventParsed = typeof event === 'string' ? JSON.parse(event) : event;
				console.table({
					type: eventParsed.type,
					payload: eventParsed.payload,
					id: eventParsed.id,
					sessionId: eventParsed.sessionId,
					timestamp: eventParsed.timestamp,
				});
				eventHandler(eventParsed);
			} catch (error) {
				console.warn('Unexpected error occured', error);
			}
		};

		ipcRenderer.on('pulse-connection', handlePulseConnection);
		ipcRenderer.on('pulse-disconnection', handlePulseDisconnection);
		ipcRenderer.on('pulse-event', handlePulseEvent);

		return () => {
			ipcRenderer.removeAllListeners('pulse-connection');
			ipcRenderer.removeAllListeners('pulse-disconnection');
			ipcRenderer.removeAllListeners('pulse-event');
		};
	}, []);
};
