import Button from '@/components/button';
import Fireflies from '@/components/fireflies';
import SessionsWindow from '@/components/SessionsWindow';
import Modal from '@/components/modal';
import React, { useState } from 'react';
import useSessionStore from '@/store/sessionStore';
import { motion } from 'framer-motion';
import { useConnectionCheck } from '@/hooks/useConnectionCheck';

const WelcomeScreen: React.FC = () => {
    const { sessions } = useSessionStore(state => state);
    const [showSessions, setShowSessions] = useState(false);
    useConnectionCheck();

    return (
        <div className="relative flex flex-col items-center justify-center h-full bg-gradient-to-b from-gray-900 to-purple-950 text-white">
            {!showSessions && (
                <motion.div
                    key="welcome"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.1, ease: 'easeInOut' }}
                    className="flex flex-col items-start justify-center max-w-xl mx-10 relative"
                >
                    <div className="absolute inset-0 backdrop-blur-xl bg-gray-900/80 rounded-lg border border-gray-800/50" />
                    <div className="px-6 py-8 z-1 flex flex-col gap-4">
                        <h1 className="text-4xl font-bold font-hacker">Pulse Debugger</h1>
                        <p className="text-sm text-gray-400 font-mono">
                            Welcome to the React Native Pulse Debugger. This is a tool for debugging
                            React Native applications.
                        </p>
                        <div className="flex gap-2">
                            <Button
                                variant="primary"
                                size="md"
                                onClick={() => setShowSessions(true)}
                            >
                                Get Started
                            </Button>
                            {sessions.length > 0 && (
                                <div className="flex items-center gap-2 rounded-md bg-green-900/20 p-2 animate-pulse">
                                    <span className="text-sm text-green-500">
                                        Sessions are available!
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>
                </motion.div>
            )}
            <Modal isOpen={showSessions} onClose={() => setShowSessions(false)}>
                <SessionsWindow onClose={() => setShowSessions(false)} />
            </Modal>
            <Fireflies />
        </div>
    );
};

export default WelcomeScreen;
