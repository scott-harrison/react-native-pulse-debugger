import React from 'react';
import WindowLayout from '@/layout/window';
import { RouterProvider } from 'react-router-dom';
import router from './router';
import { useWebSocketListener } from './hooks/useWebSocketListener';

const App: React.FC = () => {
  useWebSocketListener();

  return (
    <WindowLayout>
      <RouterProvider router={router} />
    </WindowLayout>
  );
};

export default App;
