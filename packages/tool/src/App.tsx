import React from 'react';
import WindowLayout from '@/layout/window';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import WelcomeScreen from '@/screens/Welcome';
import ConsoleScreen from '@/screens/Console';
import ReduxScreen from '@/screens/Redux';
import NetworkScreen from '@/screens/Network';
import ProtectedRoute from '@/components/protectedRoutes';
import DebuggerLayout from '@/layout/debuggerLayout';
import { useWebSocketRelay } from './hooks/useWebSocketRelay';

const App: React.FC = () => {
    useWebSocketRelay();

    return (
        <WindowLayout>
            <HashRouter>
                <Routes>
                    <Route path="/" element={<Navigate to="/welcome" />} />
                    <Route path="/welcome" element={<WelcomeScreen />} />
                    <Route
                        path="/debugger"
                        element={
                            <ProtectedRoute>
                                <DebuggerLayout />
                            </ProtectedRoute>
                        }
                    >
                        <Route index element={<Navigate to="console" replace />} />
                        <Route path="console" element={<ConsoleScreen />} />
                        <Route path="redux" element={<ReduxScreen />} />
                        <Route path="network" element={<NetworkScreen />} />
                    </Route>
                </Routes>
            </HashRouter>
        </WindowLayout>
    );
};

export default App;
