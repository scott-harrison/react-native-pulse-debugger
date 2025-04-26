import React from 'react';
import ReactDOM from 'react-dom/client';
import { RouterProvider } from 'react-router-dom';
import { router } from '@/router';
import { WebSocketProvider } from '@/context/WebSocketContext';
import './styles.css';

// Create root element if it doesn't exist
const rootElement = document.getElementById('root') || document.createElement('div');
if (!rootElement.id) {
  rootElement.id = 'root';
  document.body.appendChild(rootElement);
}

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <WebSocketProvider wsUrl="ws://localhost:8379">
      <RouterProvider router={router} />
    </WebSocketProvider>
  </React.StrictMode>
);
