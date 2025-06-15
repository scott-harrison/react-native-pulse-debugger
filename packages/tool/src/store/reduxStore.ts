import { PulseEvent } from '@react-native-pulse-debugger/types';
import { create } from 'zustand';

interface IState {
    state: unknown;
    sessionId: string;
}

interface ReduxState {
    actions: PulseEvent<'redux'>[];
    states: IState[];
    addReduxAction: (event: PulseEvent<'redux'>) => void;
    // addReduxState: (event: IEvent<'redux_state_event'>) => void;
    setReduxState: (sessionId: string, nextState: unknown) => void;
    clearReduxBySessionId: (sessionId: string) => void;
}

// {
// 	actions: [...state.actions, event],
// })

export const useReduxStore = create<ReduxState>(set => ({
    actions: [],
    states: [],
    addReduxAction: event => {
        return set(state => {
            const reduxActions = [...state.actions, event];
            const isSessionStateExist = state.states.some(s => s.sessionId === event.sessionId);

            if (isSessionStateExist) {
                const updatedStates = state.states.map(s =>
                    s.sessionId === event.sessionId ? { ...s, state: event.payload.state.next } : s
                );
                state.states = updatedStates;
            } else {
                state.states.push({ sessionId: event.sessionId!, state: event.payload.state.next });
            }

            return {
                actions: reduxActions,
                states: state.states,
            };
        });
    },
    setReduxState: (sessionId, nextState) => {
        set(state => {
            const existingStateIndex = state.states.findIndex(s => s.sessionId === sessionId);
            if (existingStateIndex !== -1) {
                const updatedStates = [...state.states];
                updatedStates[existingStateIndex] = { sessionId, state: nextState };
                return { states: updatedStates };
            } else {
                return { states: [...state.states, { sessionId, state: nextState }] };
            }
        });
    },
    clearReduxBySessionId: sessionId => {
        set(state => ({
            actions: state.actions.filter(action => action.sessionId !== sessionId),
            states: state.states.filter(state => state.sessionId !== sessionId),
        }));
    },
}));
