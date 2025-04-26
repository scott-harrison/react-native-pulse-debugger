import { createBrowserRouter, Navigate } from 'react-router-dom';
// import { DebuggerLayout } from '@/ui/components/layout/DebuggerLayout';
// import { ConsoleScreen } from '@/ui/screens/ConsoleScreen';
// import { ReduxScreen } from '@/ui/screens/ReduxScreen';
// import { NetworkScreen } from '@/ui/screens/NetworkScreen';
// import { StorageScreen } from '@/ui/screens/StorageScreen';
import ConnectionGateScreen from '@/ui/screens/ConnectionGateScreen';

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
        <></>
      </ProtectedRoute>
    ),
    children: [
      {
        index: true,
        element: <Navigate to="/debugger/console" replace />,
      },
      {
        path: 'console',
        element: (
          <>
            <h1>Console Screen</h1>
          </>
        ),
      },
      {
        path: 'redux',
        element: (
          <>
            <h1>Redux Screen</h1>
          </>
        ),
      },
      {
        path: 'network',
        element: (
          <>
            <h1>Network Screen</h1>
          </>
        ),
      },
    ],
  },
]);
