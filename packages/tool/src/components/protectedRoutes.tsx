import React from 'react';
import { Navigate } from 'react-router-dom';
import useSessionStore from '@/store/sessionStore';

interface ProtectedRouteProps {
    children: React.ReactElement;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
    const currentSessionId = useSessionStore(state => state.currentSessionId);

    if (!currentSessionId) {
        return <Navigate to="/welcome" />;
    }

    return children;
};

export default ProtectedRoute;
