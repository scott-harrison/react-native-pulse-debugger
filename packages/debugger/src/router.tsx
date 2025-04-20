import { createBrowserRouter, Navigate } from 'react-router-dom';
import { WelcomeScreen } from './screens/WelcomeScreen';
import { DebuggerLayout } from './components/layout/DebuggerLayout';
import { ConsoleScreen } from './screens/ConsoleScreen';
import { ReduxScreen } from './screens/ReduxScreen';
import { NetworkScreen } from './screens/NetworkScreen';
import { StorageScreen } from './screens/StorageScreen';
import { AppLayout } from './components/layout/AppLayout';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  return children;
}

export const router = createBrowserRouter([
  {
    path: '/',
    element: (
      <AppLayout>
        <WelcomeScreen />
      </AppLayout>
    ),
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
