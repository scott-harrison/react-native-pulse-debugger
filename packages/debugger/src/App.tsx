import { useState } from 'react';
import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom';
import { WelcomeScreen } from './screens/WelcomeScreen';
import { DebuggerLayout } from './components/layout/DebuggerLayout';
import { ConsoleScreen } from './screens/ConsoleScreen';
import { ReduxScreen } from './screens/ReduxScreen';
import { NetworkScreen } from './screens/NetworkScreen';
import { StorageScreen } from './screens/StorageScreen';
import { PerformanceScreen } from './screens/PerformanceScreen';

export function App() {
  const [isConnected, setIsConnected] = useState(true); // This would come from your connection logic

  const router = createBrowserRouter([
    {
      path: '/',
      element: <WelcomeScreen isConnected={isConnected} />,
    },
    {
      path: '/debugger',
      element: <DebuggerLayout isConnected={isConnected} />,
      children: [
        {
          index: true,
          element: <Navigate to="/debugger/console" replace />,
        },
        {
          path: 'console',
          element: <ConsoleScreen />,
        },
        {
          path: 'redux',
          element: <ReduxScreen />,
        },
        {
          path: 'network',
          element: <NetworkScreen />,
        },
        {
          path: 'storage',
          element: <StorageScreen />,
        },
        {
          path: 'performance',
          element: <PerformanceScreen />,
        },
      ],
    },
  ]);

  return <RouterProvider router={router} />;
}
