import Fireflies from '@/components/fireflies';
import Loader from '@/components/loader';
import useSessionStore from '@/store/sessionStore';
import { useNavigate } from 'react-router-dom';

const WelcomeScreen = () => {
	const { sessions, setCurrentSession } = useSessionStore(state => state);
	const navigate = useNavigate();

	const handleDebugSession = (sessionId: string) => {
		setCurrentSession(sessionId);
		// Navigate to the debugger console for the selected session
		navigate(`/debugger/console`);
	};

	return (
		<div className="relative flex flex-col items-center justify-center h-full bg-gradient-to-b from-gray-900 to-purple-950 text-white">
			<Fireflies />
			<div className="flex flex-col items-center justify-center relative z-50">
				<h1 className="text-5xl leading-loose font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-700 to-purple-500 mb-4 animate-[fadeIn_1s_ease-in-out]">
					Pulse Debugger
				</h1>
				<p className="text-xl font-medium text-gray-300 mb-8 animate-[fadeIn_1.2s_ease-in-out]">
					Welcome to your debugging experience
				</p>

				{sessions.length === 0 ? (
					<>
						<p className="text-sm text-gray-400 font-medium mb-6 animate-[fadeIn_1.4s_ease-in-out]">
							Waiting for connection...
						</p>
						<Loader />
					</>
				) : (
					<div className="flex flex-wrap justify-center gap-6 w-full max-w-6xl">
						{sessions.map(session => (
							<div
								key={session.id}
								className="bg-gray-800 rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow duration-300 w-full sm:w-96"
							>
								<h3 className="text-lg font-semibold text-purple-400 mb-2">
									{session.deviceInfo.appName}
								</h3>
								<p className="text-sm text-gray-300 mb-1">
									<strong>Device:</strong> {session.deviceInfo.model}
								</p>
								<p className="text-sm text-gray-400 mb-4">
									<strong>Session ID:</strong> {session.id}
								</p>
								<button
									onClick={() => handleDebugSession(session.id)}
									className="bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-700 hover:to-purple-600 text-white text-sm font-medium py-2 px-4 rounded-lg shadow-md transition-transform transform hover:scale-105"
								>
									Debug
								</button>
							</div>
						))}
					</div>
				)}
			</div>
		</div>
	);
};

export default WelcomeScreen;
