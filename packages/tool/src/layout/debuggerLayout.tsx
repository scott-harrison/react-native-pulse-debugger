import { Outlet, useNavigate } from 'react-router-dom';
import Sidebar from '@/components/sidebar';
import useSessionStore from '@/store/sessionStore';
import { useLayoutEffect } from 'react';

const DebuggerLayout = () => {
    const { currentSessionId } = useSessionStore(state => state);
    const navigate = useNavigate();

    useLayoutEffect(() => {
        if (!currentSessionId) {
            navigate('/welcome');
        }
    }, [currentSessionId]);

    return (
        <div className="flex h-full">
            <Sidebar />
            {/* Main Content */}
            <main className="flex-grow overflow-y-hidden">
                <Outlet />
            </main>
        </div>
    );
};

export default DebuggerLayout;
