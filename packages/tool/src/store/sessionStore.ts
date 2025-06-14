import { Session } from '@react-native-pulse-debugger/types';
import { create } from 'zustand';

interface SessionStore {
    sessions: Session[];
    currentSessionId: Session['id'] | null;
    addSession: (session: Session) => void;
    getSessions: () => Session[];
    removeSessionById: (sessionId: string) => void;
    getSessionById: (sessionId: string) => Session | undefined;
    setCurrentSession: (sessionId: Session['id']) => void;
    removeCurrentSession: () => void;
    currentSession: () => Session | undefined;
}

const useSessionStore = create<SessionStore>((set, get) => ({
    sessions: [],
    currentSessionId: null,
    addSession: (session: Session) => {
        set(state => ({ sessions: [...state.sessions, session] }));
    },
    setCurrentSession: (sessionId: Session['id']) => {
        set({ currentSessionId: sessionId });
    },
    removeCurrentSession: () => {
        set({ currentSessionId: null });
    },
    removeSessionById: (sessionId: Session['id']) => {
        set(state => ({ sessions: state.sessions.filter(session => session.id !== sessionId) }));
    },
    getSessionById: (sessionId: Session['id']) => {
        return get().sessions.find(session => session.id === sessionId);
    },
    getSessions: () => {
        return get().sessions;
    },
    currentSession: () => {
        return get().sessions.find(session => session.id === get().currentSessionId);
    },
}));

export default useSessionStore;
