import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface CounterState {
  value: number;
  status: 'idle' | 'loading' | 'failed';
}

const initialState: CounterState = {
  value: 0,
  status: 'idle',
};

export const counterSlice = createSlice({
  name: 'counter',
  initialState,
  reducers: {
    increment: (state) => {
      state.value += 1;
    },
    decrement: (state) => {
      state.value -= 1;
    },
    incrementByAmount: (state, action: PayloadAction<number>) => {
      state.value += action.payload;
    },
    incrementAsync: (state) => {
      state.status = 'loading';
    },
    incrementAsyncSuccess: (state) => {
      state.status = 'idle';
      state.value += 1;
    },
    incrementAsyncFailure: (state) => {
      state.status = 'failed';
    },
  },
});

export const {
  increment,
  decrement,
  incrementByAmount,
  incrementAsync,
  incrementAsyncSuccess,
  incrementAsyncFailure,
} = counterSlice.actions;

export default counterSlice.reducer;
