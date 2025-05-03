import {
  AppInfoMessage,
  ConsoleMessage,
  NetworkEventMessage,
  ReduxEventMessage,
} from '@pulse/shared-types';
import { useConsoleStore } from './consoleStore';
import { useNetworkStore } from './networkStore';
import { useReduxStore } from './reduxStore';
import { useConnectionStore } from './connectionStore';

export const dispatch = (action: {
  type: string;
  payload: AppInfoMessage | ConsoleMessage | NetworkEventMessage | ReduxEventMessage;
}) => {
  switch (action.type) {
    case 'UPDATE_APP_INFO':
      useConnectionStore.getState().updateSessions([
        ...useConnectionStore.getState().sessions,
        {
          metadata: (action.payload as AppInfoMessage).data,
          deviceId: '',
          connectedAt: '',
          lastActiveAt: '',
          status: 'connected',
        },
      ]);
      break;
    case 'ADD_CONSOLE':
      useConsoleStore.getState().addLog(action.payload as ConsoleMessage);
      break;
    case 'ADD_NETWORK_EVENT':
      useNetworkStore.getState().addRequest(action.payload as NetworkEventMessage);
      break;
    case 'ADD_REDUX_EVENT':
      useReduxStore.getState().addAction(action.payload as ReduxEventMessage);
      break;
    default:
      console.warn('Unknown action type:', action.type);
  }
};

export { useConsoleStore, useNetworkStore, useReduxStore, useConnectionStore };
