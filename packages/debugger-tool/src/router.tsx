import { createBrowserRouter, Navigate } from 'react-router-dom';
import WelcomeScreen from './screens/Welcome';
import ConsoleScreen from './screens/Console';
import ReduxScreen from './screens/Redux';
import NetworkScreen from './screens/Network';

const isConnected = () => {
  // Replace this with your actual connection check logic
  return Boolean(localStorage.getItem('isConnected'));
};

const router = createBrowserRouter([
  {
    path: '/',
    element: isConnected() ? <Navigate to="/debugger/console" /> : <Navigate to="/welcome" />,
  },
  {
    path: '/welcome',
    element: <WelcomeScreen />,
  },
  {
    path: '/debugger',
    children: [
      {
        path: 'console',
        element: isConnected() ? <ConsoleScreen /> : <Navigate to="/welcome" />,
      },
      {
        path: 'redux',
        element: isConnected() ? <ReduxScreen /> : <Navigate to="/welcome" />,
      },
      {
        path: 'network',
        element: isConnected() ? <NetworkScreen /> : <Navigate to="/welcome" />,
      },
    ],
  },
]);

export default router;
