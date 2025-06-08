import { ReduxState } from '@react-native-pulse-debugger/types';

export class PulseDebugger {
  private static instance: PulseDebugger;
  private reduxStates: ReduxState[] = [];

  private constructor() {}

  static getInstance(): PulseDebugger {
    if (!PulseDebugger.instance) {
      PulseDebugger.instance = new PulseDebugger();
    }
    return PulseDebugger.instance;
  }
}

export default PulseDebugger.getInstance();
