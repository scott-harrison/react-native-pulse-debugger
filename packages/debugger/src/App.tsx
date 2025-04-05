import { RouterProvider } from 'react-router-dom';
import { router } from './router';
import { ConnectionProvider } from './lib/connection';

export function App() {
  return (
    <ConnectionProvider>
      <RouterProvider router={router} />
    </ConnectionProvider>
  );
}
