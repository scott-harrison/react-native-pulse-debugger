import { useState } from 'react';
import { Sidebar } from './components/layout/Sidebar';
import { ReduxPanel } from './components/panels/ReduxPanel';
import { NetworkPanel } from './components/panels/NetworkPanel';
import { ConsolePanel } from './components/panels/ConsolePanel';
import {
  mockReduxState,
  mockActions,
  mockNetworkRequests,
  mockNetworkResponses,
  mockConsoleLogs,
} from './mocks/data';

export function App() {
  const [selectedTool, setSelectedTool] = useState('redux');
  const [isConnected, setIsConnected] = useState(true); // This would come from your connection logic

  const renderPanel = () => {
    switch (selectedTool) {
      case 'redux':
        return <ReduxPanel state={mockReduxState} actions={mockActions} />;
      case 'network':
        return <NetworkPanel requests={mockNetworkRequests} responses={mockNetworkResponses} />;
      case 'console':
        return <ConsolePanel logs={mockConsoleLogs} />;
      case 'storage':
        return (
          <div className="p-6 text-gray-400">
            <h2 className="text-lg font-semibold text-white mb-4">Storage Panel</h2>
            <p>Coming soon...</p>
          </div>
        );
      case 'performance':
        return (
          <div className="p-6 text-gray-400">
            <h2 className="text-lg font-semibold text-white mb-4">Performance Panel</h2>
            <p>Coming soon...</p>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="flex h-screen bg-gray-950 text-white overflow-hidden">
      <Sidebar
        selectedTool={selectedTool}
        onToolSelect={setSelectedTool}
        isConnected={isConnected}
      />
      <main className="flex-1 overflow-hidden">{renderPanel()}</main>
    </div>
  );
}
