import type { ReduxStore } from '@pulse/shared-types';

// Store reference to access Redux state
let reduxStore: ReduxStore | null = null;

/**
 * Sets the Redux store reference for the ConnectionManager to access
 * @param store - The Redux store instance
 */
export const setReduxStore = (store: ReduxStore): void => {
  reduxStore = store;
};

/**
 * Gets the current Redux store instance
 * @returns The Redux store instance or null if not set
 */
export const getReduxStore = (): ReduxStore | null => reduxStore;
