import Button from '@/components/button';
import React from 'react';
import { motion } from 'framer-motion';
import { Session } from '@react-native-pulse-debugger/types';
import { useNavigate } from 'react-router-dom';
import useSessionStore from '@/store/sessionStore';

interface SessionsWindowProps {
    onClose: () => void;
}

const SessionsWindow: React.FC<SessionsWindowProps> = ({ onClose }) => {
    const { sessions, setCurrentSession, currentSessionId } = useSessionStore(state => state);
    const navigate = useNavigate();

    const handleOpenSession = (sessionId: Session['id']) => {
        setCurrentSession(sessionId);
        navigate('/debugger');
        onClose();
    };

    return (
        <motion.div
            key="sessions"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="flex flex-col max-h-2/3 items-start relative inset-0 backdrop-blur-xl bg-gray-900/80 rounded-lg border border-gray-800/50 p-6 w-full max-w-max-4xl overflow-hidden"
        >
            <div className="flex flex-col gap-4 w-full h-full">
                <div className="flex justify-between items-center w-full">
                    <h2 className="text-xl font-semibold">Available Sessions</h2>
                    <Button variant="outline" size="sm" onClick={onClose}>
                        Close
                    </Button>
                </div>
                {sessions.length === 0 ? (
                    <div className="text-gray-400 text-sm">
                        <span className="animate-pulse">Awaiting connection from your app...</span>
                    </div>
                ) : (
                    <div className="space-y-2 overflow-y-auto max-h-[60vh] pr-2">
                        {sessions
                            .filter(session => session.id !== currentSessionId)
                            .map(session => (
                                <div
                                    key={session.id}
                                    className="flex flex-row items-center justify-between p-3 bg-gray-800/50 rounded-md border border-gray-700/50"
                                >
                                    <div className="flex flex-col gap-1">
                                        <div className="text-sm font-medium">
                                            {session.deviceInfo.model} -{' '}
                                            <span className="text-xs text-gray-500 font-mono font-bold">
                                                ({session.id})
                                            </span>
                                        </div>
                                        <div className="text-xs text-gray-400">
                                            {session.deviceInfo.systemName} (
                                            {session.deviceInfo.systemVersion})
                                        </div>
                                        <div className="text-xs text-gray-400">
                                            App: {session.deviceInfo.appName}
                                        </div>
                                        <div className="text-xs text-gray-400">
                                            Version: {session.deviceInfo.appVersion}
                                        </div>
                                    </div>
                                    <div className="text-xs text-gray-400">
                                        <Button
                                            variant="primary"
                                            size="sm"
                                            onClick={() => handleOpenSession(session.id)}
                                        >
                                            Open
                                        </Button>
                                    </div>
                                </div>
                            ))}
                    </div>
                )}
            </div>
        </motion.div>
    );
};

export default SessionsWindow;
