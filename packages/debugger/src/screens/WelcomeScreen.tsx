import React from 'react';
import { useNavigate } from 'react-router-dom';

interface WelcomeScreenProps {
  isConnected: boolean;
}

export function WelcomeScreen({ isConnected }: WelcomeScreenProps) {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center h-full p-8 text-center">
      <h1 className="text-4xl font-bold mb-6 text-white">React Native Pulse Debugger</h1>

      <div className="max-w-2xl mb-8">
        <p className="text-lg text-gray-300 mb-4">
          Welcome to React Native Pulse Debugger, your comprehensive debugging companion for React
          Native applications.
        </p>
        <p className="text-gray-400">
          This tool provides powerful debugging capabilities including Redux state inspection,
          network monitoring, console logging, and more to help you develop and debug your React
          Native applications efficiently.
        </p>
      </div>

      <div className={`p-4 rounded-lg ${isConnected ? 'bg-green-900/50' : 'bg-red-900/50'}`}>
        <div className="flex items-center gap-2">
          <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
          <p className={`text-lg ${isConnected ? 'text-green-400' : 'text-red-400'}`}>
            {isConnected ? 'Connected to React Native app' : 'Not connected to React Native app'}
          </p>
        </div>
      </div>

      {!isConnected && (
        <p className="mt-4 text-yellow-400">
          Please ensure your React Native app is running and the debugger is properly connected to
          proceed.
        </p>
      )}

      {isConnected && (
        <button
          onClick={() => navigate('/debugger/console')}
          className="mt-8 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors duration-200"
        >
          Proceed to Debugger
        </button>
      )}
    </div>
  );
}
