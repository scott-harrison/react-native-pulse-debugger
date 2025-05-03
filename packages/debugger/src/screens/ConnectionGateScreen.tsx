import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWebSocket } from '@/context/WebSocketContext';

const ConnectionGateScreen: React.FC = () => {
  const navigate = useNavigate();
  const { state } = useWebSocket();
  const { isConnected, error } = state;

  // Navigate to /debugger when connected
  useEffect(() => {
    if (isConnected) {
      console.log('ConnectionGateScreen: WebSocket connected, navigating to /debugger');
      navigate('/debugger');
    }
  }, [isConnected, navigate]);

  // Determine status message
  let statusMessage = 'Connecting to debugger server...';
  let statusColor = 'text-gray-400';
  if (error) {
    statusMessage = error ? `Unable to establish a connection, Retrying...` : 'Unknown error';
    statusColor = 'text-red-500';
  } else if (isConnected) {
    statusMessage = 'Connected! Loading debugger...';
    statusColor = 'text-green-500';
  }

  return (
    <div className="relative flex-1 flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-900 to-purple-950 p-6 overflow-hidden">
      {/* Subtle radial gradient overlay */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(147,51,234,0.2)_0%,rgba(0,0,0,0.8)_100%)] pointer-events-none" />

      {/* Main content */}
      <div className="text-center z-10">
        {/* Pulse Debugger branding */}
        <h1 className="text-5xl leading-loose font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-500 mb-2 animate-[fadeIn_1s_ease-in-out]">
          Pulse Debugger
        </h1>
        <p className="text-xl font-medium text-gray-300 mb-6 animate-[fadeIn_1.2s_ease-in-out]">
          Welcome to your debugging experience
        </p>

        {/* Status message */}
        <p className={`text-lg font-medium ${statusColor} mb-6 animate-[fadeIn_1.4s_ease-in-out]`}>
          {statusMessage}
        </p>

        {/* Spinner */}
        {!isConnected && (
          <svg
            className="animate-spin h-12 w-12 text-blue-500 mb-6 mx-auto"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        )}
      </div>
    </div>
  );
};

export default ConnectionGateScreen;
