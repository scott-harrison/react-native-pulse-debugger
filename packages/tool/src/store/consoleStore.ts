import { PulseEvent, SessionId } from '@react-native-pulse-debugger/types';
import { create } from 'zustand';

interface ConsoleState {
    logs: PulseEvent<'console'>[];
    addConsole: (event: PulseEvent<'console'>) => void;
    clearConsoleBySessionId: (sessionId: SessionId) => void;
}

const useConsoleStore = create<ConsoleState>(set => ({
    logs: [],
    addConsole: event =>
        set(state => ({
            logs: [...state.logs, event],
        })),
    clearConsoleBySessionId(sessionId) {
        set(state => ({
            logs: state.logs.filter(log => log.sessionId !== sessionId),
        }));
    },
}));

export default useConsoleStore;
