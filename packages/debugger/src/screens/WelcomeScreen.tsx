import { useConnection } from '@/lib/connection';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { ArrowRight, CheckCircle, Zap, Network, Layers, Terminal } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';

export function WelcomeScreen() {
  const { connectionState, sendMessage } = useConnection();
  const navigate = useNavigate();
  const [isInitialBoot, setIsInitialBoot] = useState(true);
  const [showConnectButton, setShowConnectButton] = useState(false);

  // Check if this is the initial boot
  useEffect(() => {
    const hasSeenWelcome = localStorage.getItem('hasSeenWelcome');
    if (hasSeenWelcome) {
      setIsInitialBoot(false);
    } else {
      localStorage.setItem('hasSeenWelcome', 'true');
    }
  }, []);

  // Show connect button after a short delay if connected
  useEffect(() => {
    console.log('Connection state changed:', connectionState);
    if (connectionState.status === 'connected') {
      const timer = setTimeout(() => {
        setShowConnectButton(true);
      }, 1000);
      return () => clearTimeout(timer);
    } else {
      setShowConnectButton(false);
    }
  }, [connectionState]);

  const handleConnect = () => {
    navigate('/debugger');
  };

  return (
    <AppLayout>
      <div className="flex-1 flex items-center justify-center p-8">
        <Card className="w-full max-w-4xl shadow-2xl border-2 border-purple-900/20 bg-black/60 backdrop-blur-sm">
          <CardHeader className="text-center pb-2">
            <div className="flex justify-center mb-4">
              <div className="bg-black p-3 rounded-full shadow-lg border border-purple-900/20">
                <Zap className="h-12 w-12 text-purple-400" />
              </div>
            </div>
            <CardTitle className="text-3xl font-bold tracking-tight text-white">
              Pulse Debugger
            </CardTitle>
            <CardDescription className="text-lg mt-2 text-gray-300">
              Real-time debugging for React Native applications
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 w-full">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full">
              <div className="flex flex-col items-center p-4 bg-black/40 rounded-lg border border-purple-900/20 hover:border-purple-800/40 transition-colors">
                <div className="bg-black p-2 rounded-full mb-2 shadow-md border border-purple-900/20">
                  <Layers className="h-6 w-6 text-purple-400" />
                </div>
                <h3 className="font-medium text-white">Redux Support</h3>
                <p className="text-sm text-gray-400 text-center mt-1">
                  Monitor Redux state and actions in real-time
                </p>
              </div>
              <div className="flex flex-col items-center p-4 bg-black/40 rounded-lg border border-purple-900/20 hover:border-purple-800/40 transition-colors">
                <div className="bg-black p-2 rounded-full mb-2 shadow-md border border-purple-900/20">
                  <Network className="h-6 w-6 text-purple-400" />
                </div>
                <h3 className="font-medium text-white">Network Monitoring</h3>
                <p className="text-sm text-gray-400 text-center mt-1">
                  Track API calls and network activity
                </p>
              </div>
              <div className="flex flex-col items-center p-4 bg-black/40 rounded-lg border border-purple-900/20 hover:border-purple-800/40 transition-colors">
                <div className="bg-black p-2 rounded-full mb-2 shadow-md border border-purple-900/20">
                  <Terminal className="h-6 w-6 text-purple-400" />
                </div>
                <h3 className="font-medium text-white">Console Logging</h3>
                <p className="text-sm text-gray-400 text-center mt-1">
                  View console logs and errors in real-time
                </p>
              </div>
            </div>

            <div className="flex items-center justify-center space-x-2 text-sm text-gray-300 bg-black/40 p-3 rounded-lg border border-purple-900/20">
              {connectionState.status === 'connected' ? (
                <>
                  <CheckCircle className="h-4 w-4 text-emerald-400" />
                  <span>Connected to {connectionState.appInfo?.name || 'React Native app'}</span>
                </>
              ) : (
                <>
                  <span className="w-2 h-2 bg-orange-400 rounded-full animate-pulse mr-2"></span>
                  <span>Waiting for connection...</span>
                </>
              )}
            </div>
          </CardContent>
          <CardFooter className="flex justify-center pt-2">
            {showConnectButton && connectionState.status === 'connected' ? (
              <Button
                size="lg"
                className="px-8 bg-black hover:bg-purple-950 text-white border border-purple-900/20 shadow-lg transition-all duration-300"
                onClick={handleConnect}
              >
                Start Debugging
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            ) : null}
          </CardFooter>
        </Card>
      </div>
    </AppLayout>
  );
}
