/**
 * Event types for outgoing messages (from app to debugger)
 */
export enum LibToDebuggerEventType {
  REDUX_STATE_UPDATE = 'REDUX_STATE_UPDATE', // Send the current state to the debugger
  REDUX_ACTION = 'REDUX_ACTION', // Send an action to the debugger
  NETWORK_REQUEST = 'NETWORK_REQUEST', // Send a network request to the debugger
  CONSOLE = 'CONSOLE', // Send a console messages to the debugger
}

/**
 * Event types for incoming messages (from debugger to app)
 */
export enum DebuggerToLibEventType {
  REDUX_STATE_REQUEST = 'REDUX_STATE_REQUEST', // Request the current state from the debugger
}
