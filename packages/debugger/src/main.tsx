import React from 'react';
import ReactDOM from 'react-dom/client';
import { RouterProvider } from 'react-router-dom';
import { router } from './router';
import './styles.css';
import { ConnectionProvider } from './lib/connection';

// Create root element if it doesn't exist
const rootElement = document.getElementById('root') || document.createElement('div');
if (!rootElement.id) {
  rootElement.id = 'root';
  document.body.appendChild(rootElement);
}

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <ConnectionProvider>
      <RouterProvider router={router} />
    </ConnectionProvider>
  </React.StrictMode>
);
