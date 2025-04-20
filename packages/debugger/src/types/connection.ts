import { ConnectionState } from '@pulse/shared-types';
import { ReactNode } from 'react';

export interface AppInfo {
  name: string;
  platform: string;
  version: string;
}

export interface ConnectionContextState {
  status: ConnectionState;
  appInfo: AppInfo | null;
  error: string | null;
}

export interface ConnectionContextType {
  connectionState: ConnectionContextState;
  sendMessage: (message: any) => void;
}

export interface ConnectionProviderProps {
  children: ReactNode;
}
