import React from 'react';
import { render, fireEvent, screen, waitFor } from '@testing-library/react';
import DebuggerErrorBoundary from '@/components/DebuggerErrorBoundary';

// Mock console.error to suppress output and verify calls
jest.spyOn(console, 'error').mockImplementation(() => {});

const TestChildComponent: React.FC<{ shouldThrow: boolean }> = ({ shouldThrow }) => {
  if (shouldThrow) {
    throw new Error('Test error');
  }
  return <div>Recovered Component</div>;
};

describe('DebuggerErrorBoundary', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders children when there is no error', () => {
    render(
      <DebuggerErrorBoundary>
        <div>Child Component</div>
      </DebuggerErrorBoundary>
    );

    expect(screen.getByText('Child Component')).toBeInTheDocument();
    expect(screen.queryByText('Something Went Wrong')).not.toBeInTheDocument();
  });

  it('catches errors and renders fallback UI', () => {
    render(
      <DebuggerErrorBoundary>
        <TestChildComponent shouldThrow={true} />
      </DebuggerErrorBoundary>
    );

    expect(screen.getByText('Something Went Wrong')).toBeInTheDocument();
    expect(
      screen.getByText('An unexpected error occurred in the Pulse Debugger.')
    ).toBeInTheDocument();
    expect(screen.getByText('Error: Test error')).toBeInTheDocument();
    expect(screen.getByText('Try Again')).toBeInTheDocument();
    expect(console.error).toHaveBeenCalledWith(
      'Error caught in DebuggerErrorBoundary:',
      expect.any(Error),
      expect.any(Object)
    );
  });

  it('resets error state and re-renders children when Try Again is clicked', async () => {
    const { rerender } = render(
      <DebuggerErrorBoundary>
        <TestChildComponent shouldThrow={true} />
      </DebuggerErrorBoundary>
    );

    expect(screen.getByText('Something Went Wrong')).toBeInTheDocument();

    // Update the child to stop throwing an error *before* resetting the state
    rerender(
      <DebuggerErrorBoundary>
        <TestChildComponent shouldThrow={false} />
      </DebuggerErrorBoundary>
    );

    // Simulate clicking "Try Again" to reset the Error Boundary state
    fireEvent.click(screen.getByText('Try Again'));

    // Verify the fallback UI is gone and the child component is rendered
    await waitFor(() => {
      expect(screen.queryByText('Something Went Wrong')).not.toBeInTheDocument();
      expect(screen.getByText('Recovered Component')).toBeInTheDocument();
    });
  });
});
