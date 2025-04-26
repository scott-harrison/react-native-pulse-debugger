import { useConnectionStore } from '@/store';

/**
 * Hook to access the connection state (sessions) and derived data.
 * @returns Sessions and active session count
 */
export const useConnectionState = () => {
  const { sessions } = useConnectionStore();
  const activeSessions = sessions.filter(session => session.status === 'connected').length;

  return {
    sessions,
    activeSessions,
  };
};
