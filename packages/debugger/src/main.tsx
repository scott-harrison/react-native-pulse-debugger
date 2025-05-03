import React from 'react';
import ReactDOM from 'react-dom/client';
import { RouterProvider } from 'react-router-dom';
import { router } from './router';
import { WebSocketProvider } from '@/context/WebSocketContext';
import { consoleStore } from './store/consoleStore';
import '@/styles.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <WebSocketProvider consoleStore={consoleStore}>
      <RouterProvider router={router} />
    </WebSocketProvider>
  </React.StrictMode>
);
