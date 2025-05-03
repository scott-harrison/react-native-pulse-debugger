import React from 'react';
import WindowLayout from '@/layout/window';
import { RouterProvider } from 'react-router-dom';
import router from './router';

const App: React.FC = () => {
  return (
    <WindowLayout>
      <RouterProvider router={router} />
    </WindowLayout>
  );
};

export default App;
