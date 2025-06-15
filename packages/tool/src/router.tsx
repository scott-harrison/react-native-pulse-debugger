import { createBrowserRouter, Navigate } from 'react-router-dom';
import WelcomeScreen from '@/screens/Welcome';
import ConsoleScreen from '@/screens/Console';
import ReduxScreen from '@/screens/Redux';
import NetworkScreen from '@/screens/Network';
import ProtectedRoute from '@/components/protectedRoutes';
import DebuggerLayout from '@/layout/debuggerLayout';

const router = createBrowserRouter([
    {
        path: '/',
        element: <Navigate to="/welcome" />,
    },
    {
        path: '/welcome',
        element: <WelcomeScreen />,
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

export default router;
