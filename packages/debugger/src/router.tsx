import { createBrowserRouter, Navigate } from 'react-router-dom';
import { ConsoleScreen } from '@/screens/ConsoleScreen';
import ConnectionGateScreen from '@/screens/ConnectionGateScreen';
import { DebuggerLayout } from './layout/DebuggerLayout';
import { NetworkScreen } from './screens/NetworkScreen';
import { ReduxScreen } from './screens/ReduxScreen/ReduxScreen';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  return children;
}

export const router = createBrowserRouter([
  {
    path: '/',
    element: <ConnectionGateScreen />,
  },
  {
    path: '/debugger',
    element: (
      <ProtectedRoute>
        <DebuggerLayout />
      </ProtectedRoute>
    ),
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
    ],
  },
]);
