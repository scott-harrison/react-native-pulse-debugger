import { ConnectionManager } from './connectionManager';
import type { ConnectionOptions } from './types';

let instance: ConnectionManager | null = null;

export const initializePulse = (
  options: ConnectionOptions
): ConnectionManager => {
  instance = new ConnectionManager(options);
  return instance;
};

export const getPulse = (): ConnectionManager | null => instance;
