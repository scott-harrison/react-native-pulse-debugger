import { ISession } from '@pulse/shared-types';
import { create } from 'zustand';

interface SessionState {
	sessions: ISession[];
	currentSessionId: string | null;
	addSession: (session: ISession) => void;
	setCurrentSession: (id: string) => void;
	clearSessionById: (sessionId: string) => void;
	clearSession: () => void;
}

const useSessionStore = create<SessionState>(set => ({
	sessions: [],
	currentSessionId: null,
	setCurrentSession: id => set({ currentSessionId: id }),
	addSession: session => set(state => ({ sessions: [...state.sessions, session] })),
	clearSessionById: sessionId =>
		set(state => ({ sessions: state.sessions.filter(session => session.id !== sessionId) })),
	clearSession: () => set({ sessions: [], currentSessionId: null }),
}));

export default useSessionStore;
