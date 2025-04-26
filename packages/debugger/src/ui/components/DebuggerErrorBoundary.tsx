import React from 'react';

interface DebuggerErrorBoundaryProps {
  children: React.ReactNode;
}

interface DebuggerErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

class DebuggerErrorBoundary extends React.Component<
  DebuggerErrorBoundaryProps,
  DebuggerErrorBoundaryState
> {
  state: DebuggerErrorBoundaryState = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  static getDerivedStateFromError(error: Error): Partial<DebuggerErrorBoundaryState> {
    // Update state so the next render shows the fallback UI
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log the error to the console (or a logging service)
    console.error('Error caught in DebuggerErrorBoundary:', error, errorInfo);
    this.setState({ errorInfo });
  }

  handleTryAgain = () => {
    // Reset the error state to re-render the child components
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col w-full h-full bg-gradient-to-br from-black to-purple-950">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-red-600 mb-5">Something Went Wrong</h1>
            <p className="text-lg text-gray-600 mb-5">
              An unexpected error occurred in the Pulse Debugger.
            </p>
            {this.state.error && (
              <p className="text-sm text-gray-500 mb-5">Error: {this.state.error.message}</p>
            )}
            {this.state.errorInfo && (
              <details className="text-left mb-5">
                <summary className="text-sm text-gray-500 cursor-pointer">Stack Trace</summary>
                <pre className="text-xs text-gray-400 mt-2">
                  {this.state.errorInfo.componentStack}
                </pre>
              </details>
            )}
            <button
              onClick={this.handleTryAgain}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default DebuggerErrorBoundary;
