import React from 'react';
import WindowLayout from '@/layout/window';
import { RouterProvider } from 'react-router-dom';
import router from './router';
import { useWebSocketRelay } from './hooks/useWebSocketRelay';

const App: React.FC = () => {
    useWebSocketRelay();

    return (
        <WindowLayout>
            <RouterProvider router={router} />
        </WindowLayout>
    );
};

export default App;
