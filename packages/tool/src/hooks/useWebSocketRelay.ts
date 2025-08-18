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
                    if (!eventParsed) {
                        console.warn('Received null or undefined event');
                        return;
                    }

                    const parsed =
                        typeof eventParsed === 'string'
                            ? (JSON.parse(eventParsed) as PulseEvent)
                            : eventParsed;

                    if (!parsed || typeof parsed !== 'object') {
                        console.warn('Invalid event format:', eventParsed);
                        return;
                    }

                    if (!parsed.type) {
                        console.warn('Event missing type property:', parsed);
                        return;
                    }

                    switch (parsed.type) {
                        case 'handshake': {
                            const session = parsed.payload as Session;

                            if (!session.deviceInfo) {
                                console.warn('Invalid handshake payload: missing deviceInfo');
                                return;
                            }

                            // No need to override the ID since we're using the session's own ID
                            const sessionInStore = getSessionById(session.id);
                            if (!sessionInStore) {
                                addSession(session);
                            }
                            break;
                        }
                        case 'console':
                            addConsole(event as PulseEvent<'console'>);
                            break;
                        case 'network':
                            addNetworkRequest(event as PulseEvent<'network'>);
                            break;
                        case 'redux': {
                            addReduxAction(event as PulseEvent<'redux'>);
                            break;
                        }
                        default:
                            console.warn('Unknown event type:', parsed.type);
                            break;
                    }
                } catch (error) {
                    console.error('Error processing pulse event:', error);
                }
            });
        },
        [addSession, getSessionById, addConsole, addNetworkRequest, addReduxAction]
    );

    const handlePulseDisconnection: PulseDisconnectionHandler = useCallback(
        (sessionId: SessionId) => {
            removeSessionById(sessionId);
        },
        [removeSessionById]
    );

    useEffect(() => {
        const { ipcRenderer } = window.electron;

        const onPulseEvent = (_event: unknown, ...args: unknown[]) => {
            try {
                if (args.length < 1) {
                    console.warn('Invalid pulse event: missing event argument', args);
                    return;
                }

                // Handle case where sessionId is a separate argument
                if (args.length >= 2) {
                    const [sessionId, event] = args as [SessionId, PulseEvent | PulseEvent[]];

                    if (!sessionId || !event) {
                        console.warn('Invalid pulse event: missing sessionId or event', {
                            sessionId,
                            event,
                        });
                        return;
                    }

                    handlePulseEvent(sessionId, event);
                } else {
                    // Handle case where event contains sessionId
                    const event = args[0] as PulseEvent | PulseEvent[];

                    if (!event) {
                        console.warn('Invalid pulse event: missing event', { event });
                        return;
                    }

                    const events = Array.isArray(event) ? event : [event];
                    events.forEach(eventItem => {
                        if (eventItem && eventItem.sessionId) {
                            handlePulseEvent(eventItem.sessionId, eventItem);
                        } else {
                            console.warn('Event missing sessionId:', eventItem);
                        }
                    });
                }
            } catch (error) {
                console.error('Error in onPulseEvent:', error);
            }
        };

        const onPulseDisconnection = (_event: unknown, ...args: unknown[]) => {
            try {
                if (args.length < 1) {
                    console.warn('Invalid pulse disconnection: missing sessionId', args);
                    return;
                }

                const [sessionId] = args as [SessionId];

                if (!sessionId) {
                    console.warn('Invalid pulse disconnection: missing sessionId', { sessionId });
                    return;
                }

                handlePulseDisconnection(sessionId);
            } catch (error) {
                console.error('Error in onPulseDisconnection:', error);
            }
        };

        ipcRenderer.on('pulse-event', onPulseEvent);
        ipcRenderer.on('pulse-disconnection', onPulseDisconnection);

        return () => {
            ipcRenderer.removeAllListeners('pulse-event');
            ipcRenderer.removeAllListeners('pulse-disconnection');
        };
    }, [handlePulseEvent, handlePulseDisconnection]);
};
