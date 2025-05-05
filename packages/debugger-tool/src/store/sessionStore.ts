import { ISession } from '@pulse/shared-types';
import { create } from 'zustand';

interface SessionState {
	sessions: ISession[];
	addSession: (session: ISession) => void;
	clearSessionById: (sessionId: string) => void;
	clearSession: () => void;
}

const useSessionStore = create<SessionState & { clearSessionById: (sessionId: string) => void }>(
	set => ({
		sessions: [],
		addSession: session => set(state => ({ sessions: [...state.sessions, session] })),
		clearSessionById: sessionId =>
			set(state => ({ sessions: state.sessions.filter(session => session.id !== sessionId) })),
		clearSession: () => set({ sessions: [] }),
	})
);

export default useSessionStore;
