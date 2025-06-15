import { useEffect, useCallback } from 'react';

import useSessionStore from '@/store/sessionStore';
import useConsoleStore from '@/store/consoleStore';
import { PulseEvent, Session, SessionId } from '@react-native-pulse-debugger/types';
import { useNetworkStore } from '@/store/networkStore';
import { useReduxStore } from '@/store/reduxStore';

type PulseEventHandler = (connectionId: string, event: PulseEvent | PulseEvent[]) => void;
type PulseDisconnectionHandler = (sessionId: string) => void;

export const useWebSocketRelay = () => {
    const { addSession, getSessionById, removeSessionById } = useSessionStore(state => state);
    const { addConsole } = useConsoleStore(state => state);
    const { addNetworkRequest } = useNetworkStore(state => state);
    const { addReduxAction } = useReduxStore(state => state);

    const handlePulseEvent: PulseEventHandler = useCallback(
        (sessionId: SessionId, event: PulseEvent | PulseEvent[]) => {
            const events = Array.isArray(event) ? event : [event];
            events.forEach(eventParsed => {
                try {
                    const parsed =
                        typeof eventParsed === 'string'
                            ? (JSON.parse(eventParsed) as PulseEvent)
                            : eventParsed;

                    switch (parsed.type) {
                        case 'handshake':
                            const session = parsed.payload as Session;

                            if (!session?.deviceInfo) {
                                console.warn('Invalid handshake payload: missing deviceInfo');
                                return;
                            }

                            // No need to override the ID since we're using the session's own ID
                            const sessionInStore = getSessionById(session.id);
                            if (!sessionInStore) {
                                addSession(session);
                            }
                            break;
                        case 'console':
                            addConsole(event as PulseEvent<'console'>);
                            break;
                        case 'network':
                            addNetworkRequest(event as PulseEvent<'network'>);
                            break;
                        case 'redux':
                            addReduxAction(event as PulseEvent<'redux'>);
                            break;
                        default:
                            console.warn('Unknown event type:', parsed.type);
                            break;
                    }
                } catch (error) {
                    console.error('Error processing pulse event:', error);
                }
            });
        },
        [addSession, getSessionById]
    );

    const handlePulseDisconnection: PulseDisconnectionHandler = useCallback(
        (sessionId: SessionId) => {
            removeSessionById(sessionId);
        },
        [removeSessionById]
    );

    useEffect(() => {
        const { ipcRenderer } = window.electron;

        const onPulseEvent = (sessionId: SessionId, event: PulseEvent | PulseEvent[]) => {
            handlePulseEvent(sessionId, event);
        };

        const onPulseDisconnection = (sessionId: SessionId) => {
            handlePulseDisconnection(sessionId);
        };

        ipcRenderer.on('pulse-event', onPulseEvent);
        ipcRenderer.on('pulse-disconnection', onPulseDisconnection);

        return () => {
            ipcRenderer.removeAllListeners('pulse-event');
            ipcRenderer.removeAllListeners('pulse-disconnection');
        };
    }, [handlePulseEvent, handlePulseDisconnection]);
};
