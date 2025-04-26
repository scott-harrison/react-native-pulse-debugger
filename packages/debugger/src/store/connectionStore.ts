import { create } from 'zustand';
import { SessionData } from '@pulse/shared-types';

interface ConnectionState {
  sessions: SessionData[];
  updateSessions: (sessions: SessionData[]) => void;
  clearSessions: () => void;
}

export const useConnectionStore = create<ConnectionState>(set => ({
  sessions: [],

  updateSessions: sessions => set({ sessions }),

  clearSessions: () => set({ sessions: [] }),
}));
