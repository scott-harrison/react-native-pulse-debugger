import { useEffect } from 'react';
import useSessionStore from '@/store/sessionStore';

interface UseConnectionCheck {
    interval?: number; // Time in ms between checks
    enabled?: boolean; // Whether the check is enabled
}

/**
 * This hook checks for active connections to the electron main process and removes sessions that are no longer connected.
 * @param interval - The time in milliseconds between checks.
 * @param enabled - Whether the check is enabled.
 */
export const useConnectionCheck = ({
    interval = 5000,
    enabled = true,
}: UseConnectionCheck = {}) => {
    const { sessions } = useSessionStore(state => state);

    useEffect(() => {
        if (!enabled) return;

        const checkConnections = async () => {
            const { ipcRenderer } = window.electron;

            try {
                // Broadcast handshake request to all connected clients
                await ipcRenderer.invoke('request_handshake');
            } catch (error) {
                console.error('Failed to request handshake:', error);
            }
        };

        // Run check immediately
        checkConnections();

        // Set up interval for subsequent checks
        const intervalId = setInterval(checkConnections, interval);

        // Cleanup on unmount or when enabled changes
        return () => {
            clearInterval(intervalId);
        };
    }, [sessions, interval, enabled]);
};
